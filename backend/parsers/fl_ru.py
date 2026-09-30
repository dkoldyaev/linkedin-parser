"""FL.ru freelance and job project parser."""

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
class FlRuParser(BaseParser):
    """Parser for FL.ru projects and vacancies."""

    name = "fl_ru"
    source = "FL.ru"
    priority = 10
    needs_extension = False

    def matches(self, url: str) -> bool:
        return "fl.ru" in url.lower()

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
        h1 = soup.find("h1")
        title = h1.get_text(strip=True) if h1 else None

        # 2. Company / Author
        company = None
        user_link = soup.select_one("a[href^='/users/']")
        if user_link:
            company = user_link.get_text(strip=True) or user_link.get("href", "").strip("/").split("/")[-1]
        if not company:
            company = "Заказчик на FL.ru"

        # 3. Description
        desc_el = soup.select_one(
            "[id^='projectp'], [class*='fl-project-content__description-text'], [id*='project-description'], [class*='project-description']"
        )
        if not desc_el:
            desc_el = soup.select_one(".fl-project-content")
        description = clean_text(desc_el) if desc_el else None

        # 4. Salary / Budget from header row
        salary_min = None
        salary_max = None
        salary_currency = None
        salary_period = None

        raw_salary = None
        if h1:
            header_row = h1.find_parent(class_=lambda c: c and ("row" in c or "d-flex" in c))
            if header_row:
                tokens = list(header_row.stripped_strings)
                for idx, t in enumerate(tokens):
                    if "оплата" in t.lower() and idx + 1 < len(tokens):
                        val = tokens[idx + 1].strip()
                        if val and "собеседован" not in val.lower() and "договоренност" not in val.lower():
                            raw_salary = val
                        break

        if not raw_salary:
            # Fallback search for payment token
            for el in soup.find_all(string=lambda s: s and "оплата:" in s.lower()):
                p_text = el.parent.get_text(" ", strip=True) if el.parent else ""
                gp_text = el.parent.parent.get_text(" ", strip=True) if el.parent and el.parent.parent else ""
                combined = f"{p_text} {gp_text}"
                m = re.search(r"оплата:\s*([^\n\r]+)", combined, re.I)
                if m:
                    cand = m.group(1).strip()
                    if any(c in cand for c in ["₽", "руб", "$", "€"]) and "собеседован" not in cand.lower():
                        raw_salary = cand
                        break

        if raw_salary:
            sal_res = parse_salary_string(raw_salary)
            salary_min = sal_res["salary_min"]
            salary_max = sal_res["salary_max"]
            salary_currency = sal_res["salary_currency"]
            salary_period = sal_res["salary_period"]

        # 5. Location / City / Country & Workplace from info block
        raw_location = None
        city = None
        country = None
        workplace_type = None

        main_content = soup.select_one(".fl-project-content") or soup
        for span in main_content.find_all(string=lambda s: s and any(k in s for k in ["Город:", "Работа:"])):
            parent_text = span.parent.parent.get_text(" ", strip=True) if span.parent and span.parent.parent else span.parent.get_text(" ", strip=True)
            if "Город:" in parent_text:
                m = re.search(r"Город:\s*([^,\n\r]+(?:,\s*[^,\n\r]+)?)", parent_text)
                if m:
                    raw_location = m.group(1).strip()
                    p_city, p_country = parse_location(raw_location)
                    city = p_city or city
                    country = p_country or country
            if "Работа:" in parent_text:
                m = re.search(r"Работа:\s*([^\n\r]+)", parent_text)
                if m:
                    workplace_type = normalize_workplace(m.group(1))

        if not workplace_type:
            workplace_type = normalize_workplace(title) or normalize_workplace(description)

        # 6. Closed status
        is_closed = bool(
            soup.find(string=re.compile(r"заказ закрыт|проект закрыт|завершен|исполнитель выбран|в архиве", re.I))
        )

        return VacancyData(
            url=url,
            source=self.source,
            title=title,
            company=company,
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
        m = re.search(r"/projects/(\d+)", url)
        return m.group(1) if m else None
