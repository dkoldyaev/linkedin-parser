import os
import uuid
import time
import json
import logging
import datetime
import httpx
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional, Union
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_, func

import json
from .database import engine, Base, get_db, ensure_db_schema, ensure_query_indexes
from .models import (
    Vacancy,
    VacancyStatusHistory,
    AppSetting,
    User,
    UserSetting,
    UserFeatureFlag,
    ApprovedCV,
    VacancyCVAnalysis,
    AdaptedCVVersion,
    ApiKey,
    UserLLMTokenUsage,
    ProcessingQueueItem,
    VALID_STATUSES,
    DEFAULT_COLUMNS,
    BASE_STATUSES,
    STATUS_NOT_CONTACTED,
    STATUS_REJECTED,
    KNOWN_FEATURE_FLAGS,
    FEATURE_FLAG_API_ACCESS,
    FEATURE_FLAG_ADMIN,
)
from .schemas import (
    VacancyResponse,
    VacancyCreate,
    VacancyUpdate,
    VacancyReorderRequest,
    VacancyHistoryItem,
    VacancyHistoryUpdate,
    VacancyHistoryCreate,
    BatchImportRequest,
    AsyncBatchImportResponse,
    ProcessingLinkInfo,
    QueueLinksResponse,
    CheckDuplicatesRequest,
    CheckDuplicatesResponse,
    DuplicateVacancyInfo,
    QueueStatusResponse,
    TaskInfo,
    SettingsResponse,
    SettingsUpdateRequest,
    ColumnItem,
    ColumnCreateRequest,
    ColumnUpdateRequest,
    ColumnDeleteRequest,
    ColumnsOrderRequest,
    UserResponse,
    UserUpdateFeatureFlagsRequest,
    AvailableFeatureFlagsResponse,
    AdminUserUpdate,
    AuthConfigResponse,
    DevLoginRequest,
    ExtensionTaskResponse,
    ExtensionParseRequest,
    AnonymizeCompaniesRequest,
    AnonymizeCompaniesResponse,
    CompanyReplacementItem,
    ApprovedCVCreate,
    ApprovedCVResponse,
    VacancyCVAnalysisResponse,
    AdaptedCVVersionResponse,
    AdaptCVRequest,
    ApiKeyCreateRequest,
    ApiKeyResponse,
    ApiKeyCreatedResponse,
    UserStatsSummary,
)
from .auth import (
    get_current_user,
    get_current_admin_user,
    get_current_user_from_api_key,
    get_optional_user,
    is_google_configured,
    get_google_auth_url,
    exchange_google_code,
    get_google_user_info,
    get_or_create_user,
    get_or_create_dev_user,
    create_anonymous_user,
    migrate_anonymous_user_data,
    create_access_token,
    COOKIE_NAME,
    ACCESS_TOKEN_EXPIRE_DAYS,
)
from .scraper import scrape_linkedin_job, scrape_upwork_job, scrape_universal_job, extract_job_id, normalize_url
from .scraper import scrape_job
from .parsers import registry as parser_registry
from .query_helpers import filter_tag, duplicate_response, local_date
from .location_parser import parse_location
from .llm import (
    analyze_vacancy_with_llm,
    get_setting_or_env,
    anonymize_companies_with_llm,
    evaluate_vacancy_compatibility_with_llm,
    adapt_cv_for_vacancy_with_llm,
)
import asyncio
from .mercure import (
    get_mercure_public_url,
    set_subscriber_cookie, MERCURE_COOKIE,
    publish_mercure_event,
    EVENT_VACANCY_CREATED,
    EVENT_VACANCY_UPDATED,
    EVENT_VACANCY_DELETED,
    EVENT_QUEUE_UPDATED,
    EVENT_COMPATIBILITY_ANALYZED,
    MSG_VACANCY_CREATED,
    MSG_VACANCY_UPDATED,
    MSG_VACANCY_DELETED,
    MSG_QUEUE_UPDATED,
    MSG_COMPATIBILITY_ANALYZED,
)
from .queue_manager import (
    queue_manager,
    JobTask,
    TASK_KEY_PREFIX,
    AI_QUEUE_KEY,
    TASK_TTL,
    RECENT_LIST,
)

logging.basicConfig(level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO))
logger = logging.getLogger("linkedin_tracker")

# Initialize Sentry if configured
from .sentry import init_sentry
init_sentry()

# Create database tables and ensure schema columns
Base.metadata.create_all(bind=engine)
ensure_db_schema()
ensure_query_indexes()

def backfill_missing_locations():
    """Backfill city and country for vacancies where city is NULL or needs update."""
    from .database import SessionLocal
    db = SessionLocal()
    try:
        vacancies = db.query(Vacancy).filter(Vacancy.location.isnot(None), or_(Vacancy.city.is_(None), Vacancy.country.is_(None))).yield_per(200)
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


def get_user_columns(db: Session, user_id: int) -> List[dict]:
    """Retrieve custom columns for user, fallback to DEFAULT_COLUMNS."""
    setting = db.query(UserSetting).filter(
        UserSetting.user_id == user_id,
        UserSetting.key == "kanban_columns"
    ).first()
    if setting and setting.value:
        try:
            data = json.loads(setting.value)
            if isinstance(data, list) and len(data) > 0:
                # Ensure base statuses are properly flagged
                for col in data:
                    if col.get("id") in BASE_STATUSES:
                        col["is_base"] = True
                return data
        except Exception as e:
            logger.warning(f"Failed to parse user kanban_columns for user {user_id}: {e}")
    # Return deep copy of DEFAULT_COLUMNS
    return [dict(col) for col in DEFAULT_COLUMNS]


def save_user_columns(db: Session, user_id: int, columns: List[dict]):
    """Persist user columns in user_settings table."""
    setting = db.query(UserSetting).filter(
        UserSetting.user_id == user_id,
        UserSetting.key == "kanban_columns"
    ).first()
    if not setting:
        setting = UserSetting(
            user_id=user_id,
            key="kanban_columns",
            value=json.dumps(columns, ensure_ascii=False)
        )
        db.add(setting)
    else:
        setting.value = json.dumps(columns, ensure_ascii=False)
    db.commit()


def get_user_valid_statuses(db: Session, user_id: int) -> List[str]:
    """Get list of valid status IDs for the user."""
    cols = get_user_columns(db, user_id)
    statuses = [c["id"] for c in cols]
    for b in BASE_STATUSES:
        if b not in statuses:
            statuses.append(b)
    return statuses


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
    try:
        yield
    finally:
        await queue_manager.stop()


# System app has NO public documentation: docs_url=None, redoc_url=None, openapi_url=None
app = FastAPI(
    title="LinkedIn Vacancy Tracker System API",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan
)

if os.getenv("SQL_DIAGNOSTICS", "false").lower() in ("1", "true", "yes"):
    from .diagnostics import request_metrics
    @app.middleware("http")
    async def diagnostic_requests(request: Request, call_next):
        metrics = {"request_id": uuid.uuid4().hex, "sql_count": 0}
        token = request_metrics.set(metrics)
        try:
            response = await call_next(request)
            route = request.scope.get("route")
            logger.info("HTTP request_id=%s method=%s route=%s status=%s sql_count=%s",
                        metrics["request_id"], request.method, getattr(route, "path", "unmatched"),
                        response.status_code, metrics["sql_count"])
            response.headers["X-Request-ID"] = metrics["request_id"]
            response.headers["X-SQL-Queries"] = str(metrics["sql_count"])
            return response
        except Exception as exc:
            logger.error("HTTP request_id=%s failed error_type=%s", metrics["request_id"], type(exc).__name__)
            raise
        finally:
            request_metrics.reset(token)

# Public API v1 sub-application with OpenAPI documentation strictly for Public API
public_app = FastAPI(
    title="Job Vacancies Public API",
    description="Public API for accessing and managing job vacancies. Access is granted strictly via Personal API Key (header `X-API-Key: ak_...` or `Authorization: Bearer ak_...`).",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

from .public_api import router as public_router
from .auth import get_current_user_with_api_access
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse

public_app.include_router(public_router)

@public_app.get("/openapi.json", include_in_schema=False)
def get_public_openapi_json(current_user: User = Depends(get_current_user_with_api_access)):
    """Return OpenAPI schema protected by api_access feature flag."""
    schema = get_openapi(
        title=public_app.title,
        version=public_app.version,
        description=public_app.description,
        routes=public_app.routes,
    )
    return JSONResponse(schema)

@public_app.get("/docs", include_in_schema=False)
def get_public_docs_html(current_user: User = Depends(get_current_user_with_api_access)):
    """Swagger UI protected by api_access feature flag."""
    return get_swagger_ui_html(
        openapi_url="/api/v1/openapi.json",
        title=f"{public_app.title} - Swagger UI",
    )

@public_app.get("/redoc", include_in_schema=False)
def get_public_redoc_html(current_user: User = Depends(get_current_user_with_api_access)):
    """ReDoc protected by api_access feature flag."""
    return get_redoc_html(
        openapi_url="/api/v1/openapi.json",
        title=f"{public_app.title} - ReDoc",
    )

# Mount public API at /api/v1 (legacy public API)
app.mount("/api/v1", public_app)

# API v2 (Unified Public & Private API) and Legacy API (legacy extension support) routers
api_v2 = APIRouter(prefix="/api/v2")
legacy_api = APIRouter(prefix="/api")

@api_v2.get("/openapi.json", include_in_schema=False)
def get_v2_openapi_json(current_user: User = Depends(get_current_user_with_api_access)):
    """OpenAPI schema for Unified API v2."""
    schema = get_openapi(
        title="Job Vacancies Unified API v2",
        version="2.0.0",
        description="Unified Public and Private API v2 for Job Vacancies Tracker. Authenticate via Session Cookie, JWT Bearer token, or Personal API Key (header `X-API-Key: ak_...` or `Authorization: Bearer ak_...`).",
        routes=api_v2.routes,
    )
    return JSONResponse(schema)

@api_v2.get("/docs", include_in_schema=False)
def get_v2_docs_html(current_user: User = Depends(get_current_user_with_api_access)):
    return get_swagger_ui_html(
        openapi_url="/api/v2/openapi.json",
        title="Job Vacancies Unified API v2 - Swagger UI",
    )

@api_v2.get("/redoc", include_in_schema=False)
def get_v2_redoc_html(current_user: User = Depends(get_current_user_with_api_access)):
    return get_redoc_html(
        openapi_url="/api/v2/openapi.json",
        title="Job Vacancies Unified API v2 - ReDoc",
    )

# Convenience redirects for root docs/openapi pointing directly to the Unified API v2 documentation
@app.get("/docs", include_in_schema=False)
def redirect_docs(current_user: User = Depends(get_current_user_with_api_access)):
    return RedirectResponse(url="/api/v2/docs")

@app.get("/redoc", include_in_schema=False)
def redirect_redoc(current_user: User = Depends(get_current_user_with_api_access)):
    return RedirectResponse(url="/api/v2/redoc")

@app.get("/openapi.json", include_in_schema=False)
def redirect_openapi(current_user: User = Depends(get_current_user_with_api_access)):
    return RedirectResponse(url="/api/v2/openapi.json")

# CORS middleware for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(filter(None, [os.getenv("APP_URL", "").rstrip("/"),
        *os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:8000").split(","),
        f"chrome-extension://{os.getenv('EXTENSION_ID')}" if os.getenv("EXTENSION_ID") else ""])),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@api_v2.get("/health")
@legacy_api.get("/health")
def health_check():
    static_dir = os.getenv("STATIC_DIR", os.path.join(os.path.dirname(__file__), "../frontend/dist"))
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(static_dir) and not os.path.isfile(index_path):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Frontend index.html is not ready",
        )
    return {"status": "ok"}


@api_v2.get("/auth/config", response_model=AuthConfigResponse)
@legacy_api.get("/auth/config", response_model=AuthConfigResponse)
def get_auth_config():
    dev_enabled = os.getenv("DEV_AUTH", "").strip().lower() in ("true", "1", "yes")
    return AuthConfigResponse(
        google_configured=is_google_configured(),
        google_client_id=os.getenv("GOOGLE_CLIENT_ID", ""),
        dev_mode=dev_enabled,
    )


@api_v2.get("/auth/me", response_model=UserResponse)
@legacy_api.get("/auth/me", response_model=UserResponse)
def get_me(request: Request, response: Response, db: Session = Depends(get_db)):
    # If explicit API key or Authorization header was provided but invalid/unrecognized, reject with 401
    api_key_header = request.headers.get("X-API-Key") or request.headers.get("x-api-key")
    auth_header = request.headers.get("Authorization")
    if api_key_header or (auth_header and auth_header.startswith("Bearer ak_")):
        # Explicit API key check
        return get_current_user_from_api_key(request=request, api_key_param=None, db=db)

    current_user = get_optional_user(request, db)
    if not current_user:
        current_user = create_anonymous_user(db)
        token = create_access_token({"sub": str(current_user.id), "email": current_user.email, "name": current_user.name})
        response.set_cookie(
            key=COOKIE_NAME,
            value=token,
            max_age=86400 * ACCESS_TOKEN_EXPIRE_DAYS,
            httponly=True,
            samesite="lax",
            path="/",
        )
    current_user.feature_flags = [f.flag for f in db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id == current_user.id).all()]
    return current_user


@api_v2.get("/feature-flags", response_model=AvailableFeatureFlagsResponse)
def get_available_feature_flags(current_user: User = Depends(get_current_user)):
    """Return list of predefined valid feature flag constants."""
    return AvailableFeatureFlagsResponse(available_flags=KNOWN_FEATURE_FLAGS)


def _sync_user_flags_table(db: Session, user_id: int, requested_flags: List[str]) -> List[str]:
    # Restrict to known constants to prevent typos or arbitrary strings
    valid_flags = [f for f in requested_flags if f in KNOWN_FEATURE_FLAGS]
    # Remove existing
    db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id == user_id).delete()
    for flag_name in set(valid_flags):
        db.add(UserFeatureFlag(user_id=user_id, flag=flag_name))
    # Update user.feature_flags column as well for consistency
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.feature_flags = valid_flags
    db.commit()
    if user:
        db.refresh(user)
    return valid_flags


@api_v2.put("/auth/me/feature-flags", response_model=UserResponse)
@legacy_api.put("/auth/me/feature-flags", response_model=UserResponse)
def update_my_feature_flags(
    payload: UserUpdateFeatureFlagsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's feature flags."""
    if "admin" in payload.feature_flags and "admin" not in (current_user.feature_flags or []):
        raise HTTPException(status_code=403, detail="Only administrators can grant admin")
    saved_flags = _sync_user_flags_table(db, current_user.id, payload.feature_flags)
    current_user.feature_flags = saved_flags
    return current_user


def touch_user_board_interaction(db: Session, user_id: int):
    """Update last_board_interaction_at timestamp for user."""
    if not user_id:
        return
    now = datetime.datetime.utcnow()
    db.query(User).filter(User.id == user_id).update(
        {User.last_board_interaction_at: now},
        synchronize_session=False
    )


def _populate_user_stats(db: Session, users: List[User]):
    """Compute and attach vacancy stats and board interaction timestamps for users."""
    if not users:
        return

    user_ids = [u.id for u in users]

    # 1. Status counts per user
    status_counts_raw = (
        db.query(
            Vacancy.user_id,
            Vacancy.status,
            func.count(Vacancy.id)
        )
        .filter(Vacancy.user_id.in_(user_ids))
        .group_by(Vacancy.user_id, Vacancy.status)
        .all()
    )

    user_status_map: Dict[int, Dict[str, int]] = {}
    user_totals: Dict[int, int] = {}
    for uid, status_name, count in status_counts_raw:
        if uid not in user_status_map:
            user_status_map[uid] = {}
            user_totals[uid] = 0
        user_status_map[uid][status_name] = count
        user_totals[uid] += count

    # 2. Max vacancy updated_at per user
    max_vac_map: Dict[int, Optional[datetime.datetime]] = dict(
        db.query(Vacancy.user_id, func.max(Vacancy.updated_at))
        .filter(Vacancy.user_id.in_(user_ids))
        .group_by(Vacancy.user_id)
        .all()
    )

    # 3. Max vacancy status history created_at per user
    max_hist_map: Dict[int, Optional[datetime.datetime]] = dict(
        db.query(Vacancy.user_id, func.max(VacancyStatusHistory.created_at))
        .join(VacancyStatusHistory, Vacancy.id == VacancyStatusHistory.vacancy_id)
        .filter(Vacancy.user_id.in_(user_ids))
        .group_by(Vacancy.user_id)
        .all()
    )

    # 4. LLM Token usage summary per user and per provider
    token_usage_raw = (
        db.query(
            UserLLMTokenUsage.user_id,
            UserLLMTokenUsage.provider,
            func.sum(UserLLMTokenUsage.prompt_tokens),
            func.sum(UserLLMTokenUsage.completion_tokens),
            func.sum(UserLLMTokenUsage.total_tokens),
            func.count(UserLLMTokenUsage.id)
        )
        .filter(UserLLMTokenUsage.user_id.in_(user_ids))
        .group_by(UserLLMTokenUsage.user_id, UserLLMTokenUsage.provider)
        .all()
    )

    user_tokens_map: Dict[int, Dict[str, Any]] = {}
    for uid, prov, p_tok, c_tok, t_tok, req_count in token_usage_raw:
        if uid not in user_tokens_map:
            user_tokens_map[uid] = {
                "total_tokens": 0,
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_requests": 0,
                "by_provider": {}
            }
        p_tok = int(p_tok or 0)
        c_tok = int(c_tok or 0)
        t_tok = int(t_tok or 0)
        req_count = int(req_count or 0)

        user_tokens_map[uid]["total_tokens"] += t_tok
        user_tokens_map[uid]["prompt_tokens"] += p_tok
        user_tokens_map[uid]["completion_tokens"] += c_tok
        user_tokens_map[uid]["total_requests"] += req_count
        user_tokens_map[uid]["by_provider"][prov] = {
            "total_tokens": t_tok,
            "prompt_tokens": p_tok,
            "completion_tokens": c_tok,
            "requests": req_count,
        }

    # 5. Fetch API keys per user
    api_keys_raw = (
        db.query(ApiKey)
        .filter(ApiKey.user_id.in_(user_ids))
        .order_by(ApiKey.created_at.desc())
        .all()
    )
    user_api_keys_map: Dict[int, List[ApiKey]] = {}
    user_api_req_totals: Dict[int, int] = {}
    for k in api_keys_raw:
        if k.user_id not in user_api_keys_map:
            user_api_keys_map[k.user_id] = []
            user_api_req_totals[k.user_id] = 0
        user_api_keys_map[k.user_id].append(k)
        user_api_req_totals[k.user_id] += int(k.request_count or 0)

    def _normalize_dt(dt: Optional[datetime.datetime]) -> Optional[datetime.datetime]:
        if dt is None:
            return None
        if dt.tzinfo is not None:
            return dt.astimezone(datetime.timezone.utc).replace(tzinfo=None)
        return dt

    for u in users:
        u.feature_flags = [f.flag for f in (u.flags or [])]
        u.api_keys = user_api_keys_map.get(u.id, [])

        candidates = [
            ndt for ndt in [
                _normalize_dt(u.last_board_interaction_at),
                _normalize_dt(max_vac_map.get(u.id)),
                _normalize_dt(max_hist_map.get(u.id))
            ]
            if ndt is not None
        ]
        effective_board_interaction = max(candidates) if candidates else None

        u.stats = UserStatsSummary(
            total_vacancies=user_totals.get(u.id, 0),
            by_status=user_status_map.get(u.id, {}),
            last_login_at=u.last_login_at,
            last_board_interaction_at=effective_board_interaction,
            api_keys_count=len(user_api_keys_map.get(u.id, [])),
            api_requests_count=user_api_req_totals.get(u.id, 0),
            llm_tokens=user_tokens_map.get(u.id, {
                "total_tokens": 0,
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_requests": 0,
                "by_provider": {}
            })
        )


@api_v2.get("/users", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all users (requires admin permission/feature flag)."""
    user_flags = current_user.feature_flags or []
    if "admin" not in user_flags:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    users = db.query(User).options(selectinload(User.flags)).order_by(User.id.asc()).all()
    _populate_user_stats(db, users)
    return users


@api_v2.put("/users/{user_id}/feature-flags", response_model=UserResponse)
def update_user_feature_flags(
    user_id: int,
    payload: UserUpdateFeatureFlagsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update feature flags for a specified user (requires admin permission or self-update)."""
    user_flags = current_user.feature_flags or []
    is_admin = "admin" in user_flags
    if user_id != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if "admin" in payload.feature_flags and not is_admin:
        raise HTTPException(status_code=403, detail="Only administrators can grant admin")
    saved_flags = _sync_user_flags_table(db, user.id, payload.feature_flags)
    user.feature_flags = saved_flags
    return user


@api_v2.get("/auth/google/login")
@legacy_api.get("/auth/google/login")
def google_login(request: Request):
    if not is_google_configured():
        raise HTTPException(
            status_code=400,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
        )
    
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    if not redirect_uri:
        redirect_uri = str(request.base_url).rstrip("/") + "/api/v2/auth/google/callback"
    
    state = uuid.uuid4().hex
    auth_url = get_google_auth_url(redirect_uri=redirect_uri, state=state)
    response = RedirectResponse(url=auth_url)
    response.set_cookie("oauth_state", state, max_age=600, httponly=True, samesite="lax", secure=os.getenv("APP_URL", "").startswith("https://"))
    return response


@api_v2.get("/auth/google/callback")
@legacy_api.get("/auth/google/callback")
async def google_callback(
    request: Request,
    code: str = Query(...),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    cookie_state = request.cookies.get("oauth_state")
    import secrets
    if not cookie_state or not state or not secrets.compare_digest(cookie_state, state):
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    if not redirect_uri:
        redirect_uri = str(request.base_url).rstrip("/") + "/api/v2/auth/google/callback"
    
    tokens = await exchange_google_code(code, redirect_uri=redirect_uri)
    access_token = tokens.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token returned by Google")
    
    user_info = await get_google_user_info(access_token)
    google_id = user_info.get("sub")
    email = user_info.get("email")
    name = user_info.get("name", "")
    picture = user_info.get("picture")

    if not google_id or not email or user_info.get("email_verified") is not True:
        raise HTTPException(status_code=400, detail="Incomplete user profile from Google")

    # If the user previously had an anonymous guest session, migrate data
    prev_user = get_optional_user(request, db)
    prev_anon_id = prev_user.id if (prev_user and prev_user.is_anonymous) else None

    user = get_or_create_user(db, google_id=google_id, email=email, name=name, picture=picture)
    if prev_anon_id:
        migrate_anonymous_user_data(db, anon_user_id=prev_anon_id, target_user=user)

    token = create_access_token({"sub": str(user.id), "email": user.email, "name": user.name})

    response = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=86400 * ACCESS_TOKEN_EXPIRE_DAYS,
        httponly=True,
        secure=os.getenv("APP_URL", "").startswith("https://"),
        samesite="lax",
        path="/",
    )
    response.delete_cookie("oauth_state")
    return response


@api_v2.post("/auth/dev-login")
def dev_login(payload: DevLoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    dev_enabled = os.getenv("DEV_AUTH", "").strip().lower() in ("true", "1", "yes")
    if not dev_enabled:
        raise HTTPException(status_code=403, detail="Dev login is disabled in production")
    
    # If the user previously had an anonymous guest session, migrate data
    prev_user = get_optional_user(request, db)
    prev_anon_id = prev_user.id if (prev_user and prev_user.is_anonymous) else None

    user = get_or_create_dev_user(db, email=payload.email or "dev@local.user", name=payload.name or "Dev User")
    if prev_anon_id:
        migrate_anonymous_user_data(db, anon_user_id=prev_anon_id, target_user=user)

    token = create_access_token({"sub": str(user.id), "email": user.email, "name": user.name})
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=86400 * ACCESS_TOKEN_EXPIRE_DAYS,
        httponly=True,
        secure=os.getenv("APP_URL", "").startswith("https://"),
        samesite="lax",
        path="/",
    )
    return {
        "user": UserResponse.model_validate(user),
        "token": token,
    }


@api_v2.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    response.delete_cookie(key=MERCURE_COOKIE, path="/.well-known/mercure")
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Admin API: User & Feature Flag Management
# ---------------------------------------------------------------------------

@api_v2.get("/admin/users", response_model=List[UserResponse])
def admin_get_users(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    users = db.query(User).options(selectinload(User.flags)).order_by(User.id.asc()).all()
    _populate_user_stats(db, users)
    return users


@api_v2.patch("/admin/users/{user_id}", response_model=UserResponse)
def admin_update_user(
    user_id: int,
    payload: AdminUserUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.feature_flags is not None:
        saved_flags = _sync_user_flags_table(db, target_user.id, payload.feature_flags)
        target_user.feature_flags = saved_flags

    db.commit()
    db.refresh(target_user)
    target_user.feature_flags = [f.flag for f in db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id == target_user.id).all()]
    return target_user


@api_v2.get("/config")
def get_config(response: Response, current_user: User = Depends(get_current_user)):
    set_subscriber_cookie(response, current_user.id)
    response.headers["Cache-Control"] = "no-store"
    """Return Mercure public hub URL and topics for frontend SSE connection."""
    topic = f"vacancies:{current_user.id}" if current_user else "vacancies"
    return {
        "mercure_hub_url": get_mercure_public_url(),
        "mercure_topic": topic,
    }


@legacy_api.get("/queue/status", response_model=QueueStatusResponse)
async def get_queue_status(current_user: User = Depends(get_current_user)):
    """Get active parsing queue status and recent tasks scoped to user."""
    return await queue_manager.get_status(user_id=current_user.id)

@legacy_api.get("/queue/tasks", response_model=List[TaskInfo])
async def get_queue_tasks(current_user: User = Depends(get_current_user)):
    """Get active tasks in the queue."""
    return await queue_manager.get_active_tasks(user_id=current_user.id)

@legacy_api.get("/queue/links", response_model=QueueLinksResponse)
async def get_queue_links(current_user: User = Depends(get_current_user)):
    """Get active links and their processing stages for the current user."""
    return await queue_manager.get_active_links(user_id=current_user.id)

@api_v2.post("/queue/sync", status_code=202)
async def sync_queue_state(current_user: User = Depends(get_current_user)):
    """Ask the backend to republish the current queue snapshot; the data is delivered only via Mercure `queue_state`."""
    await queue_manager.publish_queue_state(user_id=current_user.id)
    return Response(status_code=202)

@api_v2.delete("/queue/links")
@api_v2.delete("/queue/clear")
@legacy_api.delete("/queue/links")
@legacy_api.delete("/queue/clear")
async def clear_queue_links(current_user: User = Depends(get_current_user)):
    """Clear/cancel all active and failed links in the processing queue for the current user."""
    cleared_count = await queue_manager.clear_user_queue(user_id=current_user.id)
    return {"message": "All queue links cleared", "cleared": cleared_count}

@legacy_api.get("/queue/links/{task_id}", response_model=ProcessingLinkInfo)
async def get_queue_link(task_id: str, current_user: User = Depends(get_current_user)):
    """Retrieve current stage and state of a single link task."""
    info = await queue_manager.get_link_info(task_id=task_id, user_id=current_user.id)
    if not info:
        raise HTTPException(status_code=404, detail="Queue link task not found or access denied")
    return info

@api_v2.delete("/queue/links/{task_id}")
@legacy_api.delete("/queue/links/{task_id}")
async def cancel_queue_link(task_id: str, current_user: User = Depends(get_current_user)):
    """Cancel/remove a link from the processing queue."""
    success = await queue_manager.remove_task(task_id=task_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found or cannot be cancelled")
    return {"message": "Link processing cancelled"}

@api_v2.delete("/queue/tasks/{task_id}")
@legacy_api.delete("/queue/tasks/{task_id}")
async def cancel_queue_task(task_id: str, current_user: User = Depends(get_current_user)):
    """Cancel a task in the queue."""
    success = await queue_manager.remove_task(task_id=task_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found or cannot be cancelled")
    return {"message": "Task cancelled"}


@api_v2.get("/vacancies", response_model=List[VacancyResponse])
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
    return query.order_by(Vacancy.updated_at.desc(), Vacancy.id.desc()).all()


@api_v2.get("/vacancies/{vacancy_id}", response_model=VacancyResponse)
def get_vacancy(
    vacancy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return v


@api_v2.post("/vacancies", response_model=VacancyResponse)
async def create_vacancy(
    payload: VacancyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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

    # Record initial stage in history
    history_entry = VacancyStatusHistory(
        vacancy_id=v.id,
        from_status=None,
        to_status=v.status,
        from_lane=None,
        to_lane=v.lane,
        comment=None,
        created_at=v.created_at,
    )
    db.add(history_entry)
    touch_user_board_interaction(db, current_user.id)
    db.commit()
    db.refresh(v)

    mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
    vacancy_data = VacancyResponse.model_validate(v).model_dump(mode="json")
    await publish_mercure_event(
            event_type=EVENT_VACANCY_CREATED,
            data={
                "message_code": MSG_VACANCY_CREATED,
                "vacancy": vacancy_data,
            },
            topic=mercure_topic,
        )
    return v


@api_v2.post("/vacancies/reorder")
async def reorder_vacancies(
    payload: VacancyReorderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Set the manual order of cards in a column (and move cards into it if needed)."""
    valid_statuses = get_user_valid_statuses(db, current_user.id)
    if payload.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    vacancies = db.query(Vacancy).filter(
        Vacancy.id.in_(payload.ids), Vacancy.user_id == current_user.id
    ).all()
    by_id = {v.id: v for v in vacancies}

    cols = get_user_columns(db, current_user.id)
    target_col = next((c for c in cols if c.get("id") == payload.status), None)
    has_lanes = bool(target_col and target_col.get("has_lanes"))

    moved_set = set()
    if payload.moved_id is not None:
        moved_set.add(payload.moved_id)
    if payload.moved_ids:
        moved_set.update(payload.moved_ids)

    changed = []
    for position, vid in enumerate(payload.ids):
        v = by_id.get(vid)
        if not v:
            continue
        old_status = v.status
        old_lane = v.lane
        status_changed = (old_status != payload.status)

        new_lane = old_lane
        if not has_lanes:
            new_lane = 0
        else:
            # Only update lane if this card was the moved card or moved into this column
            if (vid in moved_set) or (status_changed and not moved_set):
                new_lane = max(0, payload.lane)

        lane_changed = has_lanes and (new_lane != old_lane)

        if status_changed or lane_changed:
            db.add(VacancyStatusHistory(
                vacancy_id=v.id,
                from_status=old_status,
                to_status=payload.status,
                from_lane=old_lane,
                to_lane=new_lane,
                comment=None,
                created_at=datetime.datetime.utcnow(),
            ))
            v.status = payload.status
            v.lane = new_lane
        elif not has_lanes:
            v.lane = 0

        v.sort_order = float(position)
        changed.append(v)

    touch_user_board_interaction(db, current_user.id)
    db.commit()
    for v in changed:
        db.refresh(v)

    mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
    for v in changed:
        vacancy_data = VacancyResponse.model_validate(v).model_dump(mode="json")
        await publish_mercure_event(
                event_type=EVENT_VACANCY_UPDATED,
                data={
                    "message_code": MSG_VACANCY_UPDATED,
                    "vacancy": vacancy_data,
                },
                topic=mercure_topic,
            )
    return [VacancyResponse.model_validate(v) for v in changed]


@api_v2.patch("/vacancies/{vacancy_id}", response_model=VacancyResponse)
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
    valid_statuses = get_user_valid_statuses(db, current_user.id)
    if "status" in update_data and update_data["status"] not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    old_status = v.status
    old_lane = v.lane
    status_changed = ("status" in update_data and update_data["status"] != old_status)
    target_status = update_data.get("status", old_status)

    cols = get_user_columns(db, current_user.id)
    target_col = next((c for c in cols if c.get("id") == target_status), None)
    target_has_lanes = bool(target_col and target_col.get("has_lanes"))

    new_lane = old_lane
    if "lane" in update_data and update_data["lane"] is not None:
        new_lane = max(0, update_data["lane"])
    elif status_changed and "sort_order" not in update_data:
        new_lane = 0

    if not target_has_lanes:
        new_lane = 0

    lane_changed = target_has_lanes and (new_lane != old_lane)

    status_comment = update_data.pop("status_comment", None)
    if status_changed or lane_changed:
        history_entry = VacancyStatusHistory(
            vacancy_id=v.id,
            from_status=old_status,
            to_status=target_status,
            from_lane=old_lane,
            to_lane=new_lane,
            comment=status_comment,
            created_at=datetime.datetime.utcnow(),
        )
        db.add(history_entry)
        v.status = target_status
        v.lane = new_lane
        # Moved to another column: drop manual position so the card lands on top
        if "sort_order" not in update_data and status_changed:
            v.sort_order = None

    content_changed = any(f in update_data for f in ["title", "description", "tech_stack", "company"])
    for field, val in update_data.items():
        setattr(v, field, val)

    if not target_has_lanes:
        v.lane = 0

    if content_changed:
        db.query(VacancyCVAnalysis).filter(
            VacancyCVAnalysis.vacancy_id == v.id,
            VacancyCVAnalysis.user_id == current_user.id
        ).update({"is_outdated": True})

    touch_user_board_interaction(db, current_user.id)
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


@api_v2.patch("/vacancies/{vacancy_id}/history/{history_id}", response_model=VacancyResponse)
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
    touch_user_board_interaction(db, current_user.id)
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


@api_v2.get("/vacancies/{vacancy_id}/history", response_model=List[VacancyHistoryItem])
def get_vacancy_history_list(
    vacancy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    history_records = (
        db.query(VacancyStatusHistory)
        .filter(VacancyStatusHistory.vacancy_id == v.id)
        .order_by(VacancyStatusHistory.changed_at.desc(), VacancyStatusHistory.id.desc())
        .all()
    )
    return [VacancyHistoryItem.model_validate(h) for h in history_records]


@api_v2.post("/vacancies/{vacancy_id}/history", response_model=VacancyResponse)
async def add_vacancy_history_entry(
    vacancy_id: int,
    payload: VacancyHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    valid_statuses = get_user_valid_statuses(db, current_user.id)
    if payload.to_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    to_lane = payload.to_lane if payload.to_lane is not None else v.lane
    cols = get_user_columns(db, current_user.id)
    target_col = next((c for c in cols if c.get("id") == payload.to_status), None)
    if target_col and not target_col.get("has_lanes"):
        to_lane = 0

    history_entry = VacancyStatusHistory(
        vacancy_id=v.id,
        from_status=payload.from_status if payload.from_status is not None else v.status,
        to_status=payload.to_status,
        from_lane=payload.from_lane if payload.from_lane is not None else v.lane,
        to_lane=to_lane,
        comment=payload.comment,
        created_at=datetime.datetime.utcnow(),
    )
    v.status = payload.to_status
    v.lane = to_lane
    db.add(history_entry)
    touch_user_board_interaction(db, current_user.id)
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


@api_v2.delete("/vacancies/{vacancy_id}/history/{history_id}", response_model=VacancyResponse)
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
    touch_user_board_interaction(db, current_user.id)
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


@api_v2.delete("/vacancies/{vacancy_id}", status_code=status.HTTP_204_NO_CONTENT)
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
    touch_user_board_interaction(db, current_user.id)
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


@api_v2.post("/vacancies/check-duplicates", response_model=CheckDuplicatesResponse)
async def check_duplicates(
    payload: CheckDuplicatesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Check if any of the incoming URLs already exist as vacancies for current_user.
    All URLs are normalized first.
    """
    return duplicate_response(db, current_user.id, payload.urls)


@api_v2.post("/vacancies/batch", response_model=AsyncBatchImportResponse)
async def batch_import_vacancies(
    payload: BatchImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Enqueue a list of LinkedIn URLs to background queue.
    """
    # Filter out blank lines, normalize URLs, and deduplicate
    unique_urls = []
    seen = set()
    for raw_url in payload.urls:
        u = raw_url.strip()
        if u:
            canonical_u = normalize_url(u)
            if canonical_u and canonical_u not in seen:
                seen.add(canonical_u)
                unique_urls.append(canonical_u)

    job_ids = {extract_job_id(url) for url in unique_urls} - {None}

    # Deduplicate against URLs currently active in the queue for this user
    active_in_queue = db.query(ProcessingQueueItem.normalized_url).filter(
        ProcessingQueueItem.user_id == current_user.id,
        ProcessingQueueItem.normalized_url.in_(unique_urls),
        ProcessingQueueItem.status.in_(["pending", "processing"]),
    ).all() if unique_urls else []
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

    matches = db.query(Vacancy.id, Vacancy.job_id, Vacancy.url).filter(
        Vacancy.user_id == current_user.id,
        or_(Vacancy.url.in_(urls_to_process), Vacancy.job_id.in_(job_ids))).all() if urls_to_process else []
    ids_by_job = {row.job_id: row.id for row in matches if row.job_id}
    ids_by_url = {row.url: row.id for row in matches}
    vacancy_ids = []
    for url in urls_to_process:
        job_id = extract_job_id(url)
        existing_id = ids_by_job.get(job_id) or ids_by_url.get(url)
        if not existing_id:
            v = Vacancy(
                user_id=current_user.id,
                job_id=job_id,
                url=url,
                title=url[:255],
                company="Upwork" if "upwork.com" in url else "Загрузка...",
                status=STATUS_NOT_CONTACTED,
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
            ids_by_url[url] = v.id
            if job_id:
                ids_by_job[job_id] = v.id

            mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
            vacancy_data = VacancyResponse.model_validate(v).model_dump(mode="json")
            await publish_mercure_event(
                    event_type=EVENT_VACANCY_CREATED,
                    data={
                        "message_code": MSG_VACANCY_CREATED,
                        "vacancy": vacancy_data,
                        "url": url,
                    },
                    topic=mercure_topic,
                )
        else:
            vacancy_ids.append(existing_id)

    batch_id, tasks = await queue_manager.enqueue(
        urls_to_process, payload.default_tags, vacancy_ids=vacancy_ids, user_id=current_user.id
    )
    msg = f"{len(tasks)} вакансий успешно добавлено в очередь на обработку"
    if already_queued_urls:
        msg += f" ({len(already_queued_urls)} уже в очереди)"
    return AsyncBatchImportResponse(
        status="queued",
        queued=len(tasks),
        batch_id=batch_id,
        message=msg,
        tasks=[t.to_info() for t in tasks],
        already_in_queue=list(already_queued_urls),
    )


@api_v2.post("/vacancies/{vacancy_id}/resummarize", response_model=VacancyResponse)
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

    if not v.description or not v.description.strip():
        raise HTTPException(
            status_code=400,
            detail="Vacancy has no description. Please provide a description before requesting AI summarization.",
        )

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
    await publish_mercure_event(
            event_type=EVENT_VACANCY_UPDATED,
            data={
                "message_code": MSG_VACANCY_UPDATED,
                "vacancy": vacancy_data,
            },
            topic=mercure_topic,
        )
    return v


@api_v2.post("/vacancies/{vacancy_id}/reparse")
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

    clean_url = normalize_url(v.url.strip())
    active_in_queue = db.query(ProcessingQueueItem).filter(
        ProcessingQueueItem.user_id == current_user.id,
        ProcessingQueueItem.normalized_url == clean_url,
        ProcessingQueueItem.status.in_(["pending", "processing"]),
    ).first()
    if active_in_queue:
        return {
            "status": "already_queued",
            "batch_id": "",
            "task_id": active_in_queue.task_id,
            "message": "Вакансия уже находится в очереди обработки",
        }

    batch_id, tasks = await queue_manager.enqueue(
        [v.url], default_tags=[], vacancy_ids=[v.id], user_id=current_user.id
    )
    return {
        "status": "queued",
        "batch_id": batch_id,
        "task_id": tasks[0].task_id if tasks else None,
        "message": "Вакансия отправлена на повторную обработку в фоне",
    }


@api_v2.post("/vacancies/reparse_all")
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
    norm_urls = [normalize_url(u.strip()) for u in urls if u and normalize_url(u.strip())]
    active_in_queue = db.query(ProcessingQueueItem.normalized_url).filter(
        ProcessingQueueItem.user_id == current_user.id,
        ProcessingQueueItem.normalized_url.in_(norm_urls),
        ProcessingQueueItem.status.in_(["pending", "processing"]),
    ).all() if norm_urls else []
    already_queued = {r[0] for r in active_in_queue}

    vacs_to_reparse = [v for v in vacancies if normalize_url(v.url.strip()) not in already_queued]
    if not vacs_to_reparse:
        return {"message": "Все вакансии уже находятся в очереди обновления", "enqueued": 0}

    urls_to_enqueue = [v.url for v in vacs_to_reparse]
    vacancy_ids = [v.id for v in vacs_to_reparse]

    batch_id, tasks = await queue_manager.enqueue(
        urls=urls_to_enqueue, default_tags=[], vacancy_ids=vacancy_ids, user_id=current_user.id
    )
    
    return {
        "status": "queued",
        "batch_id": batch_id,
        "enqueued": len(tasks),
        "message": f"Отправлено на обновление: {len(tasks)} вакансий",
    }


@api_v2.get("/tags", response_model=List[str])
def list_unique_tags(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vacancies = db.query(Vacancy.tags).filter(Vacancy.user_id == current_user.id).all()
    all_tags = set()
    for v in vacancies:
        for t in (v[0] or []):
            if t and t.strip():
                all_tags.add(t.strip())
    return sorted(list(all_tags))


@api_v2.get("/countries", response_model=List[str])
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


@api_v2.get("/cities", response_model=List[str])
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


@api_v2.get("/sources", response_model=List[str])
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


@api_v2.get("/settings", response_model=SettingsResponse)
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    locale = get_setting_or_env(db, "locale", os.getenv("LOCALE", "ru"), user_id=current_user.id)
    salary_display_format = get_setting_or_env(db, "salary_display_format", "month", user_id=current_user.id)
    columns_raw = get_user_columns(db, current_user.id)
    columns = [ColumnItem(**c) for c in columns_raw]

    return SettingsResponse(
        locale=locale,
        salary_display_format=salary_display_format,
        columns=columns,
    )


@api_v2.post("/settings", response_model=SettingsResponse)
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

    if payload.columns is not None:
        cols_data = [c.model_dump() for c in payload.columns]
        # Validate that BASE_STATUSES are preserved
        col_ids = [c["id"] for c in cols_data]
        for b in BASE_STATUSES:
            if b not in col_ids:
                raise HTTPException(status_code=400, detail=f"Base column '{b}' cannot be removed")
        save_user_columns(db, current_user.id, cols_data)

    db.commit()

    return get_settings(current_user=current_user, db=db)


@api_v2.get("/api-keys", response_model=List[ApiKeyResponse])
def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List API keys generated by the current user (requires api_access or admin)."""
    user_flags = current_user.feature_flags or []
    if "api_access" not in user_flags and "admin" not in user_flags:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API access is disabled for your account (missing feature flag api_access)",
        )
    keys = (
        db.query(ApiKey)
        .filter(ApiKey.user_id == current_user.id)
        .order_by(ApiKey.created_at.desc())
        .all()
    )
    return keys


@api_v2.post("/api-keys", response_model=ApiKeyCreatedResponse)
def create_api_key(
    payload: ApiKeyCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a new personal API key for the current user (requires api_access or admin)."""
    user_flags = current_user.feature_flags or []
    if "api_access" not in user_flags and "admin" not in user_flags:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API access is disabled for your account (missing feature flag api_access)",
        )
    import secrets
    import hashlib

    raw_token = f"ak_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    key_prefix = raw_token[:10]  # e.g. "ak_abcdefg..."

    name = (payload.name or "Default API Key").strip() or "Default API Key"
    new_key = ApiKey(
        user_id=current_user.id,
        name=name,
        key_hash=key_hash,
        key_prefix=key_prefix,
        created_at=datetime.datetime.utcnow(),
    )
    db.add(new_key)
    db.commit()
    db.refresh(new_key)

    return ApiKeyCreatedResponse(
        id=new_key.id,
        name=new_key.name,
        key_prefix=new_key.key_prefix,
        created_at=new_key.created_at,
        last_used_at=new_key.last_used_at,
        token=raw_token,
    )


@api_v2.delete("/api-keys/{key_id}")
def revoke_api_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke/delete an API key."""
    key_record = (
        db.query(ApiKey)
        .filter(ApiKey.id == key_id, ApiKey.user_id == current_user.id)
        .first()
    )
    if not key_record:
        raise HTTPException(status_code=404, detail="API key not found")

    db.delete(key_record)
    db.commit()
    return {"status": "ok", "message": "API key revoked"}


@api_v2.get("/columns", response_model=List[ColumnItem])
def list_columns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's Kanban columns list."""
    cols = get_user_columns(db, current_user.id)
    return [ColumnItem(**c) for c in cols]


@api_v2.post("/columns", response_model=List[ColumnItem])
def create_column(
    payload: ColumnCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new custom column."""
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Column name cannot be empty")

    cols = get_user_columns(db, current_user.id)
    if any(c["id"].lower() == name.lower() for c in cols):
        raise HTTPException(status_code=400, detail=f"Column with name '{name}' already exists")

    new_col = {
        "id": name,
        "color": payload.color or "#6366f1",
        "has_lanes": bool(payload.has_lanes),
        "is_base": False,
    }
    # Insert before the last column if the last column is "Отказ", otherwise append
    if cols and cols[-1].get("id") == "Отказ":
        cols.insert(len(cols) - 1, new_col)
    else:
        cols.append(new_col)

    save_user_columns(db, current_user.id, cols)
    touch_user_board_interaction(db, current_user.id)
    db.commit()
    return [ColumnItem(**c) for c in cols]


@api_v2.patch("/columns/{column_id}", response_model=List[ColumnItem])
async def update_column(
    column_id: str,
    payload: ColumnUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rename or update properties (color, has_lanes) of a column."""
    cols = get_user_columns(db, current_user.id)
    target_idx = next((i for i, c in enumerate(cols) if c["id"] == column_id), None)
    if target_idx is None:
        raise HTTPException(status_code=404, detail="Column not found")

    target = cols[target_idx]
    vacancies_to_rename = []

    if payload.new_name is not None:
        new_name = payload.new_name.strip()
        if not new_name:
            raise HTTPException(status_code=400, detail="Column name cannot be empty")
        if column_id in BASE_STATUSES and new_name != column_id:
            raise HTTPException(status_code=400, detail="Base columns cannot be renamed")
        if new_name != column_id and any(c["id"].lower() == new_name.lower() for c in cols):
            raise HTTPException(status_code=400, detail=f"Column with name '{new_name}' already exists")

        if new_name != column_id:
            vacancies_to_rename = db.query(Vacancy).filter(
                Vacancy.user_id == current_user.id,
                Vacancy.status == column_id
            ).all()

            # Update all vacancies belonging to current user that have this status
            db.query(Vacancy).filter(
                Vacancy.user_id == current_user.id,
                Vacancy.status == column_id
            ).update({"status": new_name}, synchronize_session="fetch")

            # Also update status history
            db.query(VacancyStatusHistory).filter(
                VacancyStatusHistory.vacancy_id.in_(
                    db.query(Vacancy.id).filter(Vacancy.user_id == current_user.id)
                ),
                VacancyStatusHistory.to_status == column_id
            ).update({"to_status": new_name}, synchronize_session="fetch")

            db.query(VacancyStatusHistory).filter(
                VacancyStatusHistory.vacancy_id.in_(
                    db.query(Vacancy.id).filter(Vacancy.user_id == current_user.id)
                ),
                VacancyStatusHistory.from_status == column_id
            ).update({"from_status": new_name}, synchronize_session="fetch")

            target["id"] = new_name

    if payload.color is not None:
        target["color"] = payload.color.strip()

    if payload.has_lanes is not None:
        target["has_lanes"] = bool(payload.has_lanes)

    save_user_columns(db, current_user.id, cols)
    touch_user_board_interaction(db, current_user.id)
    db.commit()

    if vacancies_to_rename:
        mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
        for v in vacancies_to_rename:
            db.refresh(v)
            vacancy_data = VacancyResponse.model_validate(v).model_dump(mode="json")
            await publish_mercure_event(
                event_type=EVENT_VACANCY_UPDATED,
                data={
                    "message_code": MSG_VACANCY_UPDATED,
                    "vacancy": vacancy_data,
                },
                topic=mercure_topic,
            )

    return [ColumnItem(**c) for c in cols]


@api_v2.delete("/columns/{column_id}", response_model=List[ColumnItem])
async def delete_column(
    column_id: str,
    migrate_to: Optional[str] = Query(STATUS_NOT_CONTACTED, alias="migrate_to"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a column and migrate any existing vacancies in it to migrate_to column."""
    if column_id in BASE_STATUSES:
        raise HTTPException(status_code=400, detail=f"Base column '{column_id}' cannot be deleted")

    cols = get_user_columns(db, current_user.id)
    if not any(c["id"] == column_id for c in cols):
        raise HTTPException(status_code=404, detail="Column not found")

    target_migrate = migrate_to.strip() if migrate_to else STATUS_NOT_CONTACTED
    # Ensure target_migrate exists in remaining columns or BASE_STATUSES
    remaining_cols = [c for c in cols if c["id"] != column_id]
    if not any(c["id"] == target_migrate for c in remaining_cols) and target_migrate not in BASE_STATUSES:
        target_migrate = STATUS_NOT_CONTACTED

    # Migrate vacancies in deleted column
    vacancies_to_migrate = db.query(Vacancy).filter(
        Vacancy.user_id == current_user.id,
        Vacancy.status == column_id
    ).all()

    for v in vacancies_to_migrate:
        history_entry = VacancyStatusHistory(
            vacancy_id=v.id,
            from_status=v.status,
            to_status=target_migrate,
            comment=f"Column '{column_id}' deleted; migrated",
            created_at=datetime.datetime.utcnow(),
        )
        db.add(history_entry)
        v.status = target_migrate
        v.sort_order = None
        v.lane = 0

    save_user_columns(db, current_user.id, remaining_cols)
    touch_user_board_interaction(db, current_user.id)
    db.commit()

    if vacancies_to_migrate:
        mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
        for v in vacancies_to_migrate:
            db.refresh(v)
            vacancy_data = VacancyResponse.model_validate(v).model_dump(mode="json")
            await publish_mercure_event(
                event_type=EVENT_VACANCY_UPDATED,
                data={
                    "message_code": MSG_VACANCY_UPDATED,
                    "vacancy": vacancy_data,
                },
                topic=mercure_topic,
            )

    return [ColumnItem(**c) for c in remaining_cols]


@api_v2.put("/columns/order", response_model=List[ColumnItem])
def reorder_columns(
    payload: ColumnsOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reorder columns list."""
    cols_data = [c.model_dump() for c in payload.columns]
    col_ids = [c["id"] for c in cols_data]
    for b in BASE_STATUSES:
        if b not in col_ids:
            raise HTTPException(status_code=400, detail=f"Base column '{b}' cannot be missing")
    save_user_columns(db, current_user.id, cols_data)
    touch_user_board_interaction(db, current_user.id)
    db.commit()
    return [ColumnItem(**c) for c in cols_data]


@api_v2.get("/extension/tasks", response_model=List[ExtensionTaskResponse])
@legacy_api.get("/extension/tasks", response_model=List[ExtensionTaskResponse])
async def get_extension_tasks(current_user: User = Depends(get_current_user)):
    redis = queue_manager.redis
    if not redis: return []
    task_ids = await redis.lrange("queue:extension", 0, -1)
    tasks = []
    for tid in task_ids:
        raw = await redis.get(f"{TASK_KEY_PREFIX}{tid}")
        if raw:
            t = JobTask.from_dict(json.loads(raw))
            if t.status == "pending_extension" and t.user_id == current_user.id:
                tasks.append(ExtensionTaskResponse(task_id=t.task_id, url=t.url))
    return tasks

@api_v2.get("/extension/mercure_config")
@legacy_api.get("/extension/mercure_config")
async def get_extension_mercure_config(response: Response, current_user: User = Depends(get_current_user)):
    set_subscriber_cookie(response, current_user.id)
    response.headers["Cache-Control"] = "no-store"
    return {
        "mercure_hub_url": get_mercure_public_url(),
        "topic": f"vacancies:{current_user.id}"
    }

@api_v2.post("/extension/ping")
@legacy_api.post("/extension/ping")
async def extension_ping(payload: Optional[Dict[str, Any]] = None, current_user: User = Depends(get_current_user)):
    redis = queue_manager.redis
    if redis:
        await redis.set(f"extension:active:{current_user.id}", str(time.time()), ex=180)
        if payload and payload.get("version"):
            await redis.set(f"extension:version:{current_user.id}", str(payload["version"]), ex=604800)
    return {"status": "ok"}

@api_v2.get("/extension/changelog")
@legacy_api.get("/extension/changelog")
async def get_extension_changelog():
    changelog_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "extension", "changelog.json")
    if not os.path.exists(changelog_path):
        # Fallback if file not found in parent directory
        changelog_path = os.path.join(os.getcwd(), "extension", "changelog.json")
    if os.path.exists(changelog_path):
        try:
            with open(changelog_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to read extension changelog: {e}")
    return {"latest_version": "1.0.7", "releases": {}}

@api_v2.get("/extension/status")
@legacy_api.get("/extension/status")
async def extension_status(current_user: User = Depends(get_current_user)):
    # extension_id lets the web app ping the extension via externally_connectable
    extension_id = os.getenv("EXTENSION_ID") or None
    redis = queue_manager.redis
    if not redis:
        return {"active": False, "extension_id": extension_id, "last_known_version": None}
    val = await redis.get(f"extension:active:{current_user.id}")
    last_version = await redis.get(f"extension:version:{current_user.id}")
    return {
        "active": bool(val),
        "extension_id": extension_id,
        "last_known_version": last_version if last_version else None
    }

@api_v2.post("/extension/tasks/{task_id}/result")
@legacy_api.post("/extension/tasks/{task_id}/result")
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

@api_v2.post("/extension/tasks/{task_id}/error")
@legacy_api.post("/extension/tasks/{task_id}/error")
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

@api_v2.post("/extension/log")
@legacy_api.post("/extension/log")
async def extension_remote_log(payload: Dict[str, Any]):
    level = (payload.get("level") or "info").lower()
    msg = payload.get("message") or ""
    data = payload.get("data")
    log_text = f"[EXTENSION-LOG] {msg}" + (f" | data: {json.dumps(data, ensure_ascii=False)}" if data is not None else "")
    if level == "error":
        logger.error(log_text)
    elif level == "warn":
        logger.warning(log_text)
    else:
        logger.info(log_text)
    return {"status": "ok"}


@api_v2.post("/extension/parse_and_add")
@legacy_api.post("/extension/parse_and_add")
async def extension_parse_and_add(payload: Dict[str, Any], current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    raw_url = payload.get("url", "")
    html = payload.get("html")
    url = normalize_url(raw_url, html=html) or raw_url
    if "source" in payload:
        scraped = payload
        scraped["url"] = url
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
            status=STATUS_NOT_CONTACTED
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
        await publish_mercure_event(
                event_type=EVENT_VACANCY_CREATED,
                data={
                    "message_code": MSG_VACANCY_CREATED,
                    "vacancy": vacancy_data,
                    "url": url,
                },
                topic=mercure_topic,
            )
        
    # If link requires browser extension to scrape and no HTML was supplied (e.g. context menu on a link),
    # enqueue into scrape pipeline so extension will open tab and extract DOM.
    parser = parser_registry.find(url)
    if not payload.get("html") and parser and parser.needs_extension:
        if not is_new:
            mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
            vacancy_data = VacancyResponse.model_validate(vacancy).model_dump(mode="json")
            await publish_mercure_event(
                event_type=EVENT_VACANCY_UPDATED,
                data={
                    "message_code": MSG_VACANCY_UPDATED,
                    "vacancy": vacancy_data,
                    "url": url,
                },
                topic=mercure_topic,
            )
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
            pipe.sadd(f"linkedin:active:user:{current_user.id}", task_id)
            pipe.expire(f"linkedin:active:user:{current_user.id}", TASK_TTL)
            pipe.lpush(f"{RECENT_LIST}:{current_user.id}", task_id)
            pipe.ltrim(f"{RECENT_LIST}:{current_user.id}", 0, 99)
            pipe.expire(f"{RECENT_LIST}:{current_user.id}", TASK_TTL)
            pipe.lpush(RECENT_LIST, task_id)
            pipe.ltrim(RECENT_LIST, 0, 99)
            await pipe.execute()
            
        total_remaining = await queue_manager._calculate_total_remaining(user_id=current_user.id)
        mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
        vacancy_data = VacancyResponse.model_validate(vacancy).model_dump(mode="json")
        await publish_mercure_event(
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
        await publish_mercure_event(
                event_type=EVENT_QUEUE_UPDATED,
                data={
                    "message_code": MSG_QUEUE_UPDATED,
                    "batch_id": batch_id,
                    "queued_count": 1,
                    "total_remaining": total_remaining,
                },
                topic=mercure_topic,
            )
    
    return {"status": "queued_for_ai", "vacancy_id": vacancy.id, "task_id": task_id}


@api_v2.get("/stats")
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

    today = (datetime.datetime.utcnow() + delta).date()
    cutoff_date = today - datetime.timedelta(days=days - 1)
    cutoff = cutoff_date.isoformat()
    utc_cutoff = datetime.datetime.combine(cutoff_date, datetime.time.min) - delta
    daily: Dict[str, Dict[str, int]] = {}
    def bucket(day: str) -> Dict[str, int]:
        return daily.setdefault(day, {"added": 0, "marked": 0})

    status_counts = dict(db.query(Vacancy.status, func.count(Vacancy.id)).filter(
        Vacancy.user_id == current_user.id).group_by(Vacancy.status).all())
    total = sum(status_counts.values())
    added_day = local_date(Vacancy.created_at, db.bind.dialect.name, tz_offset)
    added_dates = db.query(added_day, func.count()).filter(
        Vacancy.user_id == current_user.id, Vacancy.created_at >= utc_cutoff).group_by(added_day)
    for day, count in added_dates:
        bucket(str(day))["added"] = count
    marked_day = local_date(VacancyStatusHistory.created_at, db.bind.dialect.name, tz_offset)
    marked_dates = db.query(marked_day, func.count()).join(
        Vacancy, Vacancy.id == VacancyStatusHistory.vacancy_id).filter(
        Vacancy.user_id == current_user.id,
        VacancyStatusHistory.from_status.isnot(None),
        VacancyStatusHistory.created_at >= utc_cutoff).group_by(marked_day)
    for day, count in marked_dates:
        bucket(str(day))["marked"] = count

    series = [
        {"date": d, **counts}
        for d, counts in sorted(daily.items())
        if d >= cutoff
    ]

    return {
        "today": today.isoformat(),
        "total": total,
        "by_status": status_counts,
        "daily": series,
    }


# =====================================================================
# CV Anonymization & Vacancy Matching Endpoints
# =====================================================================


@api_v2.post("/cv/anonymize-companies", response_model=AnonymizeCompaniesResponse)
async def anonymize_companies(
    payload: AnonymizeCompaniesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sends ONLY approved company names to the LLM (from backend/llm.py) to retrieve
    generalized industry replacements. Never accepts or sends raw CV text.
    """
    if not payload.companies:
        return AnonymizeCompaniesResponse(replacements=[])

    provider = get_setting_or_env(db, "llm_provider", os.getenv("LLM_PROVIDER", "mistral"), user_id=current_user.id)
    try:
        replacements = await anonymize_companies_with_llm(
            companies=payload.companies,
            provider=provider,
            language=get_setting_or_env(db, "locale", os.getenv("LOCALE", "ru"), user_id=current_user.id),
            db=db,
            user_id=current_user.id,
        )
        return AnonymizeCompaniesResponse(
            replacements=[CompanyReplacementItem(**item) for item in replacements]
        )
    except Exception as e:
        logger.error(f"Company anonymization failed: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"Company anonymization failed: {e}",
        )


@api_v2.get("/cv", response_model=Optional[ApprovedCVResponse])
@api_v2.get("/cv/approved", response_model=Optional[ApprovedCVResponse])
def get_approved_cv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the current user's approved anonymized CV from server persistence."""
    approved_cv = db.query(ApprovedCV).filter(ApprovedCV.user_id == current_user.id).first()
    if not approved_cv:
        return None
    return ApprovedCVResponse.model_validate(approved_cv)


@api_v2.post("/cv/approved", response_model=ApprovedCVResponse)
def save_approved_cv(
    payload: ApprovedCVCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Stores or replaces the user's approved anonymized CV.
    Marks any existing compatibility analyses as outdated since the CV revision changed.
    """
    approved_cv = db.query(ApprovedCV).filter(ApprovedCV.user_id == current_user.id).first()
    now = datetime.datetime.utcnow()

    if approved_cv:
        approved_cv.content = payload.content
        approved_cv.revision = payload.revision
        approved_cv.approved_at = now
        approved_cv.updated_at = now
    else:
        approved_cv = ApprovedCV(
            user_id=current_user.id,
            content=payload.content,
            revision=payload.revision,
            approved_at=now,
            created_at=now,
            updated_at=now,
        )
        db.add(approved_cv)

    # Invalidate previous analyses for this user
    db.query(VacancyCVAnalysis).filter(
        VacancyCVAnalysis.user_id == current_user.id
    ).update({"is_outdated": True})

    db.commit()
    db.refresh(approved_cv)
    return ApprovedCVResponse.model_validate(approved_cv)


@api_v2.delete("/cv/approved", status_code=status.HTTP_204_NO_CONTENT)
def delete_approved_cv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deletes the approved CV and associated analyses for the authenticated user."""
    approved_cv = db.query(ApprovedCV).filter(ApprovedCV.user_id == current_user.id).first()
    if approved_cv:
        db.delete(approved_cv)

    db.query(VacancyCVAnalysis).filter(VacancyCVAnalysis.user_id == current_user.id).delete()
    db.commit()
    return None


@api_v2.get("/vacancies/{vacancy_id}/compatibility", response_model=Optional[VacancyCVAnalysisResponse])
def get_vacancy_compatibility(
    vacancy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the latest compatibility analysis between the vacancy and approved CV."""
    vacancy = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    analysis = db.query(VacancyCVAnalysis).filter(
        VacancyCVAnalysis.vacancy_id == vacancy_id,
        VacancyCVAnalysis.user_id == current_user.id,
    ).first()

    if not analysis:
        return None

    # Check if approved CV revision changed
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
        versions=[AdaptedCVVersionResponse.model_validate(v) for v in versions_list],
        created_at=analysis.created_at,
        updated_at=analysis.updated_at,
    )


@api_v2.post("/vacancies/{vacancy_id}/compatibility", response_model=VacancyCVAnalysisResponse)
async def analyze_vacancy_compatibility(
    vacancy_id: int,
    force: bool = Query(False, description="Force re-analysis even if a cached result exists"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Performs AI-assisted compatibility analysis by sending the vacancy text
    and the approved anonymized CV to the local LLM microservice.
    """
    vacancy = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    if not vacancy.description or not vacancy.description.strip():
        raise HTTPException(
            status_code=400,
            detail="Vacancy has no description. Please provide a description before requesting compatibility analysis.",
        )

    approved_cv = db.query(ApprovedCV).filter(ApprovedCV.user_id == current_user.id).first()
    if not approved_cv or not approved_cv.content.strip():
        raise HTTPException(
            status_code=400,
            detail="No approved CV found. Please upload and approve your CV before requesting compatibility analysis.",
        )

    # Check cache if not forcing re-analysis
    existing = db.query(VacancyCVAnalysis).filter(
        VacancyCVAnalysis.vacancy_id == vacancy_id,
        VacancyCVAnalysis.user_id == current_user.id,
    ).first()

    if existing and not force and not existing.is_outdated and existing.cv_revision == approved_cv.revision:
        res_data = existing.result or {}
        return VacancyCVAnalysisResponse(
            id=existing.id,
            user_id=existing.user_id,
            vacancy_id=existing.vacancy_id,
            cv_revision=existing.cv_revision,
            scoring_policy_version=existing.scoring_policy_version,
            model_id=existing.model_id,
            overall_score=existing.overall_score,
            is_outdated=False,
            summary=res_data.get("summary", ""),
            matched_requirements=res_data.get("matchedRequirements", []),
            missing_requirements=res_data.get("missingRequirements", []),
            critical_gaps=res_data.get("criticalGaps", []),
            seniority_assessment=res_data.get("seniorityAssessment"),
            recommendations=res_data.get("recommendations", []),
            dimension_scores=res_data.get("dimensionScores"),
            created_at=existing.created_at,
            updated_at=existing.updated_at,
        )

    # Compose vacancy text for inference
    vacancy_full_text = f"Title: {vacancy.title}\nCompany: {vacancy.company}\nLocation: {vacancy.location or 'N/A'}\n"
    if vacancy.tech_stack:
        vacancy_full_text += f"Key Tech Stack: {', '.join(vacancy.tech_stack)}\n"
    if vacancy.description:
        vacancy_full_text += f"\nDescription:\n{vacancy.description}\n"

    provider = get_setting_or_env(db, "llm_provider", os.getenv("LLM_PROVIDER", "mistral"), user_id=current_user.id)
    try:
        eval_data = await evaluate_vacancy_compatibility_with_llm(
            vacancy_text=vacancy_full_text,
            cv_text=approved_cv.content,
            provider=provider,
            language=get_setting_or_env(db, "locale", os.getenv("LOCALE", "ru"), user_id=current_user.id),
            db=db,
            user_id=current_user.id,
        )
    except Exception as e:
        logger.error(f"Vacancy compatibility evaluation failed: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"Compatibility evaluation failed: {e}",
        )

    overall_score = float(eval_data.get("overallScore", 0.0))
    policy_version = str(eval_data.get("scoringPolicyVersion", "v1.0"))
    model_id = str(eval_data.get("model", provider))
    now = datetime.datetime.utcnow()

    # Adaptation is currently disabled
    adapted_cv_payload = None

    if existing:
        existing.cv_revision = approved_cv.revision
        existing.scoring_policy_version = policy_version
        existing.model_id = model_id
        existing.overall_score = overall_score
        existing.result = eval_data
        if adapted_cv_payload:
            existing.adapted_cv = adapted_cv_payload
        existing.is_outdated = False
        existing.updated_at = now
        analysis_record = existing
    else:
        analysis_record = VacancyCVAnalysis(
            user_id=current_user.id,
            vacancy_id=vacancy.id,
            cv_revision=approved_cv.revision,
            scoring_policy_version=policy_version,
            model_id=model_id,
            overall_score=overall_score,
            result=eval_data,
            adapted_cv=adapted_cv_payload,
            is_outdated=False,
            created_at=now,
            updated_at=now,
        )
        db.add(analysis_record)
        db.flush()

    # Also record version 1 if adapted_cv_payload was produced
    if adapted_cv_payload:
        v1 = AdaptedCVVersion(
            analysis_id=analysis_record.id,
            version_number=1,
            adapted_cv=adapted_cv_payload,
            user_comment="Initial automatic adaptation",
            parent_version_id=None,
            created_at=now,
        )
        db.add(v1)

    # Also update vacancy.match_score and emit Mercure event so Kanban board reflects manual compatibility check
    vacancy.match_score = overall_score
    db.commit()
    db.refresh(analysis_record)

    mercure_topic = f"vacancies:{current_user.id}" if current_user.id else "vacancies"
    vacancy_data = VacancyResponse.model_validate(vacancy).model_dump(mode="json")
    await publish_mercure_event(
            event_type=EVENT_VACANCY_UPDATED,
            data={"vacancy": vacancy_data, "message_code": MSG_VACANCY_UPDATED},
            topic=mercure_topic,
        )
    await publish_mercure_event(
            event_type=EVENT_COMPATIBILITY_ANALYZED,
            data={
                "message_code": MSG_COMPATIBILITY_ANALYZED,
                "vacancy_id": vacancy.id,
                "match_score": overall_score,
                "overall_score": overall_score,
                "llm_score": eval_data.get("llmScore"),
                "calculated_score": eval_data.get("calculatedScore"),
                "summary": eval_data.get("summary"),
                "matched_requirements": eval_data.get("matchedRequirements", []),
                "missing_requirements": eval_data.get("missingRequirements", []),
                "critical_gaps": eval_data.get("criticalGaps", []),
                "recommendations": eval_data.get("recommendations", []),
                "adapted_cv": analysis_record.adapted_cv,
            },
            topic=mercure_topic,
        )

    return VacancyCVAnalysisResponse(
        id=analysis_record.id,
        user_id=analysis_record.user_id,
        vacancy_id=analysis_record.vacancy_id,
        cv_revision=analysis_record.cv_revision,
        scoring_policy_version=analysis_record.scoring_policy_version,
        model_id=analysis_record.model_id,
        overall_score=analysis_record.overall_score,
        llm_score=eval_data.get("llmScore"),
        calculated_score=eval_data.get("calculatedScore"),
        is_outdated=False,
        summary=eval_data.get("summary", ""),
        matched_requirements=eval_data.get("matchedRequirements", []),
        missing_requirements=eval_data.get("missingRequirements", []),
        critical_gaps=eval_data.get("criticalGaps", []),
        seniority_assessment=eval_data.get("seniorityAssessment"),
        recommendations=eval_data.get("recommendations", []),
        dimension_scores=eval_data.get("dimensionScores"),
        adapted_cv=analysis_record.adapted_cv,
        versions=[AdaptedCVVersionResponse.model_validate(v) for v in analysis_record.versions],
        created_at=analysis_record.created_at,
        updated_at=analysis_record.updated_at,
    )


@api_v2.post("/vacancies/{vacancy_id}/adapt-cv", response_model=VacancyCVAnalysisResponse)
async def adapt_cv_for_vacancy(
    vacancy_id: int,
    payload: Optional[AdaptCVRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Triggers adaptation or re-adaptation of the candidate's CV for this specific vacancy.
    Currently disabled.
    """
    # Currently disabled
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="CV adaptation feature is temporarily disabled.",
    )

    vacancy = db.query(Vacancy).filter(Vacancy.id == vacancy_id, Vacancy.user_id == current_user.id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    if not vacancy.description or not vacancy.description.strip():
        raise HTTPException(
            status_code=400,
            detail="Vacancy has no description. Please provide a description before requesting compatibility analysis.",
        )

    approved_cv = db.query(ApprovedCV).filter(ApprovedCV.user_id == current_user.id).first()
    if not approved_cv or not approved_cv.content.strip():
        raise HTTPException(
            status_code=400,
            detail="No saved CV found. Please upload your CV first.",
        )

    # Prepare vacancy text
    vacancy_full_text = f"Title: {vacancy.title}\nCompany: {vacancy.company}\nLocation: {vacancy.location or 'N/A'}\n"
    if vacancy.tech_stack:
        vacancy_full_text += f"Key Tech Stack: {', '.join(vacancy.tech_stack)}\n"
    if vacancy.description:
        vacancy_full_text += f"\nDescription:\n{vacancy.description}\n"

    existing_analysis = db.query(VacancyCVAnalysis).filter(
        VacancyCVAnalysis.vacancy_id == vacancy_id,
        VacancyCVAnalysis.user_id == current_user.id,
    ).first()

    # Determine previous version/adapted_cv for iteration context if parent_version_id is provided or from existing
    parent_adapted_cv = None
    parent_version_id = payload.parent_version_id if payload else None
    user_comment = payload.user_comment if payload else None

    if existing_analysis:
        if parent_version_id:
            parent_ver = db.query(AdaptedCVVersion).filter(
                AdaptedCVVersion.id == parent_version_id,
                AdaptedCVVersion.analysis_id == existing_analysis.id,
            ).first()
            if parent_ver:
                parent_adapted_cv = parent_ver.adapted_cv
        elif existing_analysis.adapted_cv:
            parent_adapted_cv = existing_analysis.adapted_cv

    provider = get_setting_or_env(db, "llm_provider", os.getenv("LLM_PROVIDER", "mistral"), user_id=current_user.id)
    mistral_key = get_setting_or_env(db, "mistral_api_key", "MISTRAL_API_KEY", user_id=current_user.id)
    gemini_key = get_setting_or_env(db, "gemini_api_key", "GEMINI_API_KEY", user_id=current_user.id)

    try:
        adapted_cv_payload = await adapt_cv_for_vacancy_with_llm(
            anonymized_cv_text=approved_cv.content,
            vacancy_text=vacancy_full_text,
            user_comment=user_comment,
            previous_adapted_cv=parent_adapted_cv,
            mistral_key=mistral_key,
            gemini_key=gemini_key,
            active_provider=provider,
            db=db,
            user_id=current_user.id,
        )
    except Exception as e:
        logger.error(f"Manual CV adaptation failed for vacancy #{vacancy.id}: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"CV adaptation failed: {e}",
        )

    now = datetime.datetime.utcnow()
    if existing_analysis:
        existing_analysis.adapted_cv = adapted_cv_payload
        existing_analysis.updated_at = now
        analysis_record = existing_analysis
    else:
        analysis_record = VacancyCVAnalysis(
            user_id=current_user.id,
            vacancy_id=vacancy.id,
            cv_revision=approved_cv.revision,
            scoring_policy_version="v1.0",
            model_id=provider,
            overall_score=vacancy.match_score if vacancy.match_score is not None else 0.0,
            result={
                "summary": "Manual CV adaptation generated.",
                "overallScore": vacancy.match_score if vacancy.match_score is not None else 0.0,
            },
            adapted_cv=adapted_cv_payload,
            is_outdated=False,
            created_at=now,
            updated_at=now,
        )
        db.add(analysis_record)
        db.flush()

    # Determine next version number
    current_max_ver = db.query(func.coalesce(func.max(AdaptedCVVersion.version_number), 0)).filter(
        AdaptedCVVersion.analysis_id == analysis_record.id
    ).scalar()
    next_ver_num = current_max_ver + 1

    new_version = AdaptedCVVersion(
        analysis_id=analysis_record.id,
        version_number=next_ver_num,
        adapted_cv=adapted_cv_payload,
        user_comment=user_comment,
        parent_version_id=parent_version_id,
        created_at=now,
    )
    db.add(new_version)

    db.commit()
    db.refresh(analysis_record)

    res_data = analysis_record.result or {}
    versions_list = db.query(AdaptedCVVersion).filter(
        AdaptedCVVersion.analysis_id == analysis_record.id
    ).order_by(AdaptedCVVersion.version_number.desc()).all()

    return VacancyCVAnalysisResponse(
        id=analysis_record.id,
        user_id=analysis_record.user_id,
        vacancy_id=analysis_record.vacancy_id,
        cv_revision=analysis_record.cv_revision,
        scoring_policy_version=analysis_record.scoring_policy_version,
        model_id=analysis_record.model_id,
        overall_score=analysis_record.overall_score,
        llm_score=res_data.get("llmScore"),
        calculated_score=res_data.get("calculatedScore"),
        is_outdated=analysis_record.is_outdated,
        summary=res_data.get("summary", ""),
        matched_requirements=res_data.get("matchedRequirements", []),
        missing_requirements=res_data.get("missingRequirements", []),
        critical_gaps=res_data.get("criticalGaps", []),
        seniority_assessment=res_data.get("seniorityAssessment"),
        recommendations=res_data.get("recommendations", []),
        dimension_scores=res_data.get("dimensionScores"),
        adapted_cv=analysis_record.adapted_cv,
        versions=[AdaptedCVVersionResponse.model_validate(v) for v in versions_list],
        created_at=analysis_record.created_at,
        updated_at=analysis_record.updated_at,
    )




# Include Unified API v2 and Legacy API routers
app.include_router(api_v2)
app.include_router(legacy_api)

# Static files mount for built React frontend
STATIC_DIR = os.getenv("STATIC_DIR", os.path.join(os.path.dirname(__file__), "../frontend/dist"))
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        # Don't hijack API routes and OpenAPI docs routes
        if full_path.startswith("api") or full_path in ("docs", "redoc", "openapi.json"):
            raise HTTPException(status_code=404, detail="Not found")
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
