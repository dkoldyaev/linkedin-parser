"""Indeed job vacancy parser."""

import logging
import re
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse

from bs4 import BeautifulSoup

from ..location_parser import normalize_country, parse_location
from .helpers import (
    clean_text,
    clean_url_params,
    extract_canonical_url,
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
class IndeedParser(BaseParser):
    """Parser for Indeed vacancies (indeed.com and localized domains)."""

    name = "indeed"
    source = "Indeed"
    priority = 10
    needs_extension = True

    def matches(self, url: str) -> bool:
        if not url:
            return False
        return "indeed." in url.lower()

    def _extract_job_id(self, url: str) -> Optional[str]:
        if not url:
            return None
        # Check jk= or vjk= parameter
        m = re.search(r"[?&](?:jk|vjk)=([a-f0-9]+)", url, re.I)
        if m:
            return m.group(1)
        # Check path pattern /viewjob/... or /job/...-([a-f0-9]{16})
        m = re.search(r"/(?:viewjob|job)/(?:[^\s/?#]*-)?([a-f0-9]{16})(?:[/?#]|$)", url, re.I)
        if m:
            return m.group(1)
        # Check /rc/clk?jk=...
        m = re.search(r"/rc/clk\?.*?[?&]jk=([a-f0-9]+)", url, re.I)
        if m:
            return m.group(1)
        return None

    def normalize_url(self, url: str, html: Optional[str] = None) -> str:
        effective_url = url
        if html:
            canonical = extract_canonical_url(html)
            if canonical:
                effective_url = canonical

        jid = self._extract_job_id(effective_url) or self._extract_job_id(url)
        if jid:
            try:
                parsed = urlparse(effective_url if "://" in effective_url else f"https://{effective_url}")
                hostname = parsed.netloc or "www.indeed.com"
                return f"https://{hostname}/viewjob?jk={jid}"
            except Exception:
                return f"https://www.indeed.com/viewjob?jk={jid}"

        return clean_url_params(effective_url)

    async def parse(self, url: str, html: Optional[str] = None) -> VacancyData:
        url = self.normalize_url(url, html)
        job_id = self._extract_job_id(url)

        if not html:
            fetched = await fetch_html(url)
            if not fetched:
                return VacancyData(
                    url=url,
                    source=self.source,
                    job_id=job_id,
                    title=None,
                    company=None,
                    description=None,
                    is_closed=False,
                )
            html = fetched

        soup = BeautifulSoup(html, "html.parser")
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
            elif isinstance(hiring_org, str):
                company = hiring_org

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
                elif isinstance(addr, str):
                    raw_location = addr
                    p_city, p_country = parse_location(raw_location)
                    city = city or p_city
                    country = country or p_country

            if jld.get("jobLocationType") == "TELECOMMUTE":
                workplace_type = "remote"

            valid_through = jld.get("validThrough")
            if valid_through:
                try:
                    vt = datetime.fromisoformat(valid_through.replace("Z", "+00:00"))
                    if vt < datetime.now(timezone.utc):
                        is_closed = True
                except Exception:
                    pass

        # DOM Fallbacks
        if not title:
            h1 = soup.select_one(
                '[data-testid="jobsearch-JobInfoHeader-title"], h1.jobsearch-JobInfoHeader-title, h1'
            )
            title = h1.get_text(strip=True) if h1 else None

        if not company:
            comp_el = soup.select_one(
                '[data-testid="inlineHeader-companyName"], [data-testid="company-name"]'
            )
            if comp_el:
                company = comp_el.get_text(" ", strip=True)
                comp_link = comp_el.find("a")
                if comp_link and comp_link.get("href"):
                    company_url = comp_link.get("href")

        if not raw_location:
            loc_el = soup.select_one(
                '[data-testid="inlineHeader-companyLocation"], [data-testid="jobsearch-JobInfoHeader-companyLocation"]'
            )
            if loc_el:
                raw_location = loc_el.get_text(" ", strip=True)
                p_city, p_country = parse_location(raw_location)
                city = city or p_city or None
                country = country or p_country or None

        if not description:
            desc_el = soup.select_one(
                '#jobDescriptionText, [data-testid="jobsearch-JobComponent-description"]'
            )
            if desc_el:
                description = clean_text(desc_el)

        if not salary_min and not salary_max:
            sal_el = soup.select_one(
                '#salaryInfoAndJobType, [data-testid="jobsearch-JobMetadataHeader-item"], [data-testid="jobsearch-OtherJobDetailsContainer"]'
            )
            if sal_el:
                sal_data = parse_salary_string(sal_el.get_text(" ", strip=True))
                salary_min = sal_data.get("salary_min")
                salary_max = sal_data.get("salary_max")
                salary_currency = sal_data.get("salary_currency")
                salary_period = sal_data.get("salary_period")

        # Workplace inference
        if not workplace_type:
            # Check international remote/hybrid indicators (EN, DE, ES, FR)
            for text_source in [title, raw_location, description, html]:
                if text_source:
                    w = normalize_workplace(text_source)
                    if w:
                        workplace_type = w
                        break
                    ts_lower = text_source.lower()
                    if any(
                        k in ts_lower
                        for k in (
                            "homeoffice", "mobiles arbeiten", "telearbeit", "remote", "wfh",
                            "teletrabajo", "en remoto", "remoto", "télétravail"
                        )
                    ):
                        workplace_type = "remote"
                        break
                    if any(k in ts_lower for k in ("hybrid", "híbrido", "hybride")):
                        workplace_type = "hybrid"
                        break
                    if any(k in ts_lower for k in ("on-site", "onsite", "presencial", "sur site", "vor ort")):
                        workplace_type = "on-site"
                        break

        # Status check
        if not is_closed:
            if '"isJobExpired":true' in html or '"isJobExpired": true' in html:
                is_closed = True
            else:
                body = soup.find("body")
                if body:
                    # Check visible text without scripts/styles
                    for s in body.find_all(["script", "style", "noscript"]):
                        s.extract()
                    if body.find(
                        string=re.compile(
                            r"this job has expired|this job is closed|no longer accepting applications|"
                            r"diese stelle ist abgelaufen|stellenanzeige ist abgelaufen|"
                            r"este empleo ha expirado|esta oferta ya no está disponible|oferta de empleo cerrada|"
                            r"cette offre a expiré|cette offre n'est plus disponible",
                            re.I,
                        )
                    ):
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
