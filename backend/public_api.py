"""Public API v1 router definition.
Access is restricted strictly to Personal API Keys (via header X-API-Key or Authorization: Bearer ak_...).
This router is mounted under /api/v1 and provides full OpenAPI documentation.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .query_helpers import filter_tag, duplicate_response
from .database import get_db
from .models import (
    User,
    Vacancy,
    VacancyStatusHistory,
    ApprovedCV,
    VacancyCVAnalysis,
    AdaptedCVVersion,
    VALID_STATUSES,
    ProcessingQueueItem,
)
from .schemas import (
    VacancyResponse,
    VacancyCreate,
    VacancyUpdate,
    VacancyHistoryItem,
    CheckDuplicatesRequest,
    CheckDuplicatesResponse,
    DuplicateVacancyInfo,
    BatchImportRequest,
    AsyncBatchImportResponse,
    TaskInfo,
    ColumnItem,
    ApprovedCVResponse,
    VacancyCVAnalysisResponse,
    AdaptedCVVersionResponse,
    ProcessingLinkInfo,
    QueueLinksResponse,
)
from .auth import get_current_user_from_api_key
from .scraper import extract_job_id, normalize_url
from .main import get_user_valid_statuses, get_user_columns, queue_manager
import asyncio
from .mercure import (
    publish_mercure_event,
    EVENT_VACANCY_CREATED,
    EVENT_VACANCY_UPDATED,
    EVENT_VACANCY_DELETED,
    MSG_VACANCY_CREATED,
    MSG_VACANCY_UPDATED,
    MSG_VACANCY_DELETED,
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
    limit: int = Query(50, ge=1, le=200, description="Max number of items to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Retrieve vacancies belonging to the authenticated API key user with optional filtering and pagination."""
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

    query = filter_tag(query, db, tag)
    return query.order_by(Vacancy.updated_at.desc(), Vacancy.id.desc()).offset(offset).limit(limit).all()


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


@router.get(
    "/vacancies/{vacancy_id}/history",
    response_model=List[VacancyHistoryItem],
    summary="Get vacancy status history",
)
def get_vacancy_history(
    vacancy_id: int,
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Retrieve status change and movement history for a vacancy."""
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    history = (
        db.query(VacancyStatusHistory)
        .filter(VacancyStatusHistory.vacancy_id == vacancy_id)
        .order_by(VacancyStatusHistory.created_at.desc())
        .all()
    )
    return history


@router.get(
    "/vacancies/{vacancy_id}/compatibility",
    response_model=Optional[VacancyCVAnalysisResponse],
    summary="Get vacancy CV compatibility score",
)
def get_vacancy_compatibility(
    vacancy_id: int,
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Returns the latest compatibility analysis between the vacancy and user's approved CV."""
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    analysis = db.query(VacancyCVAnalysis).filter(
        VacancyCVAnalysis.vacancy_id == vacancy_id,
        VacancyCVAnalysis.user_id == current_user.id,
    ).first()

    if not analysis:
        return None

    approved_cv = db.query(ApprovedCV).filter(ApprovedCV.user_id == current_user.id).first()
    is_outdated = analysis.is_outdated or (approved_cv is not None and analysis.cv_revision != approved_cv.revision)

    res_data = analysis.result or {}
    versions_list = db.query(AdaptedCVVersion).filter(
        AdaptedCVVersion.analysis_id == analysis.id
    ).order_by(AdaptedCVVersion.version_number.desc()).all()

    return VacancyCVAnalysisResponse(
        id=analysis.id,
        user_id=analysis.user_id,
        vacancy_id=analysis.vacancy_id,
        cv_revision=analysis.cv_revision,
        scoring_policy_version=analysis.scoring_policy_version,
        model_id=analysis.model_id,
        overall_score=analysis.overall_score,
        llm_score=res_data.get("llmScore"),
        calculated_score=res_data.get("calculatedScore"),
        is_outdated=is_outdated,
        summary=res_data.get("summary", ""),
        matched_requirements=res_data.get("matchedRequirements", []),
        missing_requirements=res_data.get("missingRequirements", []),
        critical_gaps=res_data.get("criticalGaps", []),
        seniority_assessment=res_data.get("seniorityAssessment"),
        recommendations=res_data.get("recommendations", []),
        dimension_scores=res_data.get("dimensionScores"),
        adapted_cv=analysis.adapted_cv,
        versions=[AdaptedCVVersionResponse.model_validate(ver) for ver in versions_list],
        created_at=analysis.created_at,
        updated_at=analysis.updated_at,
    )


@router.post("/vacancies", response_model=VacancyResponse, summary="Create vacancy")
async def create_vacancy(
    payload: VacancyCreate,
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Create a new vacancy card. Checks for duplicate job_id or url."""
    data = payload.model_dump()
    data["user_id"] = current_user.id

    raw_url = (data.get("url") or "").strip()
    if raw_url:
        canonical_url = normalize_url(raw_url) or raw_url
        data["url"] = canonical_url
        extracted_job_id = extract_job_id(canonical_url) or extract_job_id(raw_url)
        if extracted_job_id and not data.get("job_id"):
            data["job_id"] = extracted_job_id

        # Duplicate check by job_id or url for this user
        existing = None
        if data.get("job_id"):
            existing = db.query(Vacancy).filter(
                Vacancy.job_id == data["job_id"],
                Vacancy.user_id == current_user.id,
            ).first()
        if not existing:
            existing = db.query(Vacancy).filter(
                (Vacancy.url == canonical_url) | (Vacancy.url == raw_url),
                Vacancy.user_id == current_user.id,
            ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Vacancy already exists with ID {existing.id} ('{existing.title}')",
            )

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
    await publish_mercure_event(
            event_type=EVENT_VACANCY_CREATED,
            data={
                "message_code": MSG_VACANCY_CREATED,
                "vacancy": vacancy_data,
                "url": v.url,
            },
            topic=mercure_topic,
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
    await publish_mercure_event(
            event_type=EVENT_VACANCY_UPDATED,
            data={
                "message_code": MSG_VACANCY_UPDATED,
                "vacancy": vacancy_data,
            },
            topic=mercure_topic,
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
    await publish_mercure_event(
            event_type=EVENT_VACANCY_DELETED,
            data={
                "message_code": MSG_VACANCY_DELETED,
                "vacancy_id": vacancy_id,
                "title": title,
            },
            topic=mercure_topic,
        )
    return None


@router.post("/vacancies/check-duplicates", response_model=CheckDuplicatesResponse, summary="Check duplicate URLs")
async def check_duplicates(
    payload: CheckDuplicatesRequest,
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Check if links already exist in the user's database."""
    return duplicate_response(db, current_user.id, payload.urls)


@router.post("/vacancies/batch", response_model=AsyncBatchImportResponse, summary="Batch import vacancies")
async def batch_import_vacancies(
    payload: BatchImportRequest,
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Enqueue multiple vacancy URLs for parsing and AI analysis asynchronously, deduplicating against active queue items."""
    raw_urls = [u.strip() for u in payload.urls if u.strip()]
    if not raw_urls:
        raise HTTPException(status_code=400, detail="No URLs provided")

    # Filter out blank lines, normalize URLs, and deduplicate within batch
    unique_urls = []
    seen = set()
    for raw_u in raw_urls:
        canonical_u = normalize_url(raw_u)
        if canonical_u not in seen:
            seen.add(canonical_u)
            unique_urls.append(canonical_u)

    # Deduplicate against URLs currently active in the queue for this user
    active_in_queue = (
        db.query(ProcessingQueueItem.normalized_url)
        .filter(
            ProcessingQueueItem.user_id == current_user.id,
            ProcessingQueueItem.normalized_url.in_(unique_urls),
            ProcessingQueueItem.status.in_(["pending", "processing"]),
        )
        .all()
        if unique_urls
        else []
    )
    already_queued_urls = {row[0] for row in active_in_queue}
    urls_to_process = [u for u in unique_urls if u not in already_queued_urls]

    if not urls_to_process and already_queued_urls:
        return AsyncBatchImportResponse(
            status="already_queued",
            queued=0,
            batch_id="",
            message="Все переданные ссылки уже находятся в очереди обработки",
            tasks=[],
            already_in_queue=list(already_queued_urls),
        )

    initial_tags = [t.strip() for t in payload.default_tags if t.strip()]

    batch_id, tasks = await queue_manager.enqueue(
        urls=urls_to_process,
        default_tags=initial_tags,
        vacancy_ids=None,
        user_id=current_user.id,
        force_cv_scoring=False,
    )
    task_infos = [t.to_info() for t in tasks]
    return AsyncBatchImportResponse(
        status="queued",
        queued=len(task_infos),
        batch_id=batch_id,
        message=f"Queued {len(task_infos)} tasks for asynchronous processing",
        tasks=task_infos,
        already_in_queue=list(already_queued_urls),
    )


@router.get(
    "/queue/links",
    response_model=QueueLinksResponse,
    tags=["Queue"],
    summary="List processing queue links",
    description="Retrieve all vacancy URLs currently being processed or waiting in queue for the authenticated user, including their stages (queued, scraping, ai_analysis, cv_scoring, failed), retry attempts, errors, and aggregate counters.",
)
async def list_queue_links(
    current_user: User = Depends(get_current_user_from_api_key),
):
    """Retrieve all active and failed vacancy links in the processing queue for the current user."""
    return await queue_manager.get_active_links(user_id=current_user.id)


@router.get(
    "/queue/links/{task_id}",
    response_model=ProcessingLinkInfo,
    tags=["Queue"],
    summary="Get single queue link processing state",
    description="Retrieve detailed processing stage and status for a specific vacancy link by its unique task_id. Returns 404 if the task is not found or belongs to another user.",
)
async def get_queue_link(
    task_id: str,
    current_user: User = Depends(get_current_user_from_api_key),
):
    """Retrieve current stage and state of a single link task."""
    info = await queue_manager.get_link_info(task_id=task_id, user_id=current_user.id)
    if not info:
        raise HTTPException(status_code=404, detail="Queue link task not found or access denied")
    return info


@router.delete(
    "/queue/links/{task_id}",
    tags=["Queue"],
    summary="Cancel queued link processing",
    description="Cancel and remove an individual link from the processing queue by its task_id. Aborts downstream pipeline stages (such as CV compatibility scoring) while preserving existing parsed vacancy cards.",
)
async def cancel_queue_link(
    task_id: str,
    current_user: User = Depends(get_current_user_from_api_key),
):
    """Cancel processing of a single link task."""
    success = await queue_manager.remove_task(task_id=task_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found or cannot be cancelled")
    return {"message": "Link processing cancelled"}


@router.delete(
    "/queue/links",
    tags=["Queue"],
    summary="Clear all links from processing queue",
    description="Batch cancel and remove all active (queued, processing) and failed links from the processing queue for the authenticated user.",
)
async def clear_queue_links(
    current_user: User = Depends(get_current_user_from_api_key),
):
    """Clear all links in the queue for the authenticated user."""
    cleared_count = await queue_manager.clear_user_queue(user_id=current_user.id)
    return {"message": "All queue links cleared", "cleared": cleared_count}


@router.get("/cv", response_model=Optional[ApprovedCVResponse], tags=["CV"], summary="Get approved CV")
def get_user_approved_cv(
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Retrieve the current authenticated user's approved CV."""
    cv = db.query(ApprovedCV).filter(ApprovedCV.user_id == current_user.id).first()
    if not cv:
        return None
    return ApprovedCVResponse.model_validate(cv)


@router.get("/columns", response_model=List[ColumnItem], tags=["Kanban"], summary="List Kanban columns")
def list_columns(
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """List Kanban columns and stages configured for the user."""
    cols = get_user_columns(db, current_user.id)
    return [ColumnItem(**c) for c in cols]


@router.get("/tags", response_model=List[str], tags=["Metadata"], summary="List unique tags")
def list_tags(
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """List all distinct tag labels across user vacancies."""
    vacancies = db.query(Vacancy.tags).filter(Vacancy.user_id == current_user.id).all()
    all_tags = set()
    for v in vacancies:
        for t in (v[0] or []):
            if t and t.strip():
                all_tags.add(t.strip())
    return sorted(list(all_tags))


@router.get("/countries", response_model=List[str], tags=["Metadata"], summary="List unique countries")
def list_countries(
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Return distinct countries present in current user's vacancies."""
    vacancies = (
        db.query(Vacancy.country)
        .filter(Vacancy.user_id == current_user.id, Vacancy.country.isnot(None))
        .distinct()
        .all()
    )
    countries = {v[0].strip() for v in vacancies if v[0] and v[0].strip() and v[0].strip().lower() not in ('null', 'none', 'n/a')}
    return sorted(list(countries))


@router.get("/cities", response_model=List[str], tags=["Metadata"], summary="List unique cities")
def list_cities(
    country: Optional[str] = Query(None, description="Optional country filter"),
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Return distinct cities present in current user's vacancies, optionally filtered by country."""
    query = db.query(Vacancy.city).filter(Vacancy.user_id == current_user.id, Vacancy.city.isnot(None))
    if country and country.strip():
        query = query.filter(Vacancy.country.ilike(country.strip()))
    vacancies = query.distinct().all()
    cities = {v[0].strip() for v in vacancies if v[0] and v[0].strip() and v[0].strip().lower() not in ('null', 'none', 'n/a')}
    return sorted(list(cities))


@router.get("/sources", response_model=List[str], tags=["Metadata"], summary="List job sources")
def list_sources(
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
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
