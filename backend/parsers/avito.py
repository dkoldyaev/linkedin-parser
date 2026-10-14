"""Avito job vacancy parser."""

import json
import logging
import re
from typing import Optional
from urllib.parse import urlparse

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
class AvitoParser(BaseParser):
    """Parser for Avito vacancies (avito.ru)."""

    name = "avito"
    source = "Avito"
    priority = 10
    needs_extension = False

    def matches(self, url: str) -> bool:
        return "avito.ru" in url.lower()

    def normalize_url(self, url: str, html: Optional[str] = None) -> str:
        from .helpers import clean_url_params, extract_canonical_url
        if html:
            canonical = extract_canonical_url(html)
            if canonical:
                return clean_url_params(canonical)
        return clean_url_params(url)

    async def parse(self, url: str, html: Optional[str] = None) -> VacancyData:
        url = self.normalize_url(url, html)

        if not html:
            fetched = await fetch_html(url)
            if not fetched:
                return VacancyData(url=url, source=self.source)
            html = fetched

        soup = BeautifulSoup(html, "html.parser")

        # 1. Job ID from URL or page
        job_id = self._extract_job_id(url)

        # 2. JSON-LD JobPosting
        jld = find_json_ld(soup, "JobPosting")

        title: Optional[str] = None
        company: Optional[str] = None
        description: Optional[str] = None
        raw_location: Optional[str] = None
        city: Optional[str] = None
        country: Optional[str] = "Russia"
        salary_min: Optional[float] = None
        salary_max: Optional[float] = None
        salary_currency: Optional[str] = None
        salary_period: Optional[str] = None
        is_closed: bool = False

        if jld:
            title = jld.get("title")
            hiring_org = jld.get("hiringOrganization")
            if isinstance(hiring_org, dict):
                company = hiring_org.get("name")
            desc_html = jld.get("description")
            if desc_html:
                desc_soup = BeautifulSoup(desc_html, "html.parser")
                description = clean_text(desc_soup)

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
                        country = normalize_country(c_name)
                    raw_location = addr.get("streetAddress") or city

        # 3. Fallback / supplementary extraction from staticRouterHydrationData
        hydration = self._extract_hydration_data(html)
        if hydration:
            cm = hydration.get("loaderData", {}).get("catalog-or-main-or-item", {})
            bi = cm.get("buyerItem", {})
            item = bi.get("item", {})

            if not title:
                title = item.get("title") or bi.get("title")

            if not company:
                seller = bi.get("seller", {})
                seller_name = seller.get("name")
                if seller_name and seller_name != "Пользователь":
                    company = seller_name

            if not description and item.get("description"):
                desc_soup = BeautifulSoup(item["description"], "html.parser")
                description = clean_text(desc_soup)

            if salary_min is None and salary_max is None:
                price_str = bi.get("priceString")
                if price_str:
                    sal_res = parse_salary_string(price_str)
                    salary_min = sal_res["salary_min"]
                    salary_max = sal_res["salary_max"]
                    salary_currency = sal_res["salary_currency"]
                    salary_period = sal_res["salary_period"]

            if not city and cm.get("location", {}).get("pathname"):
                path_parts = cm["location"]["pathname"].strip("/").split("/")
                if path_parts:
                    city_slug = path_parts[0]
                    # Map known slugs or title-case
                    city = city_slug.capitalize()

            # Status check in hydration
            status_id = item.get("statusId")
            if status_id == 0:
                is_closed = True

        # 4. DOM Fallbacks
        if not title:
            h1 = soup.find("h1")
            title = h1.get_text(strip=True) if h1 else None

        if not company:
            seller_el = soup.select_one(
                '[data-marker="seller-link/link"], [data-marker="seller-info/name"], [class*="seller-info-name"]'
            )
            if seller_el:
                c_text = seller_el.get_text(strip=True)
                if c_text and c_text != "Пользователь":
                    company = c_text

        if not description:
            desc_el = soup.select_one(
                '[data-marker="item-description/text"], [data-marker="item-view/item-description"], [itemprop="description"]'
            )
            if desc_el:
                description = clean_text(desc_el)

        if salary_min is None and salary_max is None:
            sal_el = soup.select_one('[data-marker*="price"], [class*="price-value"]')
            if sal_el:
                sal_res = parse_salary_string(sal_el.get_text(" ", strip=True))
                salary_min = sal_res["salary_min"]
                salary_max = sal_res["salary_max"]
                salary_currency = sal_res["salary_currency"]
                salary_period = sal_res["salary_period"]

        if not raw_location:
            addr_el = soup.select_one(
                '[itemprop="address"], [class*="style-item-address__string"], span[class*="address"]'
            )
            if addr_el:
                raw_location = addr_el.get_text(" ", strip=True)
                p_city, p_country = parse_location(raw_location)
                city = city or p_city
                country = country or p_country

        if not city:
            # Try to extract city from URL path: /ramenskoe/podrabotka/... -> Ramenskoe
            parsed_path = urlparse(url).path.strip("/").split("/")
            if parsed_path:
                city = parsed_path[0].capitalize()

        # 5. Check if closed
        if not is_closed:
            closed_indicator = soup.select_one(
                '[data-marker="item-closed-banner"], [class*="item-view-closed"], [class*="item-closed"]'
            )
            if closed_indicator or soup.find(string=re.compile(r"объявление снято|снято с публикации", re.I)):
                is_closed = True

        # 6. Workplace type
        workplace_type = None
        for text_source in [title, raw_location, description]:
            if text_source:
                w = normalize_workplace(text_source)
                if w:
                    workplace_type = w
                    break

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
            location=raw_location or city,
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
        m = re.search(r"_(\d{8,12})(?:[/?#]|$)", url)
        if not m:
            m = re.search(r"/(\d{8,12})(?:[/?#]|$)", url)
        return m.group(1) if m else None

    @staticmethod
    def _extract_hydration_data(html: str) -> Optional[dict]:
        m = re.search(r'window\.__staticRouterHydrationData\s*=\s*JSON\.parse\("(.*?)"\);', html, re.DOTALL)
        if m:
            try:
                decoded = json.loads('"' + m.group(1) + '"')
                return json.loads(decoded)
            except Exception:
                pass
        return None
