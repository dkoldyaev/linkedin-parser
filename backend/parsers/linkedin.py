"""LinkedIn job vacancy parser."""

import json
import logging
import re
from typing import Any, Dict, Optional

import httpx
from bs4 import BeautifulSoup

from ..location_parser import parse_location
from .registry import BaseParser, registry
from .types import VacancyData

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
}


def _clean_text(html_elem) -> str:
    """Extract and format text cleanly, preserving line breaks and lists."""
    if not html_elem:
        return ""
    for br in html_elem.find_all(["br", "p", "div", "li"]):
        br.insert_after("\n")
    text = html_elem.get_text()
    lines = [line.strip() for line in text.splitlines()]
    clean_lines: list[str] = []
    prev_empty = False
    for line in lines:
        if not line:
            if not prev_empty:
                clean_lines.append("")
                prev_empty = True
        else:
            clean_lines.append(line)
            prev_empty = False
    return "\n".join(clean_lines).strip()


def _extract_salary(soup: BeautifulSoup) -> Dict[str, Any]:
    result = {
        "salary_min": None,
        "salary_max": None,
        "salary_currency": None,
        "salary_period": None,
        "salary_raw_text": None,
    }
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            raw = script.string or script.get_text()
            if not raw:
                continue
            data = json.loads(raw)
            items = data if isinstance(data, list) else [data]
            for item in items:
                if isinstance(item, dict) and item.get("@type") == "JobPosting":
                    base = item.get("baseSalary")
                    if not isinstance(base, dict):
                        continue
                    currency = base.get("currency")
                    val_obj = base.get("value")
                    unit_text = None
                    min_val = max_val = None
                    if isinstance(val_obj, dict):
                        unit_text = val_obj.get("unitText")
                        min_val = val_obj.get("minValue") if val_obj.get("minValue") is not None else val_obj.get("value")
                        max_val = val_obj.get("maxValue") if val_obj.get("maxValue") is not None else val_obj.get("value")
                    elif isinstance(val_obj, (int, float)):
                        min_val = max_val = val_obj
                    if not unit_text:
                        unit_text = base.get("unitText")
                    period = None
                    if unit_text:
                        ut = str(unit_text).upper()
                        if "YEAR" in ut or "ANNUAL" in ut:
                            period = "year"
                        elif "MONTH" in ut:
                            period = "month"
                        elif "HOUR" in ut:
                            period = "hour"
                        elif "WEEK" in ut:
                            period = "week"
                        elif "DAY" in ut:
                            period = "day"
                    if min_val is not None or max_val is not None:
                        result["salary_min"] = float(min_val) if min_val is not None else None
                        result["salary_max"] = float(max_val) if max_val is not None else None
                        result["salary_currency"] = currency or "$"
                        result["salary_period"] = period or "year"
                        return result
        except Exception as exc:
            logger.debug("Could not parse JSON-LD for salary: %s", exc)

    comp_elem = soup.find(class_=lambda c: c and ("compensation__salary" in c or "topcard__flavor--salary" in c))
    if comp_elem:
        raw_t = comp_elem.get_text(strip=True)
        if raw_t:
            result["salary_raw_text"] = raw_t
    return result


def _normalize_workplace(val: Optional[str]) -> Optional[str]:
    if not val:
        return None
    v = str(val).strip().lower()
    if any(k in v for k in ["remote", "удален", "telecommute", "wfh"]):
        return "remote"
    if any(k in v for k in ["hybrid", "гибрид"]):
        return "hybrid"
    if any(k in v for k in ["on-site", "onsite", "on site", "в офисе"]):
        return "on-site"
    return None


def _extract_workplace(soup: BeautifulSoup, location: str, criteria: Dict[str, str]) -> Optional[str]:
    for k, v in criteria.items():
        if "workplace" in k.lower():
            res = _normalize_workplace(v)
            if res:
                return res
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            raw = script.string or script.get_text()
            if not raw:
                continue
            data = json.loads(raw)
            items = data if isinstance(data, list) else [data]
            for item in items:
                if isinstance(item, dict) and item.get("@type") == "JobPosting":
                    if item.get("jobLocationType") == "TELECOMMUTE":
                        return "remote"
                    res = _normalize_workplace(item.get("workplaceType"))
                    if res:
                        return res
        except Exception:
            pass
    if location:
        res = _normalize_workplace(location)
        if res:
            return res
    for el in soup.find_all(class_=lambda c: c and ("topcard__flavor" in c or "workplace-type" in c or "job-criteria" in c)):
        res = _normalize_workplace(el.get_text(strip=True))
        if res:
            return res
    return None


def _extract_is_closed(soup: BeautifulSoup, html: Optional[str] = None) -> bool:
    closed_elem = soup.find(class_=lambda c: c and any(k in str(c).lower() for k in [
        "closed-job",
        "topcard__flavor--closed",
        "job-details-jobs-unified-top-card__closed-badge",
    ]))
    if closed_elem:
        return True
    closed_patterns = [
        r"no longer accepting applications",
        r"заявки больше не принимаются",
        r"при[её]м заявок (?:закрыт|заверш[её]н)",
        r"при[её]м откликов (?:закрыт|заверш[её]н|приостановлен)",
        r"вакансия закрыта",
        r"es werden keine bewerbungen mehr angenommen",
        r"les candidatures ne sont plus acceptées",
        r"ya no se aceptan solicitudes",
    ]
    combined = re.compile("|".join(closed_patterns), re.IGNORECASE)
    for fig in soup.find_all("figcaption"):
        if combined.search(fig.get_text(strip=True)):
            return True
    for el in soup.find_all(["span", "div", "p", "section"], class_=lambda c: c and any(k in str(c).lower() for k in [
        "flavor", "banner", "alert", "status", "entity-info", "topcard", "top-card", "badge", "message",
    ])):
        classes = el.get("class") or []
        class_str = " ".join(classes) if isinstance(classes, list) else str(classes)
        if any(dc in class_str for dc in ["description__text", "show-more-less-html__markup"]):
            continue
        text = el.get_text(strip=True)
        if len(text) < 150 and combined.search(text):
            return True
    if html and ("closed-job" in html or "closed-job__flavor" in html or "topcard__flavor--closed" in html):
        return True
    return False


@registry.register
class LinkedInParser(BaseParser):
    """Parser for LinkedIn job postings."""

    name = "linkedin"
    source = "LinkedIn"
    priority = 10

    def matches(self, url: str) -> bool:
        return "linkedin.com" in url.lower()

    def normalize_url(self, url: str, html: Optional[str] = None) -> str:
        job_id = self._extract_job_id(url)
        if job_id:
            return f"https://www.linkedin.com/jobs/view/{job_id}/"
        from .helpers import clean_url_params, extract_canonical_url
        if html:
            canonical = extract_canonical_url(html)
            if canonical:
                return clean_url_params(canonical)
        return clean_url_params(url)

    async def parse(self, url: str, html: Optional[str] = None) -> VacancyData:
        url = self.normalize_url(url, html)
        job_id = self._extract_job_id(url)

        if not html:
            async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=20.0) as client:
                if job_id:
                    api_url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}"
                    try:
                        resp = await client.get(api_url)
                        if resp.status_code == 200 and len(resp.text) > 1000:
                            html = resp.text
                        elif resp.status_code == 404:
                            return {"is_closed": True, "title": "Vacancy Closed (404 Not Found)", "description": ""}
                    except Exception as exc:
                        logger.warning("Failed to fetch LinkedIn guest API for job %s: %s", job_id, exc)
                if not html:
                    try:
                        resp = await client.get(url)
                        if resp.status_code == 200:
                            html = resp.text
                        elif resp.status_code == 404:
                            return {"is_closed": True, "title": "Vacancy Closed (404 Not Found)", "description": ""}
                        else:
                            raise ValueError(f"HTTP {resp.status_code}")
                    except Exception as exc:
                        logger.error("Failed to fetch LinkedIn URL %s: %s", url, exc)
                        raise RuntimeError(f"Could not load job page: {exc}") from exc

        soup = BeautifulSoup(html, "html.parser")

        # Title
        title_elem = (
            soup.find(["h1", "h2"], class_=lambda c: c and ("top-card-layout__title" in c or "topcard__title" in c or "job-title" in c))
            or soup.find("h1")
            or soup.find("h2")
        )
        title = title_elem.get_text(strip=True) if title_elem else "LinkedIn Vacancy"

        # Company
        company_elem = (
            soup.find("a", class_=lambda c: c and ("topcard__org-name-link" in c or "company-name" in c))
            or soup.find("span", class_=lambda c: c and ("topcard__flavor" in c or "company-name" in c))
            or soup.find("a", href=lambda h: h and "/company/" in str(h))
        )
        company = company_elem.get_text(strip=True) if company_elem else "Unknown Company"
        company_url = company_elem.get("href") if company_elem and company_elem.name == "a" else None
        if company_url and company_url.startswith("/"):
            company_url = f"https://www.linkedin.com{company_url}"
        if company_url:
            company_url = company_url.split("?")[0]

        # Location
        location_elem = (
            soup.find("span", class_=lambda c: c and ("topcard__flavor--bullet" in c or "job-location" in c))
            or soup.find("span", class_=lambda c: c and "top-card-layout__first-subline" in c)
        )
        location = location_elem.get_text(strip=True) if location_elem else ""
        city, country = parse_location(location)

        # Description
        desc_elem = (
            soup.find("div", class_=lambda c: c and ("show-more-less-html__markup" in c or "description__text" in c or "decoratedJobPosting" in c))
            or soup.find("section", class_=lambda c: c and "description" in c)
        )
        description = _clean_text(desc_elem) if desc_elem else ""

        # Criteria metadata
        criteria: Dict[str, str] = {}
        criteria_list = soup.find("ul", class_=lambda c: c and "description__job-criteria-list" in c)
        if criteria_list:
            for item in criteria_list.find_all("li"):
                header = item.find("h3")
                value = item.find("span")
                if header and value:
                    criteria[header.get_text(strip=True)] = value.get_text(strip=True)

        if criteria:
            description += "\n\n--- Metadata ---\n" + "\n".join(f"{k}: {v}" for k, v in criteria.items())

        # Company info
        company_info = ""
        about_match = re.search(
            r"(?:About\s+(?:the\s+)?(?:Company|us)|О\s+компании)[\s\S]{10,800}?(?=\n\s*(?:Requirements|Responsibilities|What\s+you|Stack|Qualifications|We\s+offer)|\Z)",
            description,
            re.IGNORECASE,
        )
        if about_match:
            company_info = about_match.group(0).strip()

        # Salary
        salary_data = _extract_salary(soup)
        if salary_data.get("salary_raw_text"):
            description += f"\n\n--- Compensation ---\n{salary_data['salary_raw_text']}"

        workplace_type = _extract_workplace(soup, location, criteria)
        is_closed = _extract_is_closed(soup, html)

        return VacancyData(
            job_id=job_id,
            url=url,
            source=self.source,
            title=title,
            company=company,
            company_url=company_url,
            company_info=company_info,
            location=location,
            city=city,
            country=country,
            description=description,
            workplace_type=workplace_type,
            is_closed=is_closed,
            salary_min=salary_data.get("salary_min"),
            salary_max=salary_data.get("salary_max"),
            salary_currency=salary_data.get("salary_currency"),
            salary_period=salary_data.get("salary_period"),
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_job_id(url: str) -> Optional[str]:
        if not url:
            return None
        for pattern in [
            r"currentJobId=(\d+)",
            r"/jobs/view/(?:[a-zA-Z0-9\-_]+?-)?(\d+)",
            r"jobPosting:(\d+)",
            r"/(\d{9,12})(?:[/?&#]|$)",
        ]:
            m = re.search(pattern, url)
            if m:
                return m.group(1)
        return None
