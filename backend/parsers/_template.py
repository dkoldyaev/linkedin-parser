"""
Template for a custom job vacancy parser.

HOW TO ADD A NEW PARSER
========================
1. Copy this file to backend/parsers/mysite.py
2. Fill in the class attributes and the two methods below.
3. Restart the server — the parser is discovered automatically.

That's it. No other files need to be changed.
"""

from typing import Optional

import httpx
from bs4 import BeautifulSoup

from .registry import BaseParser, registry
from .types import VacancyData

# Uncomment if you need location parsing:
# from ..location_parser import parse_location


@registry.register
class ExampleSiteParser(BaseParser):
    """Parser for example-site.com — replace with your site."""

    # Internal identifier used in logs
    name = "example-site"

    # Human-readable label written to VacancyData.source.
    # Must be a fixed constant — do NOT derive it from the URL at runtime.
    source = "Example Site"

    # Priority: higher values are tried before lower values.
    #   10  — high (LinkedIn / Upwork level)
    #    0  — normal (default)
    #  -10  — lowest (universal fallback)
    priority = 0

    # Set to True when your site requires JavaScript rendering and the
    # page HTML must be supplied by the browser extension.
    needs_extension = False

    # ------------------------------------------------------------------ #
    # 1. URL matching                                                       #
    # ------------------------------------------------------------------ #

    def matches(self, url: str) -> bool:
        """Return True when this parser should handle *url*."""
        return "example-site.com" in url.lower()

    # ------------------------------------------------------------------ #
    # 2. Parsing                                                            #
    # ------------------------------------------------------------------ #

    async def parse(self, url: str, html: Optional[str] = None) -> VacancyData:
        """
        Fetch and parse a vacancy page.

        Parameters
        ----------
        url:
            The canonical URL of the vacancy.
        html:
            Pre-fetched HTML string (e.g. supplied by the browser extension).
            When None you should fetch it yourself (see the example below).

        Returns
        -------
        VacancyData
            Required keys: ``url``, ``source``.
            All data fields are Optional — return None for anything you
            cannot extract (e.g. when the page is blocked).
        """
        url = url.strip()

        # --- Fetch HTML if not provided -----------------------------------
        if not html:
            try:
                async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    html = resp.text
            except Exception:
                # Page unreachable — return minimal record, all data fields None
                return VacancyData(url=url, source=self.source)

        soup = BeautifulSoup(html, "html.parser")

        # --- Extract fields -----------------------------------------------
        # Replace the selectors below with the ones that work for your site.

        title = soup.find("h1").get_text(strip=True) if soup.find("h1") else None

        return VacancyData(
            # ---- required (always fill these two) -----------------------
            url=url,
            source=self.source,          # fixed constant from the class
            # ---- optional: set to None if not available -----------------
            title=title,
            company=None,                # <- your extractor here
            description=soup.get_text(separator="\n")[:15000] or None,
            is_closed=None,              # <- detect from page if possible
            # ---- optional: identifiers ----------------------------------
            job_id=None,
            # ---- optional: company details ------------------------------
            company_url=None,
            company_info=None,
            # ---- optional: location -------------------------------------
            location=None,
            city=None,
            country=None,
            # ---- optional: work format ----------------------------------
            # one of: "remote" | "hybrid" | "on-site" | None
            workplace_type=None,
            # ---- optional: salary ---------------------------------------
            salary_min=None,
            salary_max=None,
            salary_currency=None,
            # one of: "hour" | "day" | "week" | "month" | "year" | None
            salary_period=None,
        )
