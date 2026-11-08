import os
import logging
from typing import Optional

logger = logging.getLogger("linkedin_tracker.sentry")

def get_sentry_dsn() -> Optional[str]:
    """Retrieve Sentry DSN / URL from environment variables."""
    # Supports SENTRY_DSN or SENTRY_URL
    return os.getenv("SENTRY_DSN") or os.getenv("SENTRY_URL") or None


def init_sentry() -> bool:
    """Initialize Sentry SDK if DSN/URL is configured in environment."""
    dsn = get_sentry_dsn()
    if not dsn:
        return False

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.redis import RedisIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

        environment = os.getenv("ENVIRONMENT") or ("development" if os.getenv("DEV_AUTH", "false").lower() in ("1", "true") else "production")
        traces_sample_rate = float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1"))

        sentry_sdk.init(
            dsn=dsn,
            environment=environment,
            traces_sample_rate=traces_sample_rate,
            integrations=[
                FastApiIntegration(),
                RedisIntegration(),
                SqlalchemyIntegration(),
            ],
            send_default_pii=False,
        )
        logger.info("Sentry initialized successfully")
        return True
    except Exception as e:
        logger.warning(f"Failed to initialize Sentry: {e}")
        return False

