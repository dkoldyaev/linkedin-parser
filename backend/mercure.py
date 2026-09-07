import os
import json
import logging
from typing import Any, Dict, Optional
import httpx
import jwt

logger = logging.getLogger("linkedin_tracker.mercure")

DEFAULT_MERCURE_SECRET = "!ChangeThisMercureHubJWTSecretKey!"
DEFAULT_TOPIC = "vacancies"


def get_mercure_secret() -> str:
    return os.getenv("MERCURE_JWT_SECRET", DEFAULT_MERCURE_SECRET)


def get_mercure_publish_url() -> str:
    return os.getenv("MERCURE_URL", "http://localhost:3000/.well-known/mercure")


def get_mercure_public_url() -> str:
    return os.getenv("MERCURE_PUBLIC_URL", "http://localhost:3000/.well-known/mercure")


def generate_publisher_jwt(secret: Optional[str] = None) -> str:
    """Generate a JWT token allowing publishing to any Mercure topic."""
    secret_key = secret or get_mercure_secret()
    payload = {
        "mercure": {
            "publish": ["*"]
        }
    }
    return jwt.encode(payload, secret_key, algorithm="HS256")


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
    token = generate_publisher_jwt(secret)

    payload = {
        "type": event_type,
        **data
    }

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.post(
                url,
                data={
                    "topic": topic,
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
                    f"Mercure Hub returned status {resp.status_code} for topic '{topic}': {resp.text}"
                )
                return False

    except (httpx.ConnectError, httpx.TimeoutException) as e:
        logger.warning(f"Mercure Hub not reachable at {url}: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error publishing to Mercure Hub: {e}", exc_info=True)
        return False
