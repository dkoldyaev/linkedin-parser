"""Layboard (layboard.com) job vacancy parser."""

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
class LayboardParser(BaseParser):
    """Parser for Layboard international vacancies (layboard.com)."""

    name = "layboard"
    source = "Layboard"
    priority = 10
    needs_extension = False

    def matches(self, url: str) -> bool:
        return "layboard.com" in url.lower()

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
        country: Optional[str] = None
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
                    parts = [p for p in [city, country] if p]
                    raw_location = ", ".join(parts) if parts else city

        # DOM Fallbacks & Enhancements
        h1 = soup.find("h1")
        h1_text = h1.get_text(" ", strip=True) if h1 else None

        if not title:
            title = h1_text

        # If salary wasn't in JSON-LD, look in H1 (e.g. "От 4800 $") or DOM
        if salary_min is None and salary_max is None:
            # Check H1 or salary container
            sal_match = None
            if h1_text and any(c in h1_text for c in ["$", "€", "₽", "USD", "EUR"]):
                m = re.search(r"(?:зарплата|от|до)?\s*(\d+[\d\s]*(?:—|-|–)?[\d\s]*\s*(?:\$|€|₽|USD|EUR))", h1_text, re.I)
                if m:
                    sal_match = m.group(0)
            if not sal_match:
                sal_el = soup.select_one(".salary, [class*='salary'], .price")
                if sal_el:
                    sal_match = sal_el.get_text(" ", strip=True)
            if sal_match:
                sal_res = parse_salary_string(sal_match)
                salary_min = sal_res["salary_min"]
                salary_max = sal_res["salary_max"]
                salary_currency = sal_res["salary_currency"]
                salary_period = sal_res["salary_period"] or "month"

        if not company:
            comp_el = soup.select_one(".company-name, [class*='company']")
            if comp_el:
                company = comp_el.get_text(" ", strip=True)

        if not raw_location:
            loc_el = soup.select_one(".location, [class*='location']")
            if loc_el:
                raw_location = loc_el.get_text(" ", strip=True)
                p_city, p_country = parse_location(raw_location)
                city = city or p_city or None
                country = country or p_country or None

        if not workplace_type:
            for text_source in [title, h1_text, raw_location, description]:
                if text_source:
                    w = normalize_workplace(text_source)
                    if w:
                        workplace_type = w
                        break

        # Check if closed
        is_closed = bool(
            soup.find(string=re.compile(r"вакансия закрыта|не актуальна|в архиве", re.I))
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
        m = re.search(r"/(?:vakansiya|vakansii)/(\d+)", url)
        return m.group(1) if m else None
