import re
import json
import logging
from typing import Dict, Any, Optional
import httpx
from bs4 import BeautifulSoup
from .location_parser import parse_location

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


def extract_job_id(url: str) -> Optional[str]:
    """Extract LinkedIn Job ID from various URL patterns."""
    if not url:
        return None

    # Pattern 1: ?currentJobId=1234567890
    match = re.search(r"currentJobId=(\d+)", url)
    if match:
        return match.group(1)

    # Pattern 2: /jobs/view/1234567890 or /jobs/view/slug-1234567890
    match = re.search(r"/jobs/view/(?:[a-zA-Z0-9\-_]+-)?(\d+)", url)
    if match:
        return match.group(1)

    # Pattern 3: urn:li:jobPosting:1234567890
    match = re.search(r"jobPosting:(\d+)", url)
    if match:
        return match.group(1)

    # Pattern 4: any standalone 9-12 digits in path
    match = re.search(r"/(\d{9,12})(?:[/?&#]|$)", url)
    if match:
        return match.group(1)

    # Pattern 5: Upwork job ID
    match = re.search(r"(~[a-zA-Z0-9]+)", url)
    if match:
        return match.group(1)

    return None


def clean_text(html_elem) -> str:
    """Extract and format text cleanly preserving line breaks and lists."""
    if not html_elem:
        return ""
    
    # Replace <br> and block elements with newlines
    for br in html_elem.find_all(["br", "p", "div", "li"]):
        br.insert_after("\n")
    
    text = html_elem.get_text()
    # Normalize excessive empty lines
    lines = [line.strip() for line in text.splitlines()]
    clean_lines = []
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


def extract_salary_from_soup(soup: BeautifulSoup) -> Dict[str, Any]:
    """Extract structured salary info from JSON-LD schema or HTML elements if present."""
    result = {
        "salary_min": None,
        "salary_max": None,
        "salary_currency": None,
        "salary_period": None,
        "salary_raw_text": None,
    }

    # 1. Check JSON-LD scripts
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            raw_text = script.string or script.get_text()
            if not raw_text:
                continue
            data = json.loads(raw_text)
            items = data if isinstance(data, list) else [data]
            for item in items:
                if isinstance(item, dict) and item.get("@type") == "JobPosting":
                    base_salary = item.get("baseSalary")
                    if isinstance(base_salary, dict):
                        currency = base_salary.get("currency")
                        val_obj = base_salary.get("value")
                        unit_text = None
                        min_val = None
                        max_val = None

                        if isinstance(val_obj, dict):
                            unit_text = val_obj.get("unitText")
                            min_val = val_obj.get("minValue") if val_obj.get("minValue") is not None else val_obj.get("value")
                            max_val = val_obj.get("maxValue") if val_obj.get("maxValue") is not None else val_obj.get("value")
                        elif isinstance(val_obj, (int, float)):
                            min_val = val_obj
                            max_val = val_obj

                        if not unit_text:
                            unit_text = base_salary.get("unitText")

                        period = None
                        if unit_text:
                            ut_upper = str(unit_text).upper()
                            if "YEAR" in ut_upper or "ANNUAL" in ut_upper:
                                period = "year"
                            elif "MONTH" in ut_upper:
                                period = "month"
                            elif "HOUR" in ut_upper:
                                period = "hour"
                            elif "WEEK" in ut_upper:
                                period = "week"
                            elif "DAY" in ut_upper:
                                period = "day"

                        if min_val is not None or max_val is not None:
                            result["salary_min"] = float(min_val) if min_val is not None else None
                            result["salary_max"] = float(max_val) if max_val is not None else None
                            result["salary_currency"] = currency or "$"
                            result["salary_period"] = period or "year"
                            return result
        except Exception as e:
            logger.debug(f"Could not parse JSON-LD for salary: {e}")

    # 2. Check HTML compensation elements
    comp_elem = soup.find(class_=lambda c: c and ("compensation__salary" in c or "topcard__flavor--salary" in c))
    if comp_elem:
        raw_t = comp_elem.get_text(strip=True)
        if raw_t:
            result["salary_raw_text"] = raw_t

    return result


def normalize_workplace_type(val: Optional[str]) -> Optional[str]:
    """Normalize workplace type string to 'remote', 'hybrid', or 'on-site'."""
    if not val:
        return None
    val_lower = str(val).strip().lower()
    if any(k in val_lower for k in ["remote", "удален", "telecommute", "wfh"]):
        return "remote"
    if any(k in val_lower for k in ["hybrid", "гибрид"]):
        return "hybrid"
    if any(k in val_lower for k in ["on-site", "onsite", "on site", "в офисе"]):
        return "on-site"
    return None


def extract_workplace_type_from_soup(soup: BeautifulSoup, raw_location: str, criteria: Dict[str, str]) -> Optional[str]:
    """Extract workplace type ('remote', 'hybrid', 'on-site') from LinkedIn markup, criteria or location."""
    # 1. Criteria list (most reliable when present)
    for k, v in criteria.items():
        if "workplace" in k.lower():
            res = normalize_workplace_type(v)
            if res:
                return res

    # 2. JSON-LD schema
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            raw_text = script.string or script.get_text()
            if not raw_text:
                continue
            data = json.loads(raw_text)
            items = data if isinstance(data, list) else [data]
            for item in items:
                if isinstance(item, dict) and item.get("@type") == "JobPosting":
                    if item.get("jobLocationType") == "TELECOMMUTE":
                        return "remote"
                    wp = item.get("workplaceType")
                    res = normalize_workplace_type(wp)
                    if res:
                        return res
        except Exception:
            pass

    # 3. Location string (often has '(Hybrid)', '(Remote)', '(On-site)')
    if raw_location:
        res = normalize_workplace_type(raw_location)
        if res:
            return res

    # 4. Topcard bullet / flavor elements
    for el in soup.find_all(class_=lambda c: c and ("topcard__flavor" in c or "workplace-type" in c or "job-criteria" in c)):
        text = el.get_text(strip=True)
        res = normalize_workplace_type(text)
        if res:
            return res

def extract_is_closed_from_soup(soup: BeautifulSoup, html: Optional[str] = None) -> bool:
    """
    Detect if LinkedIn job is closed / no longer accepting applications.
    Checks LinkedIn-specific classes, figcaption/status elements, and localized closed banners.
    """
    # 1. Look for explicit closed job classes or tags
    closed_elem = soup.find(class_=lambda c: c and any(k in str(c).lower() for k in [
        "closed-job", 
        "topcard__flavor--closed",
        "job-details-jobs-unified-top-card__closed-badge"
    ]))
    if closed_elem:
        return True

    # 2. Check figcaption or top-card / header badges / alerts / flavor elements
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
    combined_regex = re.compile("|".join(closed_patterns), re.IGNORECASE)

    # Check any figcaption specifically (LinkedIn frequently renders closed notices as <figcaption class="closed-job__flavor">)
    for fig in soup.find_all("figcaption"):
        if combined_regex.search(fig.get_text(strip=True)):
            return True

    # Look in badges, alerts, and top-card subline/flavor elements (excluding long description body)
    for el in soup.find_all(["span", "div", "p", "section"], class_=lambda c: c and any(k in str(c).lower() for k in [
        "flavor", "banner", "alert", "status", "entity-info", "topcard", "top-card", "badge", "message"
    ])):
        classes = el.get("class") or []
        class_str = " ".join(classes) if isinstance(classes, list) else str(classes)
        if any(dc in class_str for dc in ["description__text", "show-more-less-html__markup"]):
            continue
        text = el.get_text(strip=True)
        if len(text) < 150 and combined_regex.search(text):
            return True

    # 3. Check if html text has closed-job class
    if html and ("closed-job" in html or "closed-job__flavor" in html or "topcard__flavor--closed" in html):
        return True

    return False


async def scrape_linkedin_job(url: str, html: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetch and parse LinkedIn job vacancy page.
    Returns dictionary with parsed fields.
    """
    url = url.strip()
    job_id = extract_job_id(url)
    
    target_url = url

    if not html:
        async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=20.0) as client:
            # First attempt: if job_id is found, use LinkedIn Guest API endpoint
            if job_id:
                api_url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}"
                try:
                    resp = await client.get(api_url)
                    if resp.status_code == 200 and len(resp.text) > 1000:
                        html = resp.text
                        target_url = api_url
                    elif resp.status_code == 404:
                        return {"is_closed": True, "title": "Vacancy Closed (404 Not Found)", "description": ""}
                except Exception as e:
                    logger.warning(f"Failed to fetch guest API for job {job_id}: {e}")
    
            # Fallback: fetch original URL directly if guest API was not successful
            if not html:
                try:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        html = resp.text
                    elif resp.status_code == 404:
                        return {"is_closed": True, "title": "Vacancy Closed (404 Not Found)", "description": ""}
                    else:
                        raise ValueError(f"HTTP response status {resp.status_code}")
                except Exception as e:
                    logger.error(f"Failed to fetch job URL {url}: {e}")
                    raise RuntimeError(f"Could not load job page: {e}")

    # Parse HTML with BeautifulSoup
    soup = BeautifulSoup(html, "html.parser")

    # Title extraction
    title_elem = (
        soup.find(["h1", "h2"], class_=lambda c: c and ("top-card-layout__title" in c or "topcard__title" in c or "job-title" in c))
        or soup.find("h1")
        or soup.find("h2")
    )
    title = title_elem.get_text(strip=True) if title_elem else "LinkedIn Vacancy"

    # Company name & link
    company_elem = (
        soup.find("a", class_=lambda c: c and ("topcard__org-name-link" in c or "company-name" in c))
        or soup.find("span", class_=lambda c: c and ("topcard__flavor" in c or "company-name" in c))
        or soup.find("a", href=lambda h: h and "/company/" in str(h))
    )
    company = company_elem.get_text(strip=True) if company_elem else "Unknown Company"
    company_url = company_elem.get("href") if company_elem and company_elem.name == "a" else None
    if company_url and company_url.startswith("/"):
        company_url = f"https://www.linkedin.com{company_url}"
    # Clean tracking params from company URL
    if company_url:
        company_url = company_url.split("?")[0]

    # Location, City & Country
    location_elem = (
        soup.find("span", class_=lambda c: c and ("topcard__flavor--bullet" in c or "job-location" in c))
        or soup.find("span", class_=lambda c: c and "top-card-layout__first-subline" in c)
    )
    location = location_elem.get_text(strip=True) if location_elem else ""
    city, country = parse_location(location)

    # Job description
    desc_elem = (
        soup.find("div", class_=lambda c: c and ("show-more-less-html__markup" in c or "description__text" in c or "decoratedJobPosting" in c))
        or soup.find("section", class_=lambda c: c and "description" in c)
    )
    description = clean_text(desc_elem) if desc_elem else ""

    # Criteria metadata (Seniority, Employment type, Industry)
    criteria = {}
    criteria_list = soup.find("ul", class_=lambda c: c and "description__job-criteria-list" in c)
    if criteria_list:
        for item in criteria_list.find_all("li"):
            header = item.find("h3")
            value = item.find("span")
            if header and value:
                key = header.get_text(strip=True)
                criteria[key] = value.get_text(strip=True)

    if criteria:
        meta_str = "\n\n--- Metadata ---\n" + "\n".join([f"{k}: {v}" for k, v in criteria.items()])
        description += meta_str

    # Extract company info / about company section if present in the text or page
    company_info = ""
    about_match = re.search(r"(?:About\s+(?:the\s+)?(?:Company|us)|О\s+компании)[\s\S]{10,800}?(?=\n\s*(?:Requirements|Responsibilities|What\s+you|Stack|Qualifications|We\s+offer)|\Z)", description, re.IGNORECASE)
    if about_match:
        company_info = about_match.group(0).strip()

    # Extract salary from page markup
    salary_data = extract_salary_from_soup(soup)
    if salary_data.get("salary_raw_text"):
        description += f"\n\n--- Compensation ---\n{salary_data['salary_raw_text']}"

    # Extract workplace type (remote, hybrid, on-site)
    workplace_type = extract_workplace_type_from_soup(soup, location, criteria)

    # Detect if vacancy is closed / no longer accepting applications
    is_closed = extract_is_closed_from_soup(soup, html)

    return {
        "job_id": job_id,
        "url": url,
        "title": title,
        "company": company,
        "company_url": company_url,
        "company_info": company_info,
        "location": location,
        "city": city,
        "country": country,
        "description": description,
        "workplace_type": workplace_type,
        "is_closed": is_closed,
        "salary_min": salary_data.get("salary_min"),
        "salary_max": salary_data.get("salary_max"),
        "salary_currency": salary_data.get("salary_currency"),
        "salary_period": salary_data.get("salary_period"),
    }

async def scrape_upwork_job(url: str) -> Dict[str, Any]:
    url = url.strip()
    job_id = extract_job_id(url)

    if job_id and job_id.startswith("~"):
        url = f"https://www.upwork.com/jobs/{job_id}"

    return {
        "job_id": job_id,
        "url": url,
        "title": url,
        "company": "Upwork",
        "company_url": None,
        "company_info": "",
        "location": "",
        "city": None,
        "country": "",
        "description": "",
        "workplace_type": "",
        "is_closed": False,
        "salary_min": None,
        "salary_max": None,
        "salary_currency": None,
        "salary_period": None,
    }


async def scrape_universal_job(url: str, html: Optional[str] = None) -> Dict[str, Any]:
    """
    Universal fallback parser. Strips noise from HTML and passes all remaining
    text to the LLM — no field pre-extraction logic.
    """
    from urllib.parse import urlparse
    domain = urlparse(url).netloc.replace("www.", "")

    if not html:
        try:
            async with httpx.AsyncClient(timeout=15.0, headers=HEADERS, follow_redirects=True) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                html = resp.text
        except Exception as e:
            logger.warning(f"Failed to fetch {url}: {e}")
            html = ""

    if not html:
        return {
            "url": url,
            "title": "Не удалось загрузить страницу",
            "company": domain,
            "company_url": f"https://{domain}",
            "location": "Not specified",
            "city": None,
            "country": None,
            "description": "",
            "is_closed": False,
            "salary_min": None,
            "salary_max": None,
            "salary_currency": None,
            "salary_period": None,
        }

    soup = BeautifulSoup(html, 'html.parser')

    # Use <title> as a temporary placeholder; LLM will extract the real title
    title = soup.title.string.strip() if soup.title and soup.title.string else domain

    # Strip non-content tags
    for tag in soup(["script", "style", "noscript", "svg", "iframe"]):
        tag.decompose()

    # Dump all remaining text
    lines = (line.strip() for line in soup.get_text(separator="\n").splitlines())
    text = "\n".join(line for line in lines if line)

    return {
        "url": url,
        "title": title[:255],
        "company": domain,
        "company_url": f"https://{domain}",
        "description": text[:15000],
        "location": "Not specified",
        "city": None,
        "country": None,
        "is_closed": False,
        "salary_min": None,
        "salary_max": None,
        "salary_currency": None,
        "salary_period": None,
    }

