import os
import uuid
import time
import json
import logging
import datetime
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional, Union
from fastapi import FastAPI, Depends, HTTPException, Query, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .database import engine, Base, get_db, ensure_db_schema
from .models import Vacancy, VacancyStatusHistory, AppSetting, User, UserSetting, VALID_STATUSES
from .schemas import (
    VacancyResponse,
    VacancyCreate,
    VacancyUpdate,
    VacancyReorderRequest,
    VacancyHistoryItem,
    VacancyHistoryUpdate,
    VacancyHistoryCreate,
    BatchImportRequest,
    BatchImportResponse,
    AsyncBatchImportResponse,
    QueueStatusResponse,
    TaskInfo,
    ImportItemResult,
    SettingsResponse,
    SettingsUpdateRequest,
    UserResponse,
    AuthConfigResponse,
    DevLoginRequest,
    ExtensionTaskResponse,
    ExtensionParseRequest,
)
from .auth import (
    get_current_user,
    get_optional_user,
    is_google_configured,
    get_google_auth_url,
    exchange_google_code,
    get_google_user_info,
    get_or_create_user,
    get_or_create_dev_user,
    create_access_token,
    COOKIE_NAME,
    ACCESS_TOKEN_EXPIRE_DAYS,
)
from .scraper import scrape_linkedin_job, scrape_upwork_job, scrape_universal_job, extract_job_id
from .scraper import scrape_job
from .parsers import registry as parser_registry
from .location_parser import parse_location
from .llm import analyze_vacancy_with_llm, get_setting_or_env
import asyncio
from .mercure import (
    get_mercure_public_url,
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
from .queue_manager import (
    queue_manager,
    JobTask,
    TASK_KEY_PREFIX,
    AI_QUEUE_KEY,
    TASK_TTL,
    RECENT_LIST,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("linkedin_tracker")

# Create database tables and ensure schema columns
Base.metadata.create_all(bind=engine)
ensure_db_schema()

def backfill_missing_locations():
    """Backfill city and country for vacancies where city is NULL or needs update."""
    from .database import SessionLocal
    db = SessionLocal()
    try:
        vacancies = db.query(Vacancy).filter(Vacancy.location.isnot(None)).all()
        updated = 0
        for v in vacancies:
            if v.location:
                c_city, c_country = parse_location(v.location)
                changed = False
                if not v.city and c_city:
                    v.city = c_city
                    changed = True
                if not v.country and c_country:
                    v.country = c_country
                    changed = True
                if changed:
                    updated += 1
        if updated > 0:
            db.commit()
            logger.info(f"Backfilled city/country for {updated} vacancies")
    except Exception as e:
        logger.warning(f"Could not backfill locations: {e}")
    finally:
        db.close()

backfill_missing_locations()


def backfill_missing_workplace_types():
    """Backfill workplace_type for vacancies where workplace_type is NULL."""
    import re
    from .database import SessionLocal
    from .scraper import normalize_workplace_type
    db = SessionLocal()
    try:
        vacancies = db.query(Vacancy).filter(Vacancy.workplace_type.is_(None)).all()
        updated = 0
        for v in vacancies:
            w_type = None
            if v.location:
                w_type = normalize_workplace_type(v.location)
            if not w_type and v.title:
                w_type = normalize_workplace_type(v.title)
            if not w_type and v.description:
                m = re.search(r"Workplace(?:\s+type)?:\s*([A-Za-z\-]+)", v.description, re.IGNORECASE)
                if m:
                    w_type = normalize_workplace_type(m.group(1))
                if not w_type:
                    if re.search(r"\b(?:remote|удален(?:но|ка))\b", v.description[:1000], re.IGNORECASE):
                        w_type = "remote"
                    elif re.search(r"\b(?:hybrid|гибрид)\b", v.description[:1000], re.IGNORECASE):
                        w_type = "hybrid"
                    elif re.search(r"\b(?:on-site|onsite|в офисе)\b", v.description[:1000], re.IGNORECASE):
                        w_type = "on-site"

            if w_type:
                v.workplace_type = w_type
                updated += 1

        if updated > 0:
            db.commit()
            logger.info(f"Backfilled workplace_type for {updated} vacancies")
    except Exception as e:
        logger.warning(f"Could not backfill workplace_types: {e}")
    finally:
        db.close()

backfill_missing_workplace_types()


def seed_mock_data_if_enabled():
    """Generate fake vacancies on startup when CREATE_MOCK_DATA=true (idempotent)."""
    from .mock_data import is_mock_data_enabled, seed_mock_data
    if not is_mock_data_enabled():
        return
    try:
        seed_mock_data()
    except Exception as e:
        logger.warning(f"Could not create mock data: {e}")

seed_mock_data_if_enabled()



@asynccontextmanager
async def lifespan(app: FastAPI):
    await queue_manager.start()
    yield
    await queue_manager.stop()


app = FastAPI(title="LinkedIn Vacancy Tracker", version="1.0.0", lifespan=lifespan)

# CORS middleware for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/auth/config", response_model=AuthConfigResponse)
def get_auth_config():
    dev_enabled = os.getenv("DEV_AUTH", "false").lower() in ("true", "1", "yes")
    return AuthConfigResponse(
        google_configured=is_google_configured(),
        google_client_id=os.getenv("GOOGLE_CLIENT_ID", ""),
        dev_mode=dev_enabled,
    )


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/api/auth/google/login")
def google_login(request: Request):
    if not is_google_configured():
        raise HTTPException(
            status_code=400,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
        )
    
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    if not redirect_uri:
        redirect_uri = str(request.base_url).rstrip("/") + "/api/auth/google/callback"
    
    state = uuid.uuid4().hex
    auth_url = get_google_auth_url(redirect_uri=redirect_uri, state=state)
    response = RedirectResponse(url=auth_url)
    response.set_cookie("oauth_state", state, max_age=600, httponly=True, samesite="lax")
    return response


@app.get("/api/auth/google/callback")
async def google_callback(
    request: Request,
    code: str = Query(...),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    cookie_state = request.cookies.get("oauth_state")
    if cookie_state and state and cookie_state != state:
        logger.warning(f"OAuth state mismatch: expected {cookie_state}, got {state}")
    
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    if not redirect_uri:
        redirect_uri = str(request.base_url).rstrip("/") + "/api/auth/google/callback"
    
    tokens = await exchange_google_code(code, redirect_uri=redirect_uri)
    access_token = tokens.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token returned by Google")
    
    user_info = await get_google_user_info(access_token)
    google_id = user_info.get("sub")
    email = user_info.get("email")
    name = user_info.get("name", "")
    picture = user_info.get("picture")

    if not google_id or not email:
        raise HTTPException(status_code=400, detail="Incomplete user profile from Google")

    user = get_or_create_user(db, google_id=google_id, email=email, name=name, picture=picture)
    token = create_access_token({"sub": str(user.id), "email": user.email, "name": user.name})

    response = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=86400 * ACCESS_TOKEN_EXPIRE_DAYS,
        httponly=True,
        samesite="lax",
        path="/",
    )
    response.delete_cookie("oauth_state")
    return response


@app.post("/api/auth/dev-login")
def dev_login(payload: DevLoginRequest, response: Response, db: Session = Depends(get_db)):
    dev_enabled = os.getenv("DEV_AUTH", "true").lower() in ("true", "1", "yes")
    if not dev_enabled:
        raise HTTPException(status_code=403, detail="Dev login is disabled in production")
    
    user = get_or_create_dev_user(db, email=payload.email or "dev@local.user", name=payload.name or "Dev User")
    token = create_access_token({"sub": str(user.id), "email": user.email, "name": user.name})
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=86400 * ACCESS_TOKEN_EXPIRE_DAYS,
        httponly=True,
        samesite="lax",
        path="/",
    )
    return {
        "user": UserResponse.model_validate(user),
        "token": token,
    }


@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"status": "ok"}


@app.get("/api/config")
def get_config(current_user: Optional[User] = Depends(get_optional_user)):
    """Return Mercure public hub URL and topics for frontend SSE connection."""
    topic = f"vacancies:{current_user.id}" if current_user else "vacancies"
    return {
        "mercure_hub_url": get_mercure_public_url(),
        "mercure_topic": topic,
    }


@app.get("/api/queue/status", response_model=QueueStatusResponse)
async def get_queue_status(current_user: User = Depends(get_current_user)):
    """Get active parsing queue status and recent tasks scoped to user."""
    return await queue_manager.get_status(user_id=current_user.id)

@app.get("/api/queue/tasks", response_model=List[TaskInfo])
async def get_queue_tasks(current_user: User = Depends(get_current_user)):
    """Get active tasks in the queue."""
    return await queue_manager.get_active_tasks(user_id=current_user.id)

@app.delete("/api/queue/tasks/{task_id}")
async def cancel_queue_task(task_id: str, current_user: User = Depends(get_current_user)):
    """Cancel a task in the queue."""
    success = await queue_manager.remove_task(task_id=task_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found or cannot be cancelled")
    return {"message": "Task cancelled"}


@app.get("/api/vacancies", response_model=List[VacancyResponse])
def list_vacancies(
    status_filter: Optional[str] = Query(None, alias="status"),
    tag: Optional[str] = None,
    country: Optional[str] = None,
    city: Optional[str] = None,
    workplace_type: Optional[str] = None,
    source: Optional[str] = None,
    is_closed: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Vacancy).filter(Vacancy.user_id == current_user.id)

    if status_filter and status_filter in VALID_STATUSES:
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


@app.get("/api/vacancies/{vacancy_id}", response_model=VacancyResponse)
def get_vacancy(
    vacancy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return v


@app.post("/api/vacancies", response_model=VacancyResponse)
async def create_vacancy(
    payload: VacancyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump()
    data["user_id"] = current_user.id
    v = Vacancy(**data)
    db.add(v)
    db.flush()

    # Record initial stage in history
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
            },
            topic=mercure_topic,
        )
    )
    return v


@app.post("/api/vacancies/reorder")
async def reorder_vacancies(
    payload: VacancyReorderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Set the manual order of cards in a column (and move cards into it if needed)."""
    if payload.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"
        )

    vacancies = db.query(Vacancy).filter(
        Vacancy.id.in_(payload.ids), Vacancy.user_id == current_user.id
    ).all()
    by_id = {v.id: v for v in vacancies}

    changed = []
    for position, vid in enumerate(payload.ids):
        v = by_id.get(vid)
        if not v:
            continue
        if v.status != payload.status:
            db.add(VacancyStatusHistory(
                vacancy_id=v.id,
                from_status=v.status,
                to_status=payload.status,
                comment=None,
                created_at=datetime.datetime.utcnow(),
            ))
            v.status = payload.status
        v.sort_order = float(position)
        v.lane = max(0, payload.lane)
        changed.append(v)

    db.commit()
    for v in changed:
        db.refresh(v)

    mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
    for v in changed:
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
    return [VacancyResponse.model_validate(v) for v in changed]


@app.patch("/api/vacancies/{vacancy_id}", response_model=VacancyResponse)
async def update_vacancy(
    vacancy_id: int,
    payload: VacancyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"
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
        # Moved to another column: drop manual position so the card lands on top
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


@app.patch("/api/vacancies/{vacancy_id}/history/{history_id}", response_model=VacancyResponse)
async def update_vacancy_history_comment(
    vacancy_id: int,
    history_id: int,
    payload: VacancyHistoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    history_item = db.query(VacancyStatusHistory).filter(
        VacancyStatusHistory.id == history_id,
        VacancyStatusHistory.vacancy_id == v.id
    ).first()
    if not history_item:
        raise HTTPException(status_code=404, detail="History record not found")

    history_item.comment = payload.comment
    history_item.updated_at = datetime.datetime.utcnow()
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


@app.post("/api/vacancies/{vacancy_id}/history", response_model=VacancyResponse)
async def add_vacancy_history_entry(
    vacancy_id: int,
    payload: VacancyHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    if payload.to_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"
        )

    history_entry = VacancyStatusHistory(
        vacancy_id=v.id,
        from_status=payload.from_status if payload.from_status is not None else v.status,
        to_status=payload.to_status,
        comment=payload.comment,
        created_at=datetime.datetime.utcnow(),
    )
    v.status = payload.to_status
    db.add(history_entry)
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


@app.delete("/api/vacancies/{vacancy_id}/history/{history_id}", response_model=VacancyResponse)
async def delete_vacancy_history_entry(
    vacancy_id: int,
    history_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    history_item = db.query(VacancyStatusHistory).filter(
        VacancyStatusHistory.id == history_id,
        VacancyStatusHistory.vacancy_id == v.id
    ).first()
    if not history_item:
        raise HTTPException(status_code=404, detail="History record not found")

    db.delete(history_item)
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


@app.delete("/api/vacancies/{vacancy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vacancy(
    vacancy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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


@app.post("/api/vacancies/batch", response_model=Union[AsyncBatchImportResponse, BatchImportResponse])
async def batch_import_vacancies(
    payload: BatchImportRequest,
    wait: bool = Query(False, description="If True, wait synchronously for all URLs to finish"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Enqueue a list of LinkedIn URLs to background queue, or optionally process synchronously.
    """
    # Filter out blank lines and duplicates
    unique_urls = []
    seen = set()
    for raw_url in payload.urls:
        u = raw_url.strip()
        if u and u not in seen:
            seen.add(u)
            unique_urls.append(u)

    vacancy_ids = []
    for url in unique_urls:
        job_id = extract_job_id(url)
        existing = None
        if job_id:
            existing = db.query(Vacancy).filter(
                Vacancy.job_id == job_id,
                Vacancy.user_id == current_user.id,
            ).first()
        if not existing:
            existing = db.query(Vacancy).filter(
                Vacancy.url == url,
                Vacancy.user_id == current_user.id,
            ).first()

        if not existing:
            v = Vacancy(
                user_id=current_user.id,
                job_id=job_id,
                url=url,
                title=url,
                company="Upwork" if "upwork.com" in url else "Загрузка...",
                status="Еще не написан",
                tags=payload.default_tags,
            )
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
            vacancy_ids.append(v.id)

            mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
            vacancy_data = VacancyResponse.model_validate(v).model_dump(mode="json")
            asyncio.create_task(
                publish_mercure_event(
                    event_type=EVENT_VACANCY_CREATED,
                    data={
                        "message_code": MSG_VACANCY_CREATED,
                        "vacancy": vacancy_data,
                        "url": url,
                    },
                    topic=mercure_topic,
                )
            )
        else:
            vacancy_ids.append(existing.id)

    if not wait:
        # Default: Asynchronous queue processing
        batch_id, tasks = await queue_manager.enqueue(
            unique_urls, payload.default_tags, vacancy_ids=vacancy_ids, user_id=current_user.id
        )
        return AsyncBatchImportResponse(
            status="queued",
            queued=len(tasks),
            batch_id=batch_id,
            message=f"{len(tasks)} вакансий успешно добавлено в очередь на обработку",
            tasks=[t.to_info() for t in tasks],
        )

    # Synchronous processing mode (if wait=True, e.g. for testing)
    results: List[ImportItemResult] = []
    imported_count = 0
    failed_count = 0

    for url in unique_urls:
        try:
            job_id = extract_job_id(url)
            
            # Check if vacancy with same job_id or url already exists for current_user
            existing = None
            if job_id:
                existing = db.query(Vacancy).filter(
                    Vacancy.job_id == job_id,
                    Vacancy.user_id == current_user.id,
                ).first()
            if not existing:
                existing = db.query(Vacancy).filter(
                    Vacancy.url == url,
                    Vacancy.user_id == current_user.id,
                ).first()

            # Scrape vacancy via parser registry
            scraped = await scrape_job(url)
            
            llm_provider = os.getenv("LLM_PROVIDER")
            language = get_setting_or_env(db, "locale", os.getenv("LOCALE", "ru"), user_id=current_user.id).lower()

            # Run LLM summarization
            llm_res = await analyze_vacancy_with_llm(
                title=scraped.get("title") or "Untitled",
                company=scraped.get("company") or "Unknown",
                location=scraped.get("location"),
                description=scraped.get("description"),
                provider=llm_provider,
                language=language,
                db=db,
                user_id=current_user.id,
            )

            # Combine tags
            initial_tags = list(payload.default_tags)

            if existing:
                # Update existing vacancy
                existing.title = scraped.get("title") or existing.title
                existing.company = scraped.get("company") or existing.company
                existing.company_url = scraped.get("company_url") or existing.company_url
                existing.company_info = llm_res.get("company_info") or scraped.get("company_info")
                existing.location = scraped.get("location") or existing.location
                existing.city = scraped.get("city")
                existing.country = scraped.get("country") or existing.country
                existing.description = scraped.get("description") or existing.description
                existing.ai_summary = llm_res.get("summary")
                existing.tech_stack = llm_res.get("tech_stack", [])
                
                s_min = llm_res.get("salary_min") if llm_res.get("salary_min") is not None else scraped.get("salary_min")
                s_max = llm_res.get("salary_max") if llm_res.get("salary_max") is not None else scraped.get("salary_max")
                s_curr = llm_res.get("salary_currency") if llm_res.get("salary_currency") is not None else scraped.get("salary_currency")
                s_per = llm_res.get("salary_period") if llm_res.get("salary_period") is not None else scraped.get("salary_period")
                w_type = llm_res.get("workplace_type") or scraped.get("workplace_type")
                if s_min is not None: existing.salary_min = s_min
                if s_max is not None: existing.salary_max = s_max
                if s_curr is not None: existing.salary_currency = s_curr
                if s_per is not None: existing.salary_period = s_per
                if w_type: existing.workplace_type = w_type
                if "is_closed" in scraped: existing.is_closed = scraped["is_closed"]
                if scraped.get("source"): existing.source = scraped["source"]

                # Merge tags without duplicating
                current_tags = set(existing.tags or [])
                for t in initial_tags:
                    current_tags.add(t)
                existing.tags = list(current_tags)
                
                db.commit()
                db.refresh(existing)
                
                results.append(ImportItemResult(
                    url=url,
                    job_id=job_id,
                    success=True,
                    title=existing.title,
                    company=existing.company,
                    vacancy_id=existing.id,
                ))
                imported_count += 1
            else:
                # Create new vacancy
                s_min = llm_res.get("salary_min") if llm_res.get("salary_min") is not None else scraped.get("salary_min")
                s_max = llm_res.get("salary_max") if llm_res.get("salary_max") is not None else scraped.get("salary_max")
                s_curr = llm_res.get("salary_currency") if llm_res.get("salary_currency") is not None else scraped.get("salary_currency")
                s_per = llm_res.get("salary_period") if llm_res.get("salary_period") is not None else scraped.get("salary_period")
                w_type = llm_res.get("workplace_type") or scraped.get("workplace_type")

                new_v = Vacancy(
                    user_id=current_user.id,
                    job_id=scraped.get("job_id"),
                    source=scraped.get("source"),
                    url=url,
                    title=scraped.get("title") or "Untitled",
                    company=scraped.get("company") or "Unknown",
                    company_url=scraped.get("company_url"),
                    company_info=llm_res.get("company_info") or scraped.get("company_info"),
                    location=llm_res.get("location") if (not scraped.get("location") or scraped.get("location") == "Not specified") else scraped.get("location"),
                    city=scraped.get("city"),
                    country=scraped.get("country"),
                    description=scraped.get("description"),
                    workplace_type=w_type,
                    is_closed=scraped.get("is_closed", False),
                    salary_min=s_min,
                    salary_max=s_max,
                    salary_currency=s_curr,
                    salary_period=s_per,
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

                mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
                vacancy_data = VacancyResponse.model_validate(new_v).model_dump(mode="json")
                asyncio.create_task(
                    publish_mercure_event(
                        event_type=EVENT_VACANCY_CREATED,
                        data={
                            "message_code": MSG_VACANCY_CREATED,
                            "vacancy": vacancy_data,
                            "url": url,
                        },
                        topic=mercure_topic,
                    )
                )

                results.append(ImportItemResult(
                    url=url,
                    job_id=job_id,
                    success=True,
                    title=new_v.title,
                    company=new_v.company,
                    vacancy_id=new_v.id,
                ))
                imported_count += 1

        except Exception as e:
            logger.error(f"Failed to process vacancy {url}: {e}", exc_info=True)
            results.append(ImportItemResult(
                url=url,
                job_id=extract_job_id(url),
                success=False,
                error=str(e),
            ))
            failed_count += 1

    return BatchImportResponse(
        total=len(unique_urls),
        imported=imported_count,
        failed=failed_count,
        results=results,
    )


@app.post("/api/vacancies/{vacancy_id}/resummarize", response_model=VacancyResponse)
async def resummarize_vacancy(
    vacancy_id: int,
    language: Optional[str] = Query(None),
    provider: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Re-run LLM summarization for an existing vacancy."""
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    if not provider:
        provider = os.getenv("LLM_PROVIDER")

    if not language:
        language = get_setting_or_env(db, "locale", os.getenv("LOCALE", "ru"), user_id=current_user.id).lower()

    llm_res = await analyze_vacancy_with_llm(
        title=v.title,
        company=v.company,
        location=v.location or "",
        description=v.description or "",
        provider=provider,
        language=language,
        db=db,
        user_id=current_user.id,
    )

    if llm_res.get("title") and (not v.title or v.title.startswith("http") or v.title == "Не удалось загрузить страницу"):
        v.title = llm_res["title"]
    if llm_res.get("location") and (not v.location or v.location == "Not specified"):
        v.location = llm_res["location"]
    if llm_res.get("summary"):
        v.ai_summary = llm_res["summary"]
    if llm_res.get("tech_stack"):
        v.tech_stack = llm_res["tech_stack"]
    if llm_res.get("company_info"):
        v.company_info = llm_res["company_info"]
    if llm_res.get("salary_min") is not None:
        v.salary_min = llm_res["salary_min"]
    if llm_res.get("salary_max") is not None:
        v.salary_max = llm_res["salary_max"]
    if llm_res.get("salary_currency") is not None:
        v.salary_currency = llm_res["salary_currency"]
    if llm_res.get("salary_period") is not None:
        v.salary_period = llm_res["salary_period"]
    if llm_res.get("workplace_type"):
        v.workplace_type = llm_res["workplace_type"]

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


@app.post("/api/vacancies/{vacancy_id}/reparse")
async def reparse_vacancy(
    vacancy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add vacancy URL to background processing queue to re-scrape and update DB."""
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")

    if not v.url:
        raise HTTPException(status_code=400, detail="У вакансии отсутствует ссылка (URL)")

    batch_id, tasks = await queue_manager.enqueue(
        [v.url], default_tags=[], vacancy_ids=[v.id], user_id=current_user.id
    )
    return {
        "status": "queued",
        "batch_id": batch_id,
        "task_id": tasks[0].task_id if tasks else None,
        "message": "Вакансия отправлена на повторную обработку в фоне",
    }


@app.post("/api/vacancies/reparse_all")
async def reparse_all_vacancies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add all vacancies with valid URLs to background processing queue to re-scrape and update DB."""
    vacancies = db.query(Vacancy).filter(
        Vacancy.user_id == current_user.id,
        Vacancy.url != None,
        Vacancy.url != "",
        Vacancy.status != "Отказ",
    ).all()

    if not vacancies:
        return {"message": "Нет вакансий для обновления", "enqueued": 0}

    urls = [v.url for v in vacancies]
    vacancy_ids = [v.id for v in vacancies]

    batch_id, tasks = await queue_manager.enqueue(
        urls=urls, default_tags=[], vacancy_ids=vacancy_ids, user_id=current_user.id
    )
    
    return {
        "status": "queued",
        "batch_id": batch_id,
        "enqueued": len(tasks),
        "message": f"Отправлено на обновление: {len(tasks)} вакансий",
    }


@app.get("/api/tags", response_model=List[str])
def list_unique_tags(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vacancies = db.query(Vacancy).filter(Vacancy.user_id == current_user.id).all()
    all_tags = set()
    for v in vacancies:
        for t in (v.tags or []):
            if t and t.strip():
                all_tags.add(t.strip())
    return sorted(list(all_tags))


@app.get("/api/countries", response_model=List[str])
def list_countries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
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


@app.get("/api/cities", response_model=List[str])
def list_cities(
    country: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return distinct cities present in current user's vacancies, optionally filtered by country."""
    query = db.query(Vacancy.city).filter(Vacancy.user_id == current_user.id, Vacancy.city.isnot(None))
    if country and country.strip():
        query = query.filter(Vacancy.country.ilike(country.strip()))
    vacancies = query.distinct().all()
    cities = {v[0].strip() for v in vacancies if v[0] and v[0].strip() and v[0].strip().lower() not in ('null', 'none', 'n/a')}
    return sorted(list(cities))


@app.get("/api/sources", response_model=List[str])
def list_sources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return distinct sources present in current user's vacancies."""
    vacancies = (
        db.query(Vacancy.source)
        .filter(Vacancy.user_id == current_user.id, Vacancy.source.isnot(None))
        .distinct()
        .all()
    )
    sources = {v[0].strip() for v in vacancies if v[0] and v[0].strip() and v[0].strip().lower() not in ('null', 'none', 'n/a')}
    return sorted(list(sources))


@app.get("/api/settings", response_model=SettingsResponse)
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    locale = get_setting_or_env(db, "locale", os.getenv("LOCALE", "ru"), user_id=current_user.id)
    salary_display_format = get_setting_or_env(db, "salary_display_format", "month", user_id=current_user.id)

    return SettingsResponse(
        llm_provider=os.getenv("LLM_PROVIDER", "mistral").lower(),
        mistral_api_key_set=bool(os.getenv("MISTRAL_API_KEY", "")),
        mistral_model=os.getenv("MISTRAL_MODEL", "mistral-small-latest"),
        gemini_api_key_set=bool(os.getenv("GEMINI_API_KEY", "")),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        locale=locale,
        salary_display_format=salary_display_format,
    )


@app.post("/api/settings", response_model=SettingsResponse)
def update_settings(
    payload: SettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.locale is not None:
        setting = db.query(UserSetting).filter(
            UserSetting.user_id == current_user.id,
            UserSetting.key == "locale"
        ).first()
        if not setting:
            setting = UserSetting(user_id=current_user.id, key="locale", value=payload.locale.strip().lower())
            db.add(setting)
        else:
            setting.value = payload.locale.strip().lower()

    if payload.salary_display_format is not None:
        setting = db.query(UserSetting).filter(
            UserSetting.user_id == current_user.id,
            UserSetting.key == "salary_display_format"
        ).first()
        if not setting:
            setting = UserSetting(user_id=current_user.id, key="salary_display_format", value=payload.salary_display_format.strip().lower())
            db.add(setting)
        else:
            setting.value = payload.salary_display_format.strip().lower()

    db.commit()

    return get_settings(current_user=current_user, db=db)


@app.get("/api/extension/tasks", response_model=List[ExtensionTaskResponse])
async def get_extension_tasks(current_user: User = Depends(get_current_user)):
    redis = queue_manager.redis
    if not redis: return []
    task_ids = await redis.lrange("queue:extension", 0, -1)
    tasks = []
    for tid in task_ids:
        raw = await redis.get(f"queue:task:{tid.decode()}")
        if raw:
            t = JobTask.from_dict(json.loads(raw))
            if t.status == "pending_extension" and t.user_id == current_user.id:
                tasks.append(ExtensionTaskResponse(task_id=t.task_id, url=t.url))
    return tasks

@app.get("/api/extension/mercure_config")
async def get_extension_mercure_config(current_user: User = Depends(get_current_user)):
    return {
        "mercure_hub_url": os.getenv("MERCURE_PUBLIC_URL", "http://localhost:3000/.well-known/mercure"),
        "topic": f"vacancies:{current_user.id}"
    }

@app.post("/api/extension/ping")
async def extension_ping(current_user: User = Depends(get_current_user)):
    redis = queue_manager.redis
    if redis:
        await redis.set(f"extension:active:{current_user.id}", str(time.time()), ex=180)
    return {"status": "ok"}

@app.get("/api/extension/status")
async def extension_status(current_user: User = Depends(get_current_user)):
    # extension_id lets the web app ping the extension via externally_connectable
    extension_id = os.getenv("EXTENSION_ID") or None
    redis = queue_manager.redis
    if not redis:
        return {"active": False, "extension_id": extension_id}
    val = await redis.get(f"extension:active:{current_user.id}")
    return {"active": bool(val), "extension_id": extension_id}

@app.post("/api/extension/tasks/{task_id}/result")
async def submit_extension_task_result(
    task_id: str, 
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    # Verify task belongs to user before processing
    redis = queue_manager.redis
    if redis:
        raw = await redis.get(f"{TASK_KEY_PREFIX}{task_id}")
        if raw:
            t = JobTask.from_dict(json.loads(raw))
            if t.user_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not your task")
                
    return await queue_manager.process_extension_result(task_id, payload)

@app.post("/api/extension/tasks/{task_id}/error")
async def submit_extension_task_error(
    task_id: str,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """The extension failed to open/parse the page: mark failed and schedule a retry with backoff."""
    redis = queue_manager.redis
    if redis:
        raw = await redis.get(f"{TASK_KEY_PREFIX}{task_id}")
        if raw:
            t = JobTask.from_dict(json.loads(raw))
            if t.user_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not your task")

    return await queue_manager.report_extension_failure(task_id, str(payload.get("error") or "")[:500])

@app.post("/api/extension/parse_and_add")
async def extension_parse_and_add(payload: Dict[str, Any], current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    url = payload.get("url")
    html = payload.get("html")
    if "source" in payload:
        scraped = payload
    else:
        scraped = await scrape_job(url, html=html)
    job_id = scraped.get("job_id") or extract_job_id(url)
    existing = None
    if job_id:
        existing = db.query(Vacancy).filter(Vacancy.job_id == job_id, Vacancy.user_id == current_user.id).first()
    if not existing:
        existing = db.query(Vacancy).filter(Vacancy.url == url, Vacancy.user_id == current_user.id).first()
        
    is_new = False
    if existing:
        if scraped.get("job_id"): existing.job_id = scraped["job_id"]
        if scraped.get("source"): existing.source = scraped["source"]
        existing.title = scraped.get("title", None) or existing.title 
        existing.company = scraped.get("company", None) or existing.company
        existing.company_url = scraped.get("company_url", None) or existing.company_url
        existing.location = scraped.get("location", None) or existing.location
        existing.city = scraped.get("city", None) or existing.city
        existing.country = scraped.get("country", None) or existing.country
        existing.description = scraped.get("description", None) or existing.description
        existing.company_info = scraped.get("company_info", None) or existing.company_info
        existing.workplace_type = scraped.get("workplace_type", None) or existing.workplace_type
        existing.salary_min = scraped.get("salary_min", None) or existing.salary_min
        existing.salary_max = scraped.get("salary_max", None) or existing.salary_max
        existing.salary_currency = scraped.get("salary_currency", None) or existing.salary_currency
        existing.salary_period = scraped.get("salary_period", None) or existing.salary_period
        if scraped.get("is_closed") is not None: existing.is_closed = scraped["is_closed"]
        db.commit()
        db.refresh(existing)
        vacancy = existing
    else:
        is_new = True
        vacancy = Vacancy(
            user_id=current_user.id,
            url=url,
            job_id=scraped.get("job_id"),
            source=scraped.get("source"),
            title=scraped.get("title", "Untitled"),
            company=scraped.get("company", "Unknown"),
            company_url=scraped.get("company_url"),
            location=scraped.get("location"),
            country=scraped.get("country"),
            city=scraped.get("city"),
            description=scraped.get("description"),
            company_info=scraped.get("company_info"),
            salary_min=scraped.get("salary_min"),
            salary_max=scraped.get("salary_max"),
            salary_currency=scraped.get("salary_currency"),
            salary_period=scraped.get("salary_period"),
            workplace_type=scraped.get("workplace_type"),
            is_closed=scraped.get("is_closed", False),
            status="Еще не написан"
        )
        db.add(vacancy)
        db.flush()
        db.add(VacancyStatusHistory(
            vacancy_id=vacancy.id,
            from_status=None,
            to_status=vacancy.status,
            created_at=vacancy.created_at,
        ))
        db.commit()
        db.refresh(vacancy)

        mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
        vacancy_data = VacancyResponse.model_validate(vacancy).model_dump(mode="json")
        asyncio.create_task(
            publish_mercure_event(
                event_type=EVENT_VACANCY_CREATED,
                data={
                    "message_code": MSG_VACANCY_CREATED,
                    "vacancy": vacancy_data,
                    "url": url,
                },
                topic=mercure_topic,
            )
        )
        
    # If link requires browser extension to scrape and no HTML was supplied (e.g. context menu on a link),
    # enqueue into scrape pipeline so extension will open tab and extract DOM.
    parser = parser_registry.find(url)
    if not payload.get("html") and parser and parser.needs_extension:
        batch_id, tasks = await queue_manager.enqueue(
            [url], default_tags=[], vacancy_ids=[vacancy.id], user_id=current_user.id
        )
        return {"status": "queued", "vacancy_id": vacancy.id, "batch_id": batch_id}

    # Queue for AI processing directly (skip scraping)
    task_id = uuid.uuid4().hex[:8]
    batch_id = uuid.uuid4().hex[:8]
    task = JobTask(
        task_id=task_id,
        batch_id=batch_id,
        url=url,
        default_tags=[],
        vacancy_id=vacancy.id,
        user_id=current_user.id,
        title=vacancy.title,
        company=vacancy.company,
        status="pending",
        stage="ai_analysis",
        created_at=time.time(),
        updated_at=time.time()
    )
    
    if queue_manager.redis:
        async with queue_manager.redis.pipeline(transaction=True) as pipe:
            pipe.set(f"{TASK_KEY_PREFIX}{task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)
            pipe.rpush(AI_QUEUE_KEY, task_id)
            pipe.lpush(RECENT_LIST, task_id)
            pipe.ltrim(RECENT_LIST, 0, 99)
            await pipe.execute()
            
        total_remaining = await queue_manager._calculate_total_remaining(user_id=current_user.id)
        mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
        vacancy_data = VacancyResponse.model_validate(vacancy).model_dump(mode="json")
        asyncio.create_task(
            publish_mercure_event(
                event_type=EVENT_VACANCY_UPDATED,
                data={
                    "message_code": MSG_VACANCY_UPDATED,
                    "vacancy": vacancy_data,
                    "task_id": task_id,
                    "batch_id": batch_id,
                    "url": url,
                    "total_remaining": total_remaining,
                },
                topic=mercure_topic,
            )
        )
        asyncio.create_task(
            publish_mercure_event(
                event_type=EVENT_QUEUE_UPDATED,
                data={
                    "message_code": MSG_QUEUE_UPDATED,
                    "batch_id": batch_id,
                    "queued_count": 1,
                    "total_remaining": total_remaining,
                },
                topic=mercure_topic,
            )
        )
    
    return {"status": "queued_for_ai", "vacancy_id": vacancy.id, "task_id": task_id}


@app.get("/api/stats")
def get_stats(
    tz_offset: int = Query(0, description="Client offset in minutes, as JS Date.getTimezoneOffset()"),
    days: int = Query(365, ge=7, le=730),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Per-day activity: vacancies added and status changes ("marked"), in the client's timezone."""
    delta = datetime.timedelta(minutes=-tz_offset)

    def local_day(dt: datetime.datetime) -> str:
        return (dt + delta).date().isoformat()

    vacancies = db.query(Vacancy).filter(Vacancy.user_id == current_user.id).all()
    daily: Dict[str, Dict[str, int]] = {}

    def bucket(day: str) -> Dict[str, int]:
        return daily.setdefault(day, {"added": 0, "marked": 0})

    status_counts: Dict[str, int] = {}
    for v in vacancies:
        status_counts[v.status] = status_counts.get(v.status, 0) + 1
        if v.created_at:
            bucket(local_day(v.created_at))["added"] += 1
        for h in v.history:
            # Entries without from_status are the initial record created together with the vacancy.
            if h.from_status is not None and h.created_at:
                bucket(local_day(h.created_at))["marked"] += 1

    today = (datetime.datetime.utcnow() + delta).date()
    cutoff = (today - datetime.timedelta(days=days - 1)).isoformat()
    series = [
        {"date": d, **counts}
        for d, counts in sorted(daily.items())
        if d >= cutoff
    ]

    return {
        "today": today.isoformat(),
        "total": len(vacancies),
        "by_status": status_counts,
        "daily": series,
    }


# Static files mount for built React frontend
STATIC_DIR = os.getenv("STATIC_DIR", os.path.join(os.path.dirname(__file__), "../frontend/dist"))
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        # Don't hijack API routes
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not found")
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
