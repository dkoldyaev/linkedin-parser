"""Shared fail-closed configuration for signing keys."""
import os


def require_secret(name: str) -> str:
    value = os.getenv(name, "").strip()
    if len(value.encode()) < 32 or "changethis" in value.lower():
        raise RuntimeError(f"{name} must be set to an independent random secret of at least 32 bytes")
    if name == "JWT_SECRET" and value == os.getenv("MERCURE_JWT_SECRET"):
        raise RuntimeError("JWT_SECRET and MERCURE_JWT_SECRET must be independent")
    return value
