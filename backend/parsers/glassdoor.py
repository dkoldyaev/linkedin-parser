"""Glassdoor job vacancy parser."""

import logging
import re
from datetime import datetime, timezone
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
class GlassdoorParser(BaseParser):
    """Parser for Glassdoor vacancies (glassdoor.com)."""

    name = "glassdoor"
    source = "Glassdoor"
    priority = 10
    needs_extension = False

    def matches(self, url: str) -> bool:
        u = url.lower()
        return "glassdoor.com" in u or "glassdoor." in u

    def normalize_url(self, url: str, html: Optional[str] = None) -> str:
        from .helpers import clean_url_params, extract_canonical_url
        if html:
            canonical = extract_canonical_url(html)
            if canonical:
                return clean_url_params(canonical)
        jid = self._extract_job_id(url)
        if jid:
            return f"https://www.glassdoor.com/job-listing/job.htm?jl={jid}"
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
                    if isinstance(c_name, dict):
                        c_name = c_name.get("name")
                    if c_name:
                        country = normalize_country(str(c_name))
                    street = addr.get("streetAddress")
                    region = addr.get("addressRegion")
                    parts = [p for p in [street, city, region, country] if p]
                    raw_location = ", ".join(parts) if parts else city

            if jld.get("jobLocationType") == "TELECOMMUTE":
                workplace_type = "remote"

        # DOM Fallbacks
        if not title:
            h1 = soup.find("h1")
            title = h1.get_text(strip=True) if h1 else None

        if not company:
            comp_el = soup.select_one('[data-test="employer-name"], .EmployerProfile_employerName__')
            if comp_el:
                company = comp_el.get_text(" ", strip=True)

        if not raw_location:
            loc_el = soup.select_one('[data-test="location"], [data-test="job-location"]')
            if loc_el:
                raw_location = loc_el.get_text(" ", strip=True)
                p_city, p_country = parse_location(raw_location)
                city = city or p_city or None
                country = country or p_country or None

        if not workplace_type:
            for text_source in [title, raw_location, description]:
                if text_source:
                    w = normalize_workplace(text_source)
                    if w:
                        workplace_type = w
                        break

        # Status check
        if not is_closed:
            closed_badge = soup.find(
                string=re.compile(r"no longer accepting applications|this job has expired|this job is closed", re.I)
            )
            if closed_badge:
                is_closed = True

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
        m = re.search(r"jobListingId=(\d+)", url)
        if not m:
            m = re.search(r"jl=(\d+)", url)
        if not m:
            m = re.search(r"-(\d{8,12})\.htm", url)
        return m.group(1) if m else None
