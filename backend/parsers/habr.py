"""Habr Career (career.habr.com) job vacancy parser."""

import logging
import re
from typing import Any, Dict, List, Optional

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
class HabrCareerParser(BaseParser):
    """Parser for Habr Career vacancies (career.habr.com)."""

    name = "habr"
    source = "Habr Career"
    priority = 10
    needs_extension = False

    def matches(self, url: str) -> bool:
        u = url.lower()
        return "career.habr.com" in u or ("habr.com" in u and "vacancies" in u)

    def normalize_url(self, url: str, html: Optional[str] = None) -> str:
        from .helpers import clean_url_params, extract_canonical_url
        if html:
            canonical = extract_canonical_url(html)
            if canonical:
                return clean_url_params(canonical)
        jid = self._extract_job_id(url)
        if jid:
            return f"https://career.habr.com/vacancies/{jid}"
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

            # Parse jobLocation (can be single dict or list of dicts)
            job_loc = jld.get("jobLocation")
            cities, countries, streets = self._parse_json_ld_locations(job_loc)
            if cities:
                city = ", ".join(cities)
            if countries:
                country = countries[0]
            if streets:
                raw_location = streets[0]
            elif city:
                raw_location = city

            if jld.get("jobLocationType") == "TELECOMMUTE":
                workplace_type = "remote"

        # DOM Fallbacks & Enhancements
        if not title:
            h1 = soup.find("h1")
            title = h1.get_text(strip=True) if h1 else None

        if not company:
            comp_el = soup.select_one(".company_name, .vacancy-company__title, [class*='company_name']")
            if comp_el:
                company = comp_el.get_text(strip=True)

        if not company_url:
            comp_a = soup.select_one("a[href*='/companies/']")
            if comp_a and comp_a.get("href"):
                href = comp_a["href"]
                company_url = href if href.startswith("http") else f"https://career.habr.com{href}"

        if not description:
            desc_el = soup.select_one(".vacancy-description__text, .style-ugc, [class*='vacancy-description']")
            if desc_el:
                description = clean_text(desc_el)

        if salary_min is None and salary_max is None:
            sal_el = soup.select_one(".basic-salary, .salary, [class*='basic-salary']")
            if sal_el:
                sal_res = parse_salary_string(sal_el.get_text(" ", strip=True))
                salary_min = sal_res["salary_min"]
                salary_max = sal_res["salary_max"]
                salary_currency = sal_res["salary_currency"]
                salary_period = sal_res["salary_period"]

        if not workplace_type:
            # Check title and meta chips/badges for remote / hybrid / on-site
            for text_source in [title, raw_location, soup.select_one(".inline-list, .vacancy-meta")]:
                txt = text_source if isinstance(text_source, str) else (text_source.get_text(" ", strip=True) if text_source else "")
                w = normalize_workplace(txt)
                if w:
                    workplace_type = w
                    break

        # Check archive / closed
        archive_el = soup.find(string=re.compile(r"вакансия в архиве|вакансия закрыта|в архиве", re.I))
        if archive_el:
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
        m = re.search(r"/vacancies/(\d+)", url)
        return m.group(1) if m else None

    @staticmethod
    def _parse_json_ld_locations(job_loc: Any) -> tuple[list[str], list[str], list[str]]:
        cities: list[str] = []
        countries: list[str] = []
        streets: list[str] = []

        items = job_loc if isinstance(job_loc, list) else ([job_loc] if job_loc else [])
        for item in items:
            if not isinstance(item, dict):
                continue
            addr = item.get("address")
            if isinstance(addr, str):
                cities.append(addr.strip())
            elif isinstance(addr, dict):
                loc = addr.get("addressLocality")
                if loc:
                    cities.append(loc.strip())
                street = addr.get("streetAddress")
                if street and street != ".":
                    streets.append(street.strip())
                c_name = addr.get("addressCountry")
                if isinstance(c_name, dict):
                    c_name = c_name.get("name")
                if c_name:
                    countries.append(normalize_country(c_name))

        return cities, countries, streets
