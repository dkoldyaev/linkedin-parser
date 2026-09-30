"""
Shared helper utilities for site-specific job vacancy parsers.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
}


def clean_text(html_elem: Any) -> str:
    """Extract and format text cleanly, preserving line breaks and lists."""
    if not html_elem:
        return ""
    if isinstance(html_elem, str):
        return html_elem.strip()

    # Work on a copy or modify tags in-place
    for br in html_elem.find_all(["br", "p", "div", "li", "tr"]):
        br.insert_after("\n")
    text = html_elem.get_text()
    lines = [line.strip() for line in text.splitlines()]
    clean_lines: List[str] = []
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


def find_json_ld(soup: BeautifulSoup, target_type: str = "JobPosting") -> Optional[Dict[str, Any]]:
    """Search for JSON-LD script tag matching `target_type` (case-insensitive)."""
    target_lower = target_type.lower()
    for script in soup.find_all("script", type="application/ld+json"):
        raw = script.string or script.get_text()
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except Exception:
            continue

        items = data if isinstance(data, list) else [data]
        for item in items:
            if not isinstance(item, dict):
                continue
            item_type = str(item.get("@type", "")).lower()
            if item_type == target_lower:
                return item
            # Sometimes inside @graph
            graph = item.get("@graph")
            if isinstance(graph, list):
                for g in graph:
                    if isinstance(g, dict) and str(g.get("@type", "")).lower() == target_lower:
                        return g
    return None


def parse_json_ld_salary(data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract structured salary details from a JobPosting JSON-LD object."""
    result: Dict[str, Any] = {
        "salary_min": None,
        "salary_max": None,
        "salary_currency": None,
        "salary_period": None,
    }
    base = data.get("baseSalary")
    if not isinstance(base, dict):
        return result

    raw_currency = base.get("currency")
    if raw_currency:
        result["salary_currency"] = normalize_currency(raw_currency)

    val_obj = base.get("value")
    unit_text = base.get("unitText")
    min_val = max_val = None

    if isinstance(val_obj, dict):
        unit_text = val_obj.get("unitText") or unit_text
        min_val = val_obj.get("minValue")
        max_val = val_obj.get("maxValue")
        if min_val is None and max_val is None:
            min_val = max_val = val_obj.get("value")
    elif isinstance(val_obj, (int, float)):
        min_val = max_val = val_obj

    if unit_text:
        result["salary_period"] = normalize_period(str(unit_text))

    if min_val is not None:
        try:
            m = float(min_val)
            if m > 0:
                result["salary_min"] = m
        except (ValueError, TypeError):
            pass

    if max_val is not None:
        try:
            m = float(max_val)
            if m > 0:
                result["salary_max"] = m
        except (ValueError, TypeError):
            pass

    return result


def normalize_currency(curr: Optional[str]) -> Optional[str]:
    if not curr:
        return None
    c = curr.strip().upper()
    if c in ("RUB", "RUR", "₽", "РУБ", "РУБ."):
        return "RUB"
    if c in ("USD", "$"):
        return "USD"
    if c in ("EUR", "€"):
        return "EUR"
    if c in ("GBP", "£"):
        return "GBP"
    return curr.strip()


def normalize_period(period_str: Optional[str]) -> Optional[str]:
    if not period_str:
        return None
    p = period_str.strip().lower()
    if any(k in p for k in ["hour", "час", "hr"]):
        return "hour"
    if any(k in p for k in ["day", "смен", "день", "shift"]):
        return "day"
    if any(k in p for k in ["week", "недел"]):
        return "week"
    if any(k in p for k in ["month", "месяц", "мес"]):
        return "month"
    if any(k in p for k in ["year", "год", "annual"]):
        return "year"
    return None


def parse_salary_string(text: Optional[str]) -> Dict[str, Any]:
    """Parse unstructured salary string like 'от 100 000 ₽ на руки' or '$25 - $50 / hr'."""
    result: Dict[str, Any] = {
        "salary_min": None,
        "salary_max": None,
        "salary_currency": None,
        "salary_period": None,
    }
    if not text:
        return result

    raw = text.replace("\xa0", " ").replace("&nbsp;", " ").strip()

    # Detect currency
    if any(c in raw for c in ["₽", "руб", "RUR", "RUB"]):
        result["salary_currency"] = "RUB"
    elif any(c in raw for c in ["$", "USD"]):
        result["salary_currency"] = "USD"
    elif any(c in raw for c in ["€", "EUR"]):
        result["salary_currency"] = "EUR"
    elif any(c in raw for c in ["£", "GBP"]):
        result["salary_currency"] = "GBP"

    # Detect period
    result["salary_period"] = normalize_period(raw)
    if not result["salary_period"]:
        # default for Russian job sites is month if not specified
        if result["salary_currency"] == "RUB":
            result["salary_period"] = "month"

    # Check for range: "$20.00 - $40.00", "261 900 — 371 000", "30 000 ₽ – 55 000 ₽"
    range_match = re.search(
        r"(?:от\s+)?(?:\$|€|£|₽)?\s*([\d\s]+(?:[.,]\d+)?)\s*(?:₽|руб|usd|\$|eur|€|gbp|£)?\s*(?:—|-|–|до)\s*(?:до\s+)?(?:\$|€|£|₽)?\s*([\d\s]+(?:[.,]\d+)?)",
        raw,
        re.IGNORECASE,
    )
    if range_match:
        try:
            s_min = float(re.sub(r"[\s,]", "", range_match.group(1).replace(",", ".")))
            s_max = float(re.sub(r"[\s,]", "", range_match.group(2).replace(",", ".")))
            result["salary_min"] = s_min
            result["salary_max"] = s_max
            return result
        except ValueError:
            pass

    # Check "от 100 000"
    min_match = re.search(r"от\s+([\d\s]+(?:[.,]\d+)?)", raw, re.IGNORECASE)
    if min_match:
        try:
            result["salary_min"] = float(re.sub(r"[\s,]", "", min_match.group(1).replace(",", ".")))
            return result
        except ValueError:
            pass

    # Check "до 91 000"
    max_match = re.search(r"до\s+([\d\s]+(?:[.,]\d+)?)", raw, re.IGNORECASE)
    if max_match:
        try:
            result["salary_max"] = float(re.sub(r"[\s,]", "", max_match.group(1).replace(",", ".")))
            return result
        except ValueError:
            pass

    # Check single number: "$1800", "50000 ₽"
    num_match = re.search(r"([\d\s]{3,}(?:[.,]\d+)?)", raw)
    if num_match:
        try:
            val = float(re.sub(r"[\s,]", "", num_match.group(1).replace(",", ".")))
            result["salary_min"] = val
            result["salary_max"] = val
            return result
        except ValueError:
            pass

    return result


def normalize_workplace(text: Optional[str]) -> Optional[str]:
    """Normalize workplace text to 'remote', 'hybrid', 'on-site', or None."""
    if not text:
        return None
    t = str(text).lower()
    if any(k in t for k in ["remote", "удален", "дистанцион", "telecommute", "wfh", "worldwide"]):
        return "remote"
    if any(k in t for k in ["hybrid", "гибрид"]):
        return "hybrid"
    if any(k in t for k in ["on-site", "onsite", "on site", "в офисе", "очно", "на месте"]):
        return "on-site"
    return None


async def fetch_html(url: str, timeout: float = 15.0, headers: Optional[Dict[str, str]] = None) -> Optional[str]:
    """Fetch raw HTML using httpx with redirection handling."""
    h = dict(DEFAULT_HEADERS)
    if headers:
        h.update(headers)
    try:
        async with httpx.AsyncClient(headers=h, timeout=timeout, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.text
    except Exception as exc:
        logger.warning("Failed to fetch %s: %s", url, exc)
        return None
