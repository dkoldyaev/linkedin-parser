import os
import time
import logging
from urllib.parse import urlencode
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
import httpx
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.orm import Session

from .database import get_db
from .models import User, Vacancy

logger = logging.getLogger("linkedin_tracker.auth")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "")
JWT_SECRET = os.getenv("JWT_SECRET", os.getenv("MERCURE_JWT_SECRET", "linkedin-tracker-jwt-secret-key-32chars!"))
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
    token = None

    # Check HttpOnly cookie first
    if COOKIE_NAME in request.cookies:
        token = request.cookies[COOKIE_NAME]

    # Check Authorization: Bearer <token> header fallback
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
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

    return user


def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    token = None
    if COOKIE_NAME in request.cookies:
        token = request.cookies[COOKIE_NAME]
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None

    try:
        user_id_int = int(payload.get("sub"))
        return db.query(User).filter(User.id == user_id_int).first()
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
            logger.error(f"Google token exchange failed: {res.status_code} {res.text}")
            raise HTTPException(status_code=400, detail=f"Google token exchange failed: {res.text}")
        return res.json()


async def get_google_user_info(access_token: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(GOOGLE_USERINFO_ENDPOINT, headers=headers)
        if res.status_code != 200:
            logger.error(f"Google userinfo request failed: {res.status_code} {res.text}")
            raise HTTPException(status_code=400, detail=f"Failed to fetch Google user profile: {res.text}")
        return res.json()


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
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Check if any orphan vacancies exist without user_id; attach them to this first user
            orphans = db.query(Vacancy).filter(Vacancy.user_id.is_(None)).all()
            if orphans:
                for v in orphans:
                    v.user_id = user.id
                db.commit()
                logger.info(f"Associated {len(orphans)} legacy orphan vacancies with user {user.id} ({user.email})")
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

    return user


def get_or_create_dev_user(db: Session, email: str = "dev@local.user", name: str = "Dev User") -> User:
    return get_or_create_user(
        db=db,
        google_id=f"dev_{email}",
        email=email,
        name=name,
        picture="https://api.dicebear.com/7.x/bottts/svg?seed=dev",
    )
