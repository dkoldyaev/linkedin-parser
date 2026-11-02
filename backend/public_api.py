"""Public API v1 router definition.
Access is restricted strictly to Personal API Keys (via header X-API-Key or Authorization: Bearer ak_...).
This router is mounted under /api/v1 and provides full OpenAPI documentation.
"""
from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .database import get_db
from .models import User, Vacancy, VacancyStatusHistory, VALID_STATUSES
from .schemas import (
    VacancyResponse,
    VacancyCreate,
    VacancyUpdate,
    VacancyHistoryItem,
    VacancyHistoryCreate,
    CheckDuplicatesRequest,
    CheckDuplicatesResponse,
    DuplicateVacancyInfo,
    BatchImportRequest,
    BatchImportResponse,
    AsyncBatchImportResponse,
    ImportItemResult,
    ColumnItem,
)
from .auth import get_current_user_from_api_key
from .scraper import extract_job_id, normalize_url
from .main import get_user_valid_statuses, get_user_columns, queue_manager, JobTask, TASK_KEY_PREFIX, TASK_TTL, AI_QUEUE_KEY, RECENT_LIST
import uuid
import time
import asyncio
from .mercure import (
    publish_mercure_event,
    EVENT_VACANCY_CREATED,
    EVENT_VACANCY_UPDATED,
    EVENT_VACANCY_DELETED,
    EVENT_QUEUE_UPDATED,
    MSG_VACANCY_CREATED,
    MSG_VACANCY_UPDATED,
    MSG_VACANCY_DELETED,
    MSG_QUEUE_UPDATED,
)
import datetime

router = APIRouter(
    prefix="",
    tags=["Vacancies"],
    dependencies=[Depends(get_current_user_from_api_key)],
)


@router.get("/vacancies", response_model=List[VacancyResponse], summary="List vacancies")
def list_vacancies(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by column status"),
    tag: Optional[str] = Query(None, description="Filter by tag label"),
    country: Optional[str] = Query(None, description="Filter by country"),
    city: Optional[str] = Query(None, description="Filter by city"),
    workplace_type: Optional[str] = Query(None, description="Filter by workplace type (remote, hybrid, on-site)"),
    source: Optional[str] = Query(None, description="Filter by source board name"),
    is_closed: Optional[bool] = Query(None, description="Filter by active/closed status"),
    search: Optional[str] = Query(None, description="Search keyword in title, company, stack, description"),
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Retrieve all vacancies belonging to the authenticated API key user with optional filtering."""
    query = db.query(Vacancy).filter(Vacancy.user_id == current_user.id)

    valid_statuses = get_user_valid_statuses(db, current_user.id)
    if status_filter and (status_filter in valid_statuses or status_filter in VALID_STATUSES):
        query = query.filter(Vacancy.status == status_filter)

    if country and country.strip():
        query = query.filter(Vacancy.country.ilike(country.strip()))

    if city and city.strip():
        query = query.filter(Vacancy.city.ilike(city.strip()))

    if workplace_type and workplace_type.strip():
        query = query.filter(Vacancy.workplace_type.ilike(workplace_type.strip()))

    if source and source.strip():
        query = query.filter(Vacancy.source.ilike(source.strip()))

    if is_closed is not None:
        query = query.filter(Vacancy.is_closed == is_closed)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Vacancy.title.ilike(search_fmt),
                Vacancy.company.ilike(search_fmt),
                Vacancy.location.ilike(search_fmt),
                Vacancy.city.ilike(search_fmt),
                Vacancy.country.ilike(search_fmt),
                Vacancy.description.ilike(search_fmt),
                Vacancy.ai_summary.ilike(search_fmt),
                Vacancy.source.ilike(search_fmt),
            )
        )

    vacancies = query.order_by(Vacancy.updated_at.desc()).all()

    if tag:
        tag_lower = tag.strip().lower()
        vacancies = [
            v for v in vacancies
            if any(t.lower() == tag_lower for t in (v.tags or []))
        ]

    return vacancies


@router.get("/vacancies/{vacancy_id}", response_model=VacancyResponse, summary="Get vacancy details")
def get_vacancy(
    vacancy_id: int,
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Retrieve details for a specific vacancy by ID."""
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return v


@router.post("/vacancies", response_model=VacancyResponse, summary="Create vacancy")
async def create_vacancy(
    payload: VacancyCreate,
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Create a new vacancy card."""
    data = payload.model_dump()
    data["user_id"] = current_user.id
    valid_statuses = get_user_valid_statuses(db, current_user.id)
    if data.get("status") and data["status"] not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    v = Vacancy(**data)
    db.add(v)
    db.flush()

    history_entry = VacancyStatusHistory(
        vacancy_id=v.id,
        from_status=None,
        to_status=v.status,
        comment=None,
        created_at=v.created_at,
    )
    db.add(history_entry)
    db.commit()
    db.refresh(v)

    mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
    vacancy_data = VacancyResponse.model_validate(v).model_dump(mode="json")
    asyncio.create_task(
        publish_mercure_event(
            event_type=EVENT_VACANCY_CREATED,
            data={
                "message_code": MSG_VACANCY_CREATED,
                "vacancy": vacancy_data,
                "url": v.url,
            },
            topic=mercure_topic,
        )
    )
    return v


@router.patch("/vacancies/{vacancy_id}", response_model=VacancyResponse, summary="Update vacancy")
async def update_vacancy(
    vacancy_id: int,
    payload: VacancyUpdate,
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Update vacancy details, tags, status, notes or salary."""
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    update_data = payload.model_dump(exclude_unset=True)
    valid_statuses = get_user_valid_statuses(db, current_user.id)
    if "status" in update_data and update_data["status"] not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    status_comment = update_data.pop("status_comment", None)
    if "status" in update_data and update_data["status"] != v.status:
        old_status = v.status
        new_status = update_data["status"]
        history_entry = VacancyStatusHistory(
            vacancy_id=v.id,
            from_status=old_status,
            to_status=new_status,
            comment=status_comment,
            created_at=datetime.datetime.utcnow(),
        )
        db.add(history_entry)
        if "sort_order" not in update_data:
            v.sort_order = None
            v.lane = 0

    for field, val in update_data.items():
        setattr(v, field, val)

    db.commit()
    db.refresh(v)

    mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
    vacancy_data = VacancyResponse.model_validate(v).model_dump(mode="json")
    asyncio.create_task(
        publish_mercure_event(
            event_type=EVENT_VACANCY_UPDATED,
            data={
                "message_code": MSG_VACANCY_UPDATED,
                "vacancy": vacancy_data,
            },
            topic=mercure_topic,
        )
    )
    return v


@router.delete("/vacancies/{vacancy_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete vacancy")
async def delete_vacancy(
    vacancy_id: int,
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Delete a vacancy card."""
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    title = v.title
    db.delete(v)
    db.commit()

    mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
    asyncio.create_task(
        publish_mercure_event(
            event_type=EVENT_VACANCY_DELETED,
            data={
                "message_code": MSG_VACANCY_DELETED,
                "vacancy_id": vacancy_id,
                "title": title,
            },
            topic=mercure_topic,
        )
    )
    return None


@router.post("/vacancies/check-duplicates", response_model=CheckDuplicatesResponse, summary="Check duplicate URLs")
async def check_duplicates(
    payload: CheckDuplicatesRequest,
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Check if links already exist in the user's database."""
    duplicates: List[DuplicateVacancyInfo] = []
    seen_ids = set()

    for raw_url in payload.urls:
        u = raw_url.strip()
        if not u:
            continue
        canonical_url = normalize_url(u) or u
        job_id = extract_job_id(canonical_url) or extract_job_id(u)

        existing = None
        if job_id:
            existing = db.query(Vacancy).filter(
                Vacancy.job_id == job_id,
                Vacancy.user_id == current_user.id,
            ).first()
        if not existing:
            existing = db.query(Vacancy).filter(
                (Vacancy.url == canonical_url) | (Vacancy.url == u),
                Vacancy.user_id == current_user.id,
            ).first()

        if existing and existing.id not in seen_ids:
            seen_ids.add(existing.id)
            duplicates.append(
                DuplicateVacancyInfo(
                    id=existing.id,
                    url=existing.url,
                    input_url=u,
                    job_id=existing.job_id,
                    title=existing.title,
                    company=existing.company,
                    status=existing.status,
                )
            )

    return CheckDuplicatesResponse(
        has_duplicates=len(duplicates) > 0,
        duplicates=duplicates,
    )


@router.post("/vacancies/batch", response_model=Union[AsyncBatchImportResponse, BatchImportResponse], summary="Batch import vacancies")
async def batch_import_vacancies(
    payload: BatchImportRequest,
    async_mode: bool = Query(True, description="Queue links asynchronously or process synchronously"),
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Enqueue multiple vacancy URLs for parsing and AI analysis."""
    urls = [u.strip() for u in payload.urls if u.strip()]
    if not urls:
        raise HTTPException(status_code=400, detail="No URLs provided")

    initial_tags = [t.strip() for t in payload.default_tags if t.strip()]

    if async_mode:
        batch_id, tasks = await queue_manager.enqueue(
            urls=urls,
            default_tags=initial_tags,
            user_id=current_user.id,
        )
        task_infos = [t.to_task_info() for t in tasks]
        return AsyncBatchImportResponse(
            status="queued",
            queued=len(task_infos),
            batch_id=batch_id,
            message=f"Queued {len(task_infos)} tasks for asynchronous processing",
            tasks=task_infos,
        )

    # Synchronous processing fallback
    from .scraper import scrape_job
    from .llm import analyze_vacancy_with_llm
    results = []
    imported_count = 0
    failed_count = 0

    for url in urls:
        canonical_url = normalize_url(url) or url
        job_id = extract_job_id(canonical_url) or extract_job_id(url)
        try:
            scraped = await scrape_job(canonical_url)
            if not scraped or not scraped.get("title"):
                failed_count += 1
                results.append(ImportItemResult(url=url, success=False, error="Failed to scrape page"))
                continue

            llm_res = await analyze_vacancy_with_llm(
                title=scraped.get("title", ""),
                company=scraped.get("company", ""),
                location=scraped.get("location", ""),
                description=scraped.get("description", ""),
                db=db,
                user_id=current_user.id,
            )

            new_v = Vacancy(
                user_id=current_user.id,
                job_id=scraped.get("job_id"),
                source=scraped.get("source"),
                url=canonical_url,
                title=scraped.get("title") or "Untitled",
                company=scraped.get("company") or "Unknown",
                company_url=scraped.get("company_url"),
                company_info=llm_res.get("company_info") or scraped.get("company_info"),
                location=llm_res.get("location") if (not scraped.get("location") or scraped.get("location") == "Not specified") else scraped.get("location"),
                city=scraped.get("city"),
                country=scraped.get("country"),
                description=scraped.get("description"),
                workplace_type=llm_res.get("workplace_type") or scraped.get("workplace_type"),
                is_closed=scraped.get("is_closed", False),
                salary_min=llm_res.get("salary_min"),
                salary_max=llm_res.get("salary_max"),
                salary_currency=llm_res.get("salary_currency"),
                salary_period=llm_res.get("salary_period"),
                ai_summary=llm_res.get("summary"),
                tech_stack=llm_res.get("tech_stack", []),
                tags=initial_tags,
                status="Еще не написан",
            )
            db.add(new_v)
            db.flush()
            db.add(VacancyStatusHistory(
                vacancy_id=new_v.id,
                from_status=None,
                to_status=new_v.status,
                created_at=new_v.created_at,
            ))
            db.commit()
            db.refresh(new_v)
            imported_count += 1
            results.append(ImportItemResult(
                url=url,
                job_id=job_id,
                success=True,
                title=new_v.title,
                company=new_v.company,
                vacancy_id=new_v.id,
            ))
        except Exception as e:
            failed_count += 1
            results.append(ImportItemResult(url=url, success=False, error=str(e)))

    return BatchImportResponse(
        total=len(urls),
        imported=imported_count,
        failed=failed_count,
        results=results,
    )


@router.get("/columns", response_model=List[ColumnItem], tags=["Kanban"], summary="List Kanban columns")
def list_columns(
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db)
):
    """List Kanban columns and stages configured for the user."""
    cols = get_user_columns(db, current_user.id)
    return [ColumnItem(**c) for c in cols]


@router.get("/tags", response_model=List[str], tags=["Metadata"], summary="List unique tags")
def list_tags(
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db)
):
    """List all distinct tag labels across user vacancies."""
    vacancies = db.query(Vacancy).filter(Vacancy.user_id == current_user.id).all()
    all_tags = set()
    for v in vacancies:
        for t in (v.tags or []):
            if t and t.strip():
                all_tags.add(t.strip())
    return sorted(list(all_tags))


@router.get("/sources", response_model=List[str], tags=["Metadata"], summary="List job sources")
def list_sources(
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db)
):
    """List distinct job sources (e.g. LinkedIn, Upwork, Habr Career)."""
    vacancies = (
        db.query(Vacancy.source)
        .filter(Vacancy.user_id == current_user.id, Vacancy.source.isnot(None))
        .distinct()
        .all()
    )
    sources = {v[0].strip() for v in vacancies if v[0] and v[0].strip() and v[0].strip().lower() not in ('null', 'none', 'n/a')}
    return sorted(list(sources))
