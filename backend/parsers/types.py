"""
Shared types for the parser subsystem.

``VacancyData`` is the canonical return type of every ``BaseParser.parse()``
call.  Use it as the return annotation in your custom parser so that type
checkers (mypy / pyright) can verify your implementation at development time.
"""

from typing import Optional
from typing_extensions import TypedDict, Required


class VacancyData(TypedDict, total=False):
    """
    Structured result returned by every parser.

    Required fields (must always be present):
        url     — canonical page URL
        source  — human-readable site name set by the parser class (e.g. "LinkedIn")

    All other fields are Optional: a parser may return None for any of them
    (e.g. when the page is blocked or the field simply isn't available on
    that site).
    """

    # ---- Always required ------------------------------------------------
    url: Required[str]
    """Canonical URL of the vacancy page."""

    source: Required[str]
    """
    Human-readable name of the job board / site.
    Must be a fixed constant defined in the parser class, not computed at runtime.
    Example: ``source = "LinkedIn"``, ``source = "Upwork"``, ``source = "hh.ru"``.

    Exception: the UniversalParser derives this from the URL domain because it
    handles arbitrary sites.
    """

    # ---- Everything below is optional -----------------------------------
    # A parser may return None for any field it cannot extract.

    title: Optional[str]
    """Job title extracted from the page."""

    company: Optional[str]
    """Company name."""

    description: Optional[str]
    """Full vacancy text / job description (plain text, max ~15 000 chars)."""

    is_closed: Optional[bool]
    """True when the vacancy is no longer accepting applications."""

    # ---- Identifiers ----------------------------------------------------
    job_id: Optional[str]
    """Site-specific job ID (numeric string or slug)."""

    # ---- Company details ------------------------------------------------
    company_url: Optional[str]
    """Absolute URL of the company page on the same site."""

    company_info: Optional[str]
    """'About the company' blurb extracted from the page (may be empty)."""

    # ---- Location -------------------------------------------------------
    location: Optional[str]
    """Raw location string as it appears on the page (e.g. 'Berlin, Germany (Hybrid)')."""

    city: Optional[str]
    """Parsed city name."""

    country: Optional[str]
    """Parsed country name."""

    # ---- Work format ----------------------------------------------------
    workplace_type: Optional[str]
    """
    Normalised workplace format.
    One of: 'remote', 'hybrid', 'on-site', or None.
    """

    # ---- Salary ---------------------------------------------------------
    salary_min: Optional[float]
    """Lower bound of the salary range (numeric, same currency as salary_currency)."""

    salary_max: Optional[float]
    """Upper bound of the salary range."""

    salary_currency: Optional[str]
    """ISO 4217 currency code or symbol, e.g. 'USD', '$', 'EUR'."""

    salary_period: Optional[str]
    """
    Pay period.
    One of: 'hour', 'day', 'week', 'month', 'year'.
    """
