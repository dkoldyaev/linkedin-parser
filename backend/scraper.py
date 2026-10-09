import os
import re
import aiohttp
from typing import Any, Dict, Optional

PARSER_API_URL = os.environ.get("PARSER_API_URL", "http://parser-api:4000")

def extract_job_id(url: str) -> Optional[str]:
    """Extract a job ID using regex (synchronous)."""
    if not url:
        return None
    
    # LinkedIn patterns fallback
    for pattern in [
        r"currentJobId=(\d+)",
        r"/jobs/view/(?:[a-zA-Z0-9\-_]+?-)?(\d+)",
        r"jobPosting:(\d+)",
        r"/(\d{9,12})(?:[/?&#]|$)",
    ]:
        m = re.search(pattern, url)
        if m:
            return m.group(1)

    # Upwork pattern fallback
    m = re.search(r"(~[a-zA-Z0-9]+)", url)
    if m:
        return m.group(1)

    # Generic numeric fallback for other sites
    m = re.search(r"/(\d+)(?:[/?&#]|$)", url)
    if m:
        return m.group(1)

    return None

async def scrape_job(url: str, html: Optional[str] = None) -> Dict[str, Any]:
    """Parse a job posting using parser-api."""
    try:
        async with aiohttp.ClientSession() as session:
            payload = {"url": url}
            if html:
                payload["html"] = html
            async with session.post(f"{PARSER_API_URL}/api/parse", json=payload) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data
                else:
                    text = await resp.text()
                    raise RuntimeError(f"Parser API returned {resp.status}: {text}")
    except Exception as e:
        print(f"Error calling parser-api: {e}")
        raise e

# Provide shims for backwards compatibility
async def scrape_linkedin_job(url: str, html: Optional[str] = None) -> Dict[str, Any]:
    return await scrape_job(url, html)

async def scrape_upwork_job(url: str, html: Optional[str] = None) -> Dict[str, Any]:
    return await scrape_job(url, html)

async def scrape_universal_job(url: str, html: Optional[str] = None) -> Dict[str, Any]:
    return await scrape_job(url, html)
