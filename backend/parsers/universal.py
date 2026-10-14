"""Universal fallback parser.

Strips noise from any HTML page and passes the remaining text to the
LLM for field extraction. Lowest priority so it only fires when no
site-specific parser matches the URL.

Unlike every other parser, UniversalParser derives ``source`` from the
URL domain at runtime — because it handles arbitrary unknown sites.
"""

import logging
from typing import Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from .registry import BaseParser, registry
from .types import VacancyData

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
}


@registry.register
class UniversalParser(BaseParser):
    """Catch-all parser: fetches any page and dumps its text to the LLM."""

    name = "universal"
    # source is intentionally left as the base default ("Unknown") because
    # the real value is computed from the URL domain inside parse().
    priority = -10  # Always last resort

    def matches(self, url: str) -> bool:  # noqa: D401
        return True  # matches everything

    def normalize_url(self, url: str, html: Optional[str] = None) -> str:
        from .helpers import clean_url_params, extract_canonical_url
        if html:
            canonical = extract_canonical_url(html)
            if canonical:
                return clean_url_params(canonical)
        return clean_url_params(url)

    async def parse(self, url: str, html: Optional[str] = None) -> VacancyData:
        url = self.normalize_url(url, html)
        # Derive source from the domain — the only parser allowed to do this.
        domain = urlparse(url).netloc.replace("www.", "")
        source = domain or "Unknown"

        if not html:
            try:
                async with httpx.AsyncClient(timeout=15.0, headers=HEADERS, follow_redirects=True) as client:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    html = resp.text
            except Exception as exc:
                logger.warning("UniversalParser: failed to fetch %s: %s", url, exc)

        if not html:
            return VacancyData(
                url=url,
                source=source,
                title="Не удалось загрузить страницу",
                company=domain or None,
                company_url=f"https://{domain}" if domain else None,
                description=None,
                is_closed=None,
            )

        soup = BeautifulSoup(html, "html.parser")
        title = soup.title.string.strip() if soup.title and soup.title.string else None

        for tag in soup(["script", "style", "noscript", "svg", "iframe"]):
            tag.decompose()

        lines = (line.strip() for line in soup.get_text(separator="\n").splitlines())
        text = "\n".join(line for line in lines if line)

        return VacancyData(
            url=url,
            source=source,
            title=title[:255] if title else None,
            company=domain or None,
            company_url=f"https://{domain}" if domain else None,
            description=text[:15000] or None,
            location=None,
            city=None,
            country=None,
            is_closed=None,
            salary_min=None,
            salary_max=None,
            salary_currency=None,
            salary_period=None,
        )
