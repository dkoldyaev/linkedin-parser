import os
import json
import logging
import time
from typing import Any, Dict, Optional
import httpx
import jwt

logger = logging.getLogger("linkedin_tracker.mercure")

from .security_config import require_secret
DEFAULT_TOPIC = "vacancies"

# Mercure Event Types
EVENT_VACANCY_CREATED = "vacancy_created"
EVENT_VACANCY_UPDATED = "vacancy_updated"
EVENT_VACANCY_DELETED = "vacancy_deleted"
EVENT_TASK_FAILED = "task_failed"
EVENT_QUEUE_UPDATED = "queue_updated"
EVENT_QUEUE_IDLE = "queue_idle"
EVENT_EXTENSION_TASK = "extension_task"
EVENT_COMPATIBILITY_ANALYZED = "compatibility_analyzed"

# Mercure Message Codes
MSG_VACANCY_CREATED = "VACANCY_CREATED"
MSG_VACANCY_UPDATED = "VACANCY_UPDATED"
MSG_VACANCY_DELETED = "VACANCY_DELETED"
MSG_TASK_FAILED = "TASK_FAILED"
MSG_QUEUE_UPDATED = "QUEUE_UPDATED"
MSG_QUEUE_IDLE = "QUEUE_IDLE"
MSG_EXTENSION_TASK = "EXTENSION_TASK"
MSG_COMPATIBILITY_ANALYZED = "COMPATIBILITY_ANALYZED"

# Mercure Error Codes (strictly constant codes, no human text)
ERR_SCRAPE_FAILED = "ERR_SCRAPE_FAILED"
ERR_AI_ANALYSIS_FAILED = "ERR_AI_ANALYSIS_FAILED"
ERR_VACANCY_NOT_FOUND = "ERR_VACANCY_NOT_FOUND"
ERR_NETWORK = "ERR_NETWORK"
ERR_UNKNOWN = "ERR_UNKNOWN"


def get_mercure_secret() -> str:
    return require_secret("MERCURE_JWT_SECRET")


def get_mercure_publish_url() -> str:
    return os.getenv("MERCURE_URL", "http://localhost:3000/.well-known/mercure")


def get_mercure_public_url() -> str:
    return os.getenv("MERCURE_PUBLIC_URL", "/.well-known/mercure")


def generate_publisher_jwt(secret: Optional[str] = None) -> str:
    """Generate a JWT token allowing publishing to any Mercure topic."""
    secret_key = secret or get_mercure_secret()
    payload = {
        "exp": int(time.time()) + 300,
        "mercure": {
            "publish": ["*"]
        }
    }
    return jwt.encode(payload, secret_key, algorithm="HS256")


MERCURE_COOKIE = "mercureAuthorization"  # Hub v0.16 (Mercure 0.x protocol)
SUBSCRIBER_TTL = 3600


def generate_subscriber_jwt(user_id: int) -> str:
    return jwt.encode({"sub": str(user_id), "exp": int(time.time()) + SUBSCRIBER_TTL,
                       "mercure": {"subscribe": [f"vacancies:{user_id}"]}},
                      get_mercure_secret(), algorithm="HS256")


def set_subscriber_cookie(response, user_id: int):
    response.set_cookie(MERCURE_COOKIE, generate_subscriber_jwt(user_id),
                        max_age=SUBSCRIBER_TTL, httponly=True,
                        secure=os.getenv("APP_URL", "").startswith("https://"),
                        samesite="lax", path="/.well-known/mercure")


async def publish_mercure_event(
    event_type: str,
    data: Dict[str, Any],
    topic: str = DEFAULT_TOPIC,
    mercure_url: Optional[str] = None,
    secret: Optional[str] = None,
) -> bool:
    """
    Publish an event to Mercure Hub.
    Returns True if published successfully, False otherwise.
    Never raises an exception so background workers are not interrupted.
    """
    url = mercure_url or get_mercure_publish_url()

    payload = {
        "type": event_type,
        **data
    }

    try:
        token = generate_publisher_jwt(secret)
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.post(
                url,
                data={
                    "topic": topic,
                    "private": "on",
                    "data": json.dumps(payload, ensure_ascii=False),
                },
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/x-www-form-urlencoded",
                }
            )

            if resp.status_code in (200, 201, 202):
                logger.info(f"Published Mercure event '{event_type}' to topic '{topic}' (HTTP {resp.status_code})")
                return True
            else:
                logger.warning(
                    f"Mercure publish failed status={resp.status_code} topic={topic} event={event_type}"
                )
                return False

    except (httpx.ConnectError, httpx.TimeoutException) as e:
        logger.warning(f"Mercure Hub not reachable at {url}: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error publishing to Mercure Hub: {e}", exc_info=True)
        return False
