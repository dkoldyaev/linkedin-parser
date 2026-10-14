"""GeekJob (geekjob.ru) job and profile parser."""

import logging
import re
from typing import Optional

from bs4 import BeautifulSoup

from ..location_parser import normalize_country, parse_location
from .helpers import (
    clean_text,
    fetch_html,
    normalize_workplace,
    parse_salary_string,
)
from .registry import BaseParser, registry
from .types import VacancyData

logger = logging.getLogger(__name__)


@registry.register
class GeekJobParser(BaseParser):
    """Parser for GeekJob postings (geekjob.ru)."""

    name = "geekjob"
    source = "GeekJob"
    priority = 10
    needs_extension = False

    def matches(self, url: str) -> bool:
        return "geekjob.ru" in url.lower()

    def normalize_url(self, url: str, html: Optional[str] = None) -> str:
        from .helpers import clean_url_params, extract_canonical_url
        if html:
            canonical = extract_canonical_url(html)
            if canonical:
                return clean_url_params(canonical)
        jid = self._extract_job_id(url)
        if jid:
            return f"https://geekjob.ru/vacancy/{jid}"
        return clean_url_params(url)

    async def parse(self, url: str, html: Optional[str] = None) -> VacancyData:
        url = self.normalize_url(url, html)

        if not html:
            fetched = await fetch_html(url)
            if not fetched:
                return VacancyData(url=url, source=self.source)
            html = fetched

        soup = BeautifulSoup(html, "html.parser")

        job_id = self._extract_job_id(url)

        # 1. Title
        h1 = soup.find("h1")
        title = h1.get_text(strip=True) if h1 else None

        # 2. Company & Company URL
        company: Optional[str] = None
        company_url: Optional[str] = None

        comp_el = soup.select_one(".company, [class*='company'], .employer")
        if comp_el:
            c_text = comp_el.get_text(" ", strip=True)
            if c_text:
                company = c_text
        comp_a = soup.select_one("a[href*='/company/'], a[href*='/employer/']")
        if comp_a and comp_a.get("href"):
            href = comp_a["href"]
            company_url = href if href.startswith("http") else f"https://geekjob.ru{href}"

        # 3. Location / City / Country
        raw_location: Optional[str] = None
        city: Optional[str] = None
        country: Optional[str] = None

        loc_el = soup.select_one(".location, [class*='location']")
        if loc_el:
            raw_location = loc_el.get_text(" ", strip=True) or None

        if not raw_location:
            # Check og:description (e.g. "Software Engineer • Вроцлав, Польша • ...")
            og_desc = soup.find("meta", property="og:description")
            if og_desc and og_desc.get("content"):
                parts = [p.strip() for p in og_desc["content"].split("•")]
                for part in parts:
                    if "," in part:
                        p_city, p_country = parse_location(part)
                        if p_city or p_country:
                            raw_location = part
                            city = p_city or None
                            country = p_country or None
                            break

        if raw_location and not (city and country):
            p_city, p_country = parse_location(raw_location)
            city = city or p_city or None
            country = country or p_country or None

        # 4. Salary
        salary_min = None
        salary_max = None
        salary_currency = None
        salary_period = None

        sal_el = soup.select_one(".salary, [class*='salary']")
        if sal_el:
            sal_text = sal_el.get_text(" ", strip=True)
            if sal_text:
                sal_res = parse_salary_string(sal_text)
                salary_min = sal_res["salary_min"]
                salary_max = sal_res["salary_max"]
                salary_currency = sal_res["salary_currency"]
                salary_period = sal_res["salary_period"]

        # 5. Description
        desc_el = soup.select_one(
            "#vacancy-description, .description, [class*='description'], #resume-description"
        )
        description = clean_text(desc_el) if desc_el else None

        # 6. Workplace type
        workplace_type = None
        for text_source in [title, raw_location, description]:
            if text_source:
                w = normalize_workplace(text_source)
                if w:
                    workplace_type = w
                    break

        # 7. Closed status
        is_closed = bool(
            soup.select_one(".badge-closed, .status-closed, [class*='closed']")
            or soup.find(string=re.compile(r"вакансия в архиве|вакансия закрыта|в архиве", re.I))
        )

        return VacancyData(
            url=url,
            source=self.source,
            title=title,
            company=company,
            description=description[:15000] if description else None,
            is_closed=is_closed,
            job_id=job_id,
            company_url=company_url,
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
        m = re.search(r"/(?:vacancy|geek)/([a-f0-9]+)", url)
        return m.group(1) if m else None
