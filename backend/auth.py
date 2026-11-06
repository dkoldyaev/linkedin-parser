import os
import time
import uuid
import hashlib
import logging
from urllib.parse import urlencode
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
import httpx
from fastapi import Request, HTTPException, status, Depends, Security
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session

from .database import get_db
from .models import (
    User, Vacancy, ApiKey, UserFeatureFlag, UserSetting, ApprovedCV, VacancyCVAnalysis, KNOWN_FEATURE_FLAGS
)

api_key_header_scheme = APIKeyHeader(name="X-API-Key", auto_error=False, description="Personal API Key")

logger = logging.getLogger("linkedin_tracker.auth")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "")
from .security_config import require_secret
JWT_SECRET = require_secret("JWT_SECRET")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
COOKIE_NAME = "access_token"

GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo"


def get_google_client_id() -> str:
    return os.getenv("GOOGLE_CLIENT_ID", "").strip()


def get_google_client_secret() -> str:
    return os.getenv("GOOGLE_CLIENT_SECRET", "").strip()


def get_google_redirect_uri() -> str:
    return os.getenv("GOOGLE_REDIRECT_URI", "").strip()


def is_google_configured() -> bool:
    return bool(get_google_client_id() and get_google_client_secret())


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta if expires_delta else timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception as e:
        logger.debug(f"JWT decode error: {e}")
        return None


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    # 1. Check X-API-Key header or Authorization: Bearer ak_...
    api_key_header = request.headers.get("X-API-Key") or request.headers.get("x-api-key")
    auth_header = request.headers.get("Authorization")
    
    candidate_api_key = None
    if api_key_header:
        candidate_api_key = api_key_header.strip()
    elif auth_header and auth_header.startswith("Bearer "):
        bearer_val = auth_header[7:].strip()
        if bearer_val.startswith("ak_"):
            candidate_api_key = bearer_val

    if candidate_api_key:
        key_hash = hashlib.sha256(candidate_api_key.encode()).hexdigest()
        api_key_record = db.query(ApiKey).filter(ApiKey.key_hash == key_hash).first()
        if not api_key_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key",
                headers={"WWW-Authenticate": "ApiKey"},
            )
        # Update last_used_at
        api_key_record.last_used_at = datetime.utcnow()
        try:
            db.commit()
        except Exception:
            db.rollback()
        return api_key_record.user

    # 2. Check HttpOnly cookie or JWT Authorization header
    token = None
    if COOKIE_NAME in request.cookies:
        token = request.cookies[COOKIE_NAME]

    if not token and auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = db.query(User).filter(User.id == user_id_int).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Sync feature flags from user_feature_flags relation
    db_flags = [f.flag for f in db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id == user.id).all()]
    if not db_flags and user.feature_flags and isinstance(user.feature_flags, list):
        # Migrate legacy JSON flags to table if any
        for flag_name in user.feature_flags:
            if flag_name in KNOWN_FEATURE_FLAGS:
                db.add(UserFeatureFlag(user_id=user.id, flag=flag_name))
        db.commit()
        db_flags = [f.flag for f in db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id == user.id).all()]
    user.feature_flags = db_flags

    return user


def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    user_flags = current_user.feature_flags or []
    if "admin" not in user_flags:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required (missing feature flag admin)",
        )
    return current_user


def get_current_user_from_api_key(
    request: Request,
    api_key_param: Optional[str] = Security(api_key_header_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Strictly authenticate via personal API key only (X-API-Key or Authorization: Bearer ak_...)."""
    api_key_header = request.headers.get("X-API-Key") or request.headers.get("x-api-key") or api_key_param
    auth_header = request.headers.get("Authorization")
    
    candidate_api_key = None
    if api_key_header:
        candidate_api_key = api_key_header.strip()
    elif auth_header and auth_header.startswith("Bearer "):
        bearer_val = auth_header[7:].strip()
        if bearer_val.startswith("ak_"):
            candidate_api_key = bearer_val

    if not candidate_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required in X-API-Key header or Authorization: Bearer ak_...",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    key_hash = hashlib.sha256(candidate_api_key.encode()).hexdigest()
    api_key_record = db.query(ApiKey).filter(ApiKey.key_hash == key_hash).first()
    if not api_key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    user = api_key_record.user
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Sync user's feature flags
    user_flags = [f.flag for f in db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id == user.id).all()]
    user.feature_flags = user_flags

    # Check api_access requirement
    if "api_access" not in user_flags and "admin" not in user_flags:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API access is disabled for this user (missing feature flag api_access)",
        )

    api_key_record.last_used_at = datetime.utcnow()
    try:
        db.commit()
    except Exception:
        db.rollback()
    return user


def get_current_user_with_api_access(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """
    Authenticate user via session cookie or Personal API Key,
    and verify they have either the 'api_access' or 'admin' feature flag.
    Used for accessing API documentation and endpoints.
    """
    # 1. Try API Key first
    api_key_header = request.headers.get("X-API-Key") or request.headers.get("x-api-key")
    auth_header = request.headers.get("Authorization")
    candidate_api_key = None
    if api_key_header:
        candidate_api_key = api_key_header.strip()
    elif auth_header and auth_header.startswith("Bearer "):
        bearer_val = auth_header[7:].strip()
        if bearer_val.startswith("ak_"):
            candidate_api_key = bearer_val

    if candidate_api_key:
        return get_current_user_from_api_key(request, db=db)

    # 2. Try user session cookie or standard Bearer JWT token
    token = None
    if COOKIE_NAME in request.cookies:
        token = request.cookies[COOKIE_NAME]
    if not token and auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required (API key or session cookie)",
            headers={"WWW-Authenticate": "ApiKey, Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id_int = int(payload.get("sub"))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = db.query(User).filter(User.id == user_id_int).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    user_flags = [f.flag for f in db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id == user.id).all()]
    user.feature_flags = user_flags

    if "api_access" not in user_flags and "admin" not in user_flags:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API access is disabled for this user (missing feature flag api_access)",
        )

    return user


def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    try:
        api_key_header = request.headers.get("X-API-Key") or request.headers.get("x-api-key")
        auth_header = request.headers.get("Authorization")
        
        candidate_api_key = None
        if api_key_header:
            candidate_api_key = api_key_header.strip()
        elif auth_header and auth_header.startswith("Bearer "):
            bearer_val = auth_header[7:].strip()
            if bearer_val.startswith("ak_"):
                candidate_api_key = bearer_val

        if candidate_api_key:
            key_hash = hashlib.sha256(candidate_api_key.encode()).hexdigest()
            api_key_record = db.query(ApiKey).filter(ApiKey.key_hash == key_hash).first()
            if api_key_record:
                api_key_record.last_used_at = datetime.utcnow()
                try:
                    db.commit()
                except Exception:
                    db.rollback()
                return api_key_record.user

        token = None
        if COOKIE_NAME in request.cookies:
            token = request.cookies[COOKIE_NAME]
        if not token and auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
        if not token:
            return None

        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            return None

        user_id_int = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id_int).first()
        if user:
            user.feature_flags = [f.flag for f in db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id == user.id).all()]
        return user
    except Exception:
        return None


def get_google_auth_url(redirect_uri: str, state: str) -> str:
    params = {
        "client_id": get_google_client_id(),
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
        "state": state,
    }
    return f"{GOOGLE_AUTH_ENDPOINT}?{urlencode(params)}"


async def exchange_google_code(code: str, redirect_uri: str) -> dict:
    data = {
        "code": code,
        "client_id": get_google_client_id(),
        "client_secret": get_google_client_secret(),
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(GOOGLE_TOKEN_ENDPOINT, data=data)
        if res.status_code != 200:
            logger.warning("Google token exchange failed status=%s", res.status_code)
            raise HTTPException(status_code=400, detail="Google token exchange failed")
        return res.json()


async def get_google_user_info(access_token: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(GOOGLE_USERINFO_ENDPOINT, headers=headers)
        if res.status_code != 200:
            logger.warning("Google userinfo request failed status=%s", res.status_code)
            raise HTTPException(status_code=400, detail="Failed to fetch Google user profile")
        return res.json()


def is_admin_email(email: str) -> bool:
    email_clean = email.strip().lower()
    admin_emails_env = os.getenv("ADMIN_EMAILS", "")
    if not admin_emails_env:
        return False
    admin_list = [e.strip().lower() for e in admin_emails_env.split(",") if e.strip()]
    return email_clean in admin_list


def get_or_create_user(
    db: Session,
    google_id: str,
    email: str,
    name: str = "",
    picture: Optional[str] = None
) -> User:
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        # Check by email in case of collision
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.google_id = google_id
            if name:
                user.name = name
            if picture:
                user.picture = picture
        else:
            user = User(
                google_id=google_id,
                email=email,
                name=name or email.split("@")[0],
                picture=picture,
                feature_flags=[],
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Auto-grant admin feature flags for admin email
            if is_admin_email(email):
                for flag_name in KNOWN_FEATURE_FLAGS:
                    db.add(UserFeatureFlag(user_id=user.id, flag=flag_name))
                db.commit()

            # Legacy unowned data must be migrated explicitly by an administrator.
            # Never expose it to the next person who registers.

    else:
        # Update user profile info if changed
        changed = False
        if name and user.name != name:
            user.name = name
            changed = True
        if picture and user.picture != picture:
            user.picture = picture
            changed = True
        if changed:
            db.commit()
            db.refresh(user)

    if is_admin_email(email):
        existing_flags = {f.flag for f in db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id == user.id).all()}
        added = False
        for flag_name in KNOWN_FEATURE_FLAGS:
            if flag_name not in existing_flags:
                db.add(UserFeatureFlag(user_id=user.id, flag=flag_name))
                added = True
        if added:
            db.commit()
            db.refresh(user)

    user.feature_flags = [f.flag for f in db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id == user.id).all()]
    return user


def get_or_create_dev_user(db: Session, email: str = "dev@local.user", name: str = "Dev User") -> User:
    return get_or_create_user(
        db=db,
        google_id=f"dev_{email}",
        email=email,
        name=name,
        picture="https://api.dicebear.com/7.x/bottts/svg?seed=dev",
    )


def create_anonymous_user(db: Session) -> User:
    """Create a new anonymous guest user with an isolated workspace."""
    anon_id = uuid.uuid4().hex[:12]
    user = User(
        google_id=f"anon_{uuid.uuid4().hex}",
        email=f"guest_{anon_id}@guest.local",
        name="Гость",
        picture="https://api.dicebear.com/7.x/bottts/svg?seed=guest_" + anon_id,
        is_anonymous=True,
        feature_flags=[],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    user.feature_flags = []
    return user


def migrate_anonymous_user_data(db: Session, anon_user_id: int, target_user: User):
    """
    Migrate vacancies, settings, and CV data from an anonymous guest user to a permanent user.
    Called when a guest logs in via Google or dev login.
    """
    if not anon_user_id or anon_user_id == target_user.id:
        return

    anon_user = db.query(User).filter(User.id == anon_user_id, User.is_anonymous.is_(True)).first()
    if not anon_user:
        return

    logger.info(f"Migrating anonymous user {anon_user.id} ({anon_user.email}) data to user {target_user.id} ({target_user.email})")

    # 1. Vacancies
    db.query(Vacancy).filter(Vacancy.user_id == anon_user.id).update(
        {Vacancy.user_id: target_user.id}, synchronize_session=False
    )

    # 2. ApprovedCV (if target user has no CV, transfer it)
    anon_cv = db.query(ApprovedCV).filter(ApprovedCV.user_id == anon_user.id).first()
    if anon_cv:
        target_cv = db.query(ApprovedCV).filter(ApprovedCV.user_id == target_user.id).first()
        if not target_cv:
            anon_cv.user_id = target_user.id
        else:
            db.delete(anon_cv)

    # 3. VacancyCVAnalysis (migrate analyses for non-conflicting vacancy_id)
    anon_analyses = db.query(VacancyCVAnalysis).filter(VacancyCVAnalysis.user_id == anon_user.id).all()
    for analysis in anon_analyses:
        existing = db.query(VacancyCVAnalysis).filter(
            VacancyCVAnalysis.user_id == target_user.id,
            VacancyCVAnalysis.vacancy_id == analysis.vacancy_id
        ).first()
        if not existing:
            analysis.user_id = target_user.id
        else:
            db.delete(analysis)

    # 4. Settings
    anon_settings = db.query(UserSetting).filter(UserSetting.user_id == anon_user.id).all()
    for setting in anon_settings:
        existing = db.query(UserSetting).filter(
            UserSetting.user_id == target_user.id,
            UserSetting.key == setting.key
        ).first()
        if not existing:
            setting.user_id = target_user.id
        else:
            db.delete(setting)

    # 5. Delete or cleanup the temporary anonymous user record
    try:
        db.delete(anon_user)
        db.commit()
        logger.info(f"Successfully migrated data from guest {anon_user_id} to user {target_user.id}")
    except Exception as e:
        logger.error(f"Error finalizing anonymous user migration: {e}")
        db.rollback()

