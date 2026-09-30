"""SuperJob (superjob.ru) job vacancy parser."""

import logging
import re
from typing import Optional

from bs4 import BeautifulSoup

from ..location_parser import normalize_country, parse_location
from .helpers import (
    clean_text,
    fetch_html,
    find_json_ld,
    normalize_workplace,
    parse_json_ld_salary,
    parse_salary_string,
)
from .registry import BaseParser, registry
from .types import VacancyData

logger = logging.getLogger(__name__)


@registry.register
class SuperJobParser(BaseParser):
    """Parser for SuperJob vacancies (superjob.ru)."""

    name = "superjob"
    source = "SuperJob"
    priority = 10
    needs_extension = False

    def matches(self, url: str) -> bool:
        return "superjob.ru" in url.lower()

    async def parse(self, url: str, html: Optional[str] = None) -> VacancyData:
        url = url.strip()

        if not html:
            fetched = await fetch_html(url)
            if not fetched:
                return VacancyData(url=url, source=self.source)
            html = fetched

        soup = BeautifulSoup(html, "html.parser")

        job_id = self._extract_job_id(url)
        jld = find_json_ld(soup, "JobPosting")

        title: Optional[str] = None
        company: Optional[str] = None
        company_url: Optional[str] = None
        description: Optional[str] = None
        raw_location: Optional[str] = None
        city: Optional[str] = None
        country: Optional[str] = "Russia"
        salary_min: Optional[float] = None
        salary_max: Optional[float] = None
        salary_currency: Optional[str] = None
        salary_period: Optional[str] = None
        workplace_type: Optional[str] = None
        is_closed: bool = False

        if jld:
            title = jld.get("title")
            hiring_org = jld.get("hiringOrganization")
            if isinstance(hiring_org, dict):
                company = hiring_org.get("name")
                company_url = hiring_org.get("sameAs")

            desc_raw = jld.get("description")
            if desc_raw:
                description = clean_text(BeautifulSoup(desc_raw, "html.parser"))

            sal_info = parse_json_ld_salary(jld)
            salary_min = sal_info["salary_min"]
            salary_max = sal_info["salary_max"]
            salary_currency = sal_info["salary_currency"]
            salary_period = sal_info["salary_period"]

            job_loc = jld.get("jobLocation")
            if isinstance(job_loc, dict):
                addr = job_loc.get("address")
                if isinstance(addr, dict):
                    city = addr.get("addressLocality")
                    c_name = addr.get("addressCountry")
                    if c_name:
                        country = normalize_country(str(c_name))
                    reg = addr.get("addressRegion")
                    parts = [p for p in [city, reg, country] if p]
                    raw_location = ", ".join(parts) if parts else city

        # DOM Fallbacks & Enhancements
        if not title:
            h1 = soup.find("h1")
            title = h1.get_text(strip=True) if h1 else None

        if not company:
            comp_el = soup.select_one('[class*="Company"], [class*="client"], a[href*="/clients/"]')
            if comp_el:
                company = comp_el.get_text(strip=True)

        if not raw_location:
            loc_el = soup.select_one('[class*="location"], [class*="Address"], [itemprop="jobLocation"]')
            if loc_el:
                raw_location = loc_el.get_text(" ", strip=True)
                p_city, p_country = parse_location(raw_location)
                city = city or p_city or None
                if p_country:
                    country = p_country

        if salary_min is None and salary_max is None:
            sal_el = soup.select_one(
                '[class*="Salary"], span[class*="_2W4_"], [class*="f-test-text-company-item-salary"]'
            )
            if sal_el:
                sal_text = sal_el.get_text(" ", strip=True)
                if sal_text and "договоренност" not in sal_text.lower():
                    sal_res = parse_salary_string(sal_text)
                    salary_min = sal_res["salary_min"]
                    salary_max = sal_res["salary_max"]
                    salary_currency = sal_res["salary_currency"]
                    salary_period = sal_res["salary_period"]

        if not workplace_type:
            for text_source in [title, raw_location, description]:
                if text_source:
                    w = normalize_workplace(text_source)
                    if w:
                        workplace_type = w
                        break

        # Check if closed
        is_closed = bool(
            soup.find(string=re.compile(r"вакансия в архиве|вакансия закрыта|в архиве|снята с публикации", re.I))
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
        m = re.search(r"-(\d+)\.html", url)
        if not m:
            m = re.search(r"/vakansii/.*?(\d+)", url)
        return m.group(1) if m else None
