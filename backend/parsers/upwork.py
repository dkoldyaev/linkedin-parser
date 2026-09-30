"""Upwork job parser.

Upwork pages are heavily JavaScript-rendered, so direct HTTP fetching
returns very little. This parser signals ``needs_extension = True`` so
that the browser extension supplies the rendered HTML.

When HTML is provided, it extracts the job title, description, budget/rate,
client location, and job ID.
"""

import logging
import re
from typing import Optional

from bs4 import BeautifulSoup

from ..location_parser import COUNTRY_ALIASES, KNOWN_COUNTRIES, normalize_country
from .helpers import clean_text, parse_salary_string
from .registry import BaseParser, registry
from .types import VacancyData

logger = logging.getLogger(__name__)


@registry.register
class UpworkParser(BaseParser):
    """Parser for Upwork job postings (requires browser extension)."""

    name = "upwork"
    source = "Upwork"
    priority = 10
    needs_extension = True

    def matches(self, url: str) -> bool:
        return "upwork.com" in url.lower()

    async def parse(self, url: str, html: Optional[str] = None) -> VacancyData:
        url = url.strip()
        job_id = self._extract_job_id(url)

        if not html:
            # When called without HTML from the extension, return a skeletal
            # record so the rest of the pipeline knows to wait for the extension.
            if job_id and job_id.startswith("~"):
                url = f"https://www.upwork.com/jobs/{job_id}"
            return VacancyData(
                url=url,
                source=self.source,
                job_id=job_id,
                title=None,
                company=self.source,
                company_url=None,
                company_info=None,
                location=None,
                city=None,
                country=None,
                description=None,
                workplace_type=None,
                is_closed=False,
                salary_min=None,
                salary_max=None,
                salary_currency=None,
                salary_period=None,
            )

        soup = BeautifulSoup(html, "html.parser")

        # 1. Canonical job URL and ID from page if available
        job_link_input = soup.select_one('input[aria-label="Job link"]')
        if job_link_input and job_link_input.get("value"):
            page_url = job_link_input["value"].strip()
            if page_url.startswith("http"):
                url = page_url
                page_job_id = self._extract_job_id(url)
                if page_job_id:
                    job_id = page_job_id
        elif job_id and job_id.startswith("~"):
            url = f"https://www.upwork.com/jobs/{job_id}"

        # 2. Title
        title_el = (
            soup.select_one("header h4, [data-test='job-title']")
            or soup.find("h4")
            or soup.find("h1")
        )
        title = title_el.get_text(" ", strip=True) if title_el else None

        # 3. Description
        desc_el = soup.select_one(
            '[data-test="job-description-text"], [data-test="JobDescription"], .job-description, p.multiline-text'
        )
        if not desc_el:
            # Look for paragraphs with substantial length
            for p in soup.find_all("p"):
                txt = p.get_text(strip=True)
                if len(txt) > 80 and not any(k in txt for k in ["payment protection", "relevant proposals", "connects"]):
                    desc_el = p
                    break
        description = clean_text(desc_el) if desc_el else None

        # 4. Salary / Budget / Hourly rate
        salary_min = None
        salary_max = None
        salary_currency = None
        salary_period = None

        # Search specifically within <li> elements for rate patterns:
        for li in soup.find_all("li"):
            txt = li.get_text(" ", strip=True)
            m = re.search(r"(\$\d+(?:\.\d{2})?(?:\s*-\s*\$\d+(?:\.\d{2})?)?)\s*(Hourly|Fixed-price)?", txt, re.I)
            if m and "$" in m.group(1):
                raw_rate = m.group(0).strip()
                if "total spent" not in txt and "avg hourly rate" not in txt:
                    sal_res = parse_salary_string(raw_rate)
                    if sal_res["salary_min"] or sal_res["salary_max"]:
                        salary_min = sal_res["salary_min"]
                        salary_max = sal_res["salary_max"]
                        salary_currency = sal_res["salary_currency"] or "USD"
                        salary_period = sal_res["salary_period"] or ("hour" if "hourly" in txt.lower() else None)
                        break

        # 5. Client location (e.g. from .cfe-ui-job-about-client)
        raw_location: Optional[str] = None
        city: Optional[str] = None
        country: Optional[str] = None

        client_block = soup.select_one(".cfe-ui-job-about-client, [data-test='client-info']")
        if client_block:
            for li in client_block.find_all("li"):
                strong = li.find("strong")
                if strong:
                    c_cand = strong.get_text(strip=True)
                    if c_cand.lower() in KNOWN_COUNTRIES or c_cand.lower() in COUNTRY_ALIASES:
                        country = normalize_country(c_cand)
                        rem = li.get_text(" ", strip=True).replace(c_cand, "").strip()
                        rem = re.sub(r"\d{1,2}:\d{2}\s*(?:AM|PM)?.*", "", rem).strip()
                        if rem:
                            city = rem
                            raw_location = f"{city}, {country}"
                        else:
                            raw_location = country
                        break

        # 6. Workplace type (Upwork jobs are remote by default unless explicitly on-site)
        workplace_type = "remote"
        if soup.find(string=re.compile(r"on-site required|only on-site", re.I)):
            workplace_type = "on-site"

        # 7. Closed status
        is_closed = bool(
            soup.find(string=re.compile(r"job is no longer available|this job has expired|this posting is closed", re.I))
        )

        return VacancyData(
            url=url,
            source=self.source,
            title=title,
            company=self.source,
            description=description[:15000] if description else None,
            is_closed=is_closed,
            job_id=job_id,
            company_url=None,
            company_info=None,
            location=raw_location,
            city=city,
            country=country,
            workplace_type=workplace_type,
            salary_min=salary_min,
            salary_max=salary_max,
            salary_currency=salary_currency,
            salary_period=salary_period,
        )

    @staticmethod
    def _extract_job_id(url: str) -> Optional[str]:
        m = re.search(r"(~[a-zA-Z0-9]+)", url)
        return m.group(1) if m else None
