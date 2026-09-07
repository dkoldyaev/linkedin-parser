import re
import logging
from typing import Dict, Any, Optional
import httpx
from bs4 import BeautifulSoup

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


async def scrape_linkedin_job(url: str) -> Dict[str, Any]:
    """
    Fetch and parse LinkedIn job vacancy page.
    Returns dictionary with parsed fields.
    """
    url = url.strip()
    job_id = extract_job_id(url)
    
    html = None
    target_url = url

    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=20.0) as client:
        # First attempt: if job_id is found, use LinkedIn Guest API endpoint
        if job_id:
            api_url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}"
            try:
                resp = await client.get(api_url)
                if resp.status_code == 200 and len(resp.text) > 1000:
                    html = resp.text
                    target_url = api_url
            except Exception as e:
                logger.warning(f"Failed to fetch guest API for job {job_id}: {e}")

        # Fallback: fetch original URL directly if guest API was not successful
        if not html:
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    html = resp.text
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

    # Location & Country
    location_elem = (
        soup.find("span", class_=lambda c: c and ("topcard__flavor--bullet" in c or "job-location" in c))
        or soup.find("span", class_=lambda c: c and "top-card-layout__first-subline" in c)
    )
    location = location_elem.get_text(strip=True) if location_elem else ""

    # Country heuristic
    country = ""
    if location:
        parts = [p.strip() for p in location.split(",") if p.strip()]
        if len(parts) > 1:
            country = parts[-1]
        else:
            country = parts[0]

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

    return {
        "job_id": job_id,
        "url": url,
        "title": title,
        "company": company,
        "company_url": company_url,
        "company_info": company_info,
        "location": location,
        "country": country,
        "description": description,
    }
