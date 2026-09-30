"""Rabota.ru (rabota.ru) job vacancy parser."""

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
class RabotaRuParser(BaseParser):
    """Parser for Rabota.ru vacancies (rabota.ru)."""

    name = "rabota_ru"
    source = "Rabota.ru"
    priority = 10
    needs_extension = False

    def matches(self, url: str) -> bool:
        return "rabota.ru" in url.lower()

    async def parse(self, url: str, html: Optional[str] = None) -> VacancyData:
        url = url.strip()

        if not html:
            fetched = await fetch_html(url)
            if not fetched:
                return VacancyData(url=url, source=self.source)
            html = fetched

        soup = BeautifulSoup(html, "html.parser")

        job_id = self._extract_job_id(url)

        # 1. Title
        h1 = soup.select_one("h1, .vacancy-card__title")
        title = h1.get_text(strip=True) if h1 else None

        # 2. Company & Company URL
        company: Optional[str] = None
        company_url: Optional[str] = None

        hiring_org = soup.select_one('[itemprop="hiringOrganization"]')
        if hiring_org:
            name_meta = hiring_org.select_one('[itemprop="name"]')
            if name_meta and name_meta.get("content"):
                company = name_meta["content"].strip()
            if not company:
                legal_a = hiring_org.select_one('a[itemprop="legalName"], a')
                if legal_a:
                    company = legal_a.get_text(strip=True)
                    if legal_a.get("href"):
                        company_url = legal_a["href"]

        if not company:
            comp_a = soup.select_one('a[href*="/company/"]')
            if comp_a:
                company = comp_a.get_text(strip=True)
                company_url = comp_a.get("href")

        # 3. Salary
        salary_min = None
        salary_max = None
        salary_currency = None
        salary_period = None

        sal_el = soup.select_one(".vacancy-card__salary, [class*='vacancy-card__salary'], [itemprop='baseSalary']")
        if sal_el:
            sal_text = sal_el.get_text(" ", strip=True)
            if sal_text and "договоренност" not in sal_text.lower():
                sal_res = parse_salary_string(sal_text)
                salary_min = sal_res["salary_min"]
                salary_max = sal_res["salary_max"]
                salary_currency = sal_res["salary_currency"]
                salary_period = sal_res["salary_period"]

        # 4. Location / City / Country
        raw_location: Optional[str] = None
        city: Optional[str] = None
        country: Optional[str] = "Russia"

        loc_el = soup.select_one(".vacancy-locations__address, .vacancy-requirements__city, .vacancy-card__workplaces")
        if loc_el:
            raw_location = loc_el.get_text(" ", strip=True).strip(" ,-")
            if raw_location.lower().startswith("г "):
                raw_location = raw_location[2:].strip()
            p_city, p_country = parse_location(raw_location)
            city = p_city or raw_location
            if p_country:
                country = p_country

        if not city:
            # Check meta title or page title: "Вакансия X в Москве..."
            page_title = soup.title.get_text(strip=True) if soup.title else ""
            m_city = re.search(r"в\s+([А-Яа-яA-Za-z\-]+)\s+с\s+зарплатой", page_title)
            if m_city:
                p_city, p_country = parse_location(m_city.group(1))
                city = p_city or m_city.group(1)
                raw_location = raw_location or city

        # 5. Description
        desc_el = soup.select_one(".vacancy-card__description, .vacancy-description, [itemprop='description']")
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
            soup.find(string=re.compile(r"вакансия в архиве|вакансия закрыта|в архиве", re.I))
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
        m = re.search(r"/vacancy/(\d+)", url)
        return m.group(1) if m else None
