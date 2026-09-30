"""
scraper.py — backward-compatible shim.

All parsing logic has been moved to backend/parsers/.
This module re-exports the public API so that existing imports keep working
without any changes.

    from .scraper import scrape_linkedin_job, scrape_upwork_job,
                         scrape_universal_job, extract_job_id
"""

import re
from typing import Any, Dict, Optional

from .parsers import registry
from .parsers.linkedin import (
    _extract_is_closed as extract_is_closed_from_soup,
    _extract_salary as extract_salary_from_soup,
    _extract_workplace as extract_workplace_type_from_soup,
    _normalize_workplace as normalize_workplace_type,
)

# ---------------------------------------------------------------------------
# Public helpers (kept here for backward compatibility)
# ---------------------------------------------------------------------------


def extract_job_id(url: str) -> Optional[str]:
    """Extract a numeric, alphanumeric, or Upwork-style job ID from any supported URL."""
    if not url:
        return None

    # Try registry first (handles all specialized parsers: Habr, Avito, SuperJob, GeekJob, FL, etc.)
    jid = registry.extract_job_id(url)
    if jid:
        return jid

    # LinkedIn patterns fallback
    for pattern in [
        r"currentJobId=(\d+)",
        r"/jobs/view/(?:[a-zA-Z0-9\-_]+?-)?(\d+)",
        r"jobPosting:(\d+)",
        r"/(\d{9,12})(?:[/?&#]|$)",
    ]:
        m = re.search(pattern, url)
        if m:
            return m.group(1)

    # Upwork pattern fallback
    m = re.search(r"(~[a-zA-Z0-9]+)", url)
    if m:
        return m.group(1)

    return None


# ---------------------------------------------------------------------------
# Per-site convenience wrappers
# ---------------------------------------------------------------------------


async def scrape_linkedin_job(url: str, html: Optional[str] = None) -> Dict[str, Any]:
    """Fetch and parse a LinkedIn job posting."""
    from .parsers.linkedin import LinkedInParser  # noqa: PLC0415

    return await LinkedInParser().parse(url, html=html)


async def scrape_upwork_job(url: str, html: Optional[str] = None) -> Dict[str, Any]:
    """Return a skeletal Upwork vacancy record (real data comes via extension)."""
    from .parsers.upwork import UpworkParser  # noqa: PLC0415

    return await UpworkParser().parse(url, html=html)


async def scrape_universal_job(url: str, html: Optional[str] = None) -> Dict[str, Any]:
    """Fetch any page and dump its text for LLM extraction."""
    from .parsers.universal import UniversalParser  # noqa: PLC0415

    return await UniversalParser().parse(url, html=html)


# ---------------------------------------------------------------------------
# Generic dispatcher — preferred for new code
# ---------------------------------------------------------------------------


async def scrape_job(url: str, html: Optional[str] = None) -> Dict[str, Any]:
    """
    Dispatch to the best available parser for *url*.

    Prefer this over the per-site helpers in new code.
    """
    return await registry.parse(url, html=html)
