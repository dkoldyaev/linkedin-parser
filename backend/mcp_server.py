"""Model Context Protocol (MCP) Server for LinkedIn Parser & Kanban Tracker.

Allows AI assistants (Claude Desktop, Cursor, Antigravity, etc.) to interact
with the Job Tracker: view vacancies, move cards across Kanban stages, import
new vacancies via URL, update notes/tags, and run AI summaries.
"""

import os
import sys
import json
import logging
import argparse
from typing import Optional, List, Dict, Any

import httpx
from mcp.server.mcpserver import MCPServer

logger = logging.getLogger("job_tracker_mcp")

# Environment / Defaults
DEFAULT_APP_URL = os.getenv("JOB_TRACKER_URL", os.getenv("APP_URL", "http://localhost:8000")).rstrip("/")
DEFAULT_API_KEY = os.getenv("JOB_TRACKER_API_KEY", os.getenv("JOB_TRACKER_TOKEN", os.getenv("API_KEY", ""))).strip()

mcp = MCPServer("job-tracker")


class JobTrackerClient:
    def __init__(self, base_url: str = DEFAULT_APP_URL, api_key: str = DEFAULT_API_KEY):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def _request(self, method: str, path: str, **kwargs) -> Any:
        url = f"{self.base_url}{path}"
        headers = {**self._get_headers(), **kwargs.pop("headers", {})}
        timeout = kwargs.pop("timeout", 30.0)

        async with httpx.AsyncClient(timeout=timeout) as client:
            try:
                res = await client.request(method, url, headers=headers, **kwargs)
            except httpx.ConnectError:
                raise RuntimeError(
                    f"Could not connect to Job Tracker backend at {self.base_url}. "
                    "Make sure the application server is running."
                )
            except Exception as e:
                raise RuntimeError(f"HTTP request to Job Tracker failed: {e}")

            if res.status_code == 401:
                raise RuntimeError(
                    "Authentication failed (401 Unauthorized). "
                    "Please provide a valid JOB_TRACKER_API_KEY. "
                    "You can generate one in Job Tracker -> Settings -> MCP / API Tokens."
                )
            if res.status_code == 404:
                raise RuntimeError(f"Resource not found (404) at {path}")
            if not res.is_success:
                error_detail = res.text
                try:
                    error_json = res.json()
                    error_detail = error_json.get("detail", error_detail)
                except Exception:
                    pass
                raise RuntimeError(f"Job Tracker API error ({res.status_code}): {error_detail}")

            if res.status_code == 204 or not res.content:
                return None
            return res.json()

    async def list_vacancies(self, **params) -> List[Dict[str, Any]]:
        clean_params = {k: v for k, v in params.items() if v is not None}
        return await self._request("GET", "/api/vacancies", params=clean_params)

    async def get_vacancy(self, vacancy_id: int) -> Dict[str, Any]:
        return await self._request("GET", f"/api/vacancies/{vacancy_id}")

    async def create_vacancy(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._request("POST", "/api/vacancies", json=data)

    async def update_vacancy(self, vacancy_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._request("PATCH", f"/api/vacancies/{vacancy_id}", json=data)

    async def delete_vacancy(self, vacancy_id: int) -> None:
        await self._request("DELETE", f"/api/vacancies/{vacancy_id}")

    async def add_history(self, vacancy_id: int, to_status: str, comment: Optional[str] = None) -> Dict[str, Any]:
        return await self._request(
            "POST",
            f"/api/vacancies/{vacancy_id}/history",
            json={"to_status": to_status, "comment": comment},
        )

    async def import_batch(self, urls: List[str]) -> Dict[str, Any]:
        return await self._request("POST", "/api/vacancies/batch", json={"urls": urls}, timeout=60.0)

    async def check_duplicates(self, urls: List[str]) -> Dict[str, Any]:
        return await self._request("POST", "/api/vacancies/check-duplicates", json={"urls": urls})

    async def resummarize(self, vacancy_id: int) -> Dict[str, Any]:
        return await self._request("POST", f"/api/vacancies/{vacancy_id}/resummarize", timeout=60.0)

    async def reparse(self, vacancy_id: int) -> Dict[str, Any]:
        return await self._request("POST", f"/api/vacancies/{vacancy_id}/reparse", timeout=60.0)

    async def get_stats(self) -> Dict[str, Any]:
        return await self._request("GET", "/api/stats")

    async def get_columns(self) -> List[Dict[str, Any]]:
        return await self._request("GET", "/api/columns")

    async def get_tags(self) -> List[str]:
        return await self._request("GET", "/api/tags")

    async def get_sources(self) -> List[str]:
        return await self._request("GET", "/api/sources")


client = JobTrackerClient()


def set_client(base_url: str, api_key: str):
    global client
    client = JobTrackerClient(base_url=base_url, api_key=api_key)


# ==========================================
# MCP TOOLS
# ==========================================

@mcp.tool()
async def list_vacancies(
    status: Optional[str] = None,
    search: Optional[str] = None,
    tag: Optional[str] = None,
    city: Optional[str] = None,
    country: Optional[str] = None,
    source: Optional[str] = None,
    is_closed: Optional[bool] = None,
    limit: int = 50,
) -> str:
    """List tracked job vacancies with filtering options.

    Args:
        status: Filter by Kanban status (e.g. 'Еще не написан', 'Написал', 'Собеседование', 'Тестовое', 'Оффер', 'Отказ').
        search: Free-text search term in title, company, or tech stack.
        tag: Filter by tag/label.
        city: Filter by city.
        country: Filter by country.
        source: Filter by source board (e.g. 'LinkedIn', 'Habr Career', 'HeadHunter', 'Upwork', 'Avito').
        is_closed: Filter closed (inactive) jobs.
        limit: Max vacancies to return (default 50).
    """
    params = {
        "status": status,
        "search": search,
        "tag": tag,
        "city": city,
        "country": country,
        "source": source,
        "is_closed": is_closed,
    }
    vacancies = await client.list_vacancies(**params)
    if limit and len(vacancies) > limit:
        vacancies = vacancies[:limit]

    if not vacancies:
        return "No vacancies found matching the specified criteria."

    lines = [f"Found {len(vacancies)} vacancy(ies):\n"]
    for v in vacancies:
        sal_parts = []
        if v.get("salary_min") is not None:
            sal_parts.append(f"from {v['salary_min']}")
        if v.get("salary_max") is not None:
            sal_parts.append(f"to {v['salary_max']}")
        curr = v.get("salary_currency") or ""
        period = f"/{v.get('salary_period')}" if v.get("salary_period") else ""
        salary_str = f"{' '.join(sal_parts)} {curr}{period}".strip() if sal_parts else "Not specified"

        tags_str = ", ".join(v.get("tags") or []) or "None"
        tech_str = ", ".join(v.get("tech_stack") or []) or "None"

        lines.append(
            f"• [ID: {v['id']}] {v.get('title', 'Untitled')} @ {v.get('company', 'Unknown')}\n"
            f"  Status: {v.get('status')} | Source: {v.get('source') or 'Direct'} | Location: {v.get('location') or 'Not specified'}\n"
            f"  Salary: {salary_str} | Workplace: {v.get('workplace_type') or 'Not specified'}\n"
            f"  Tags: {tags_str} | Tech Stack: {tech_str}\n"
            f"  URL: {v.get('url')}\n"
        )
    return "\n".join(lines)


@mcp.tool()
async def get_vacancy(vacancy_id: int) -> str:
    """Get full details of a specific job vacancy by ID.

    Args:
        vacancy_id: Unique integer ID of the vacancy.
    """
    v = await client.get_vacancy(vacancy_id)
    tags_str = ", ".join(v.get("tags") or []) or "None"
    tech_str = ", ".join(v.get("tech_stack") or []) or "None"

    sal_parts = []
    if v.get("salary_min") is not None:
        sal_parts.append(f"from {v['salary_min']}")
    if v.get("salary_max") is not None:
        sal_parts.append(f"to {v['salary_max']}")
    curr = v.get("salary_currency") or ""
    period = f"/{v.get('salary_period')}" if v.get("salary_period") else ""
    salary_str = f"{' '.join(sal_parts)} {curr}{period}".strip() if sal_parts else "Not specified"

    history_lines = []
    for h in v.get("history") or []:
        from_st = h.get("from_status") or "Initial"
        to_st = h.get("to_status")
        comment = f" - '{h.get('comment')}'" if h.get("comment") else ""
        history_lines.append(f"  • {h.get('created_at', '')[:16]}: {from_st} → {to_st}{comment}")
    history_str = "\n".join(history_lines) if history_lines else "  No transitions recorded yet."

    return (
        f"Vacancy Details (ID: {v['id']})\n"
        f"================================\n"
        f"Title: {v.get('title')}\n"
        f"Company: {v.get('company')}\n"
        f"URL: {v.get('url')}\n"
        f"Company URL: {v.get('company_url') or 'N/A'}\n"
        f"Source: {v.get('source') or 'N/A'}\n"
        f"Status: {v.get('status')} (Lane: {v.get('lane', 0)})\n"
        f"Location: {v.get('location') or 'N/A'} (City: {v.get('city') or 'N/A'}, Country: {v.get('country') or 'N/A'})\n"
        f"Workplace Type: {v.get('workplace_type') or 'N/A'}\n"
        f"Closed/Archived: {'Yes' if v.get('is_closed') else 'No'}\n"
        f"Salary: {salary_str}\n"
        f"Tags: {tags_str}\n"
        f"Tech Stack: {tech_str}\n\n"
        f"AI Summary:\n{v.get('ai_summary') or 'No AI summary generated.'}\n\n"
        f"Company Info:\n{v.get('company_info') or 'No company info available.'}\n\n"
        f"Personal Notes:\n{v.get('notes') or 'No notes.'}\n\n"
        f"Status History:\n{history_str}\n\n"
        f"Full Description:\n{v.get('description') or 'No description available.'}"
    )


@mcp.tool()
async def create_vacancy(
    url: str,
    title: str,
    company: str,
    description: Optional[str] = None,
    location: Optional[str] = None,
    status: str = "Еще не написан",
    notes: Optional[str] = None,
    tags: Optional[List[str]] = None,
    salary_min: Optional[float] = None,
    salary_max: Optional[float] = None,
    salary_currency: Optional[str] = None,
    salary_period: Optional[str] = None,
    workplace_type: Optional[str] = None,
) -> str:
    """Manually create a new vacancy card in the job tracker.

    Args:
        url: Job posting URL.
        title: Position/Job title.
        company: Company name.
        description: Job description text.
        location: Location string (e.g. 'Berlin, Germany' or 'Remote').
        status: Initial Kanban column (default 'Еще не написан').
        notes: Personal notes or recruiter contact information.
        tags: List of colored tag labels.
        salary_min: Minimum salary.
        salary_max: Maximum salary.
        salary_currency: Currency symbol or code (e.g. '$', '€', 'USD', 'RUB').
        salary_period: Period ('year', 'month', 'hour').
        workplace_type: 'remote', 'hybrid', or 'on-site'.
    """
    payload = {
        "url": url,
        "title": title,
        "company": company,
        "description": description,
        "location": location,
        "status": status,
        "notes": notes,
        "tags": tags or [],
        "salary_min": salary_min,
        "salary_max": salary_max,
        "salary_currency": salary_currency,
        "salary_period": salary_period,
        "workplace_type": workplace_type,
    }
    clean_payload = {k: v for k, v in payload.items() if v is not None}
    created = await client.create_vacancy(clean_payload)
    return (
        f"Successfully created vacancy ID {created['id']}:\n"
        f"• Title: {created.get('title')}\n"
        f"• Company: {created.get('company')}\n"
        f"• Status: {created.get('status')}\n"
        f"• URL: {created.get('url')}"
    )


@mcp.tool()
async def import_vacancies(urls: List[str]) -> str:
    """Import vacancies by URL. Scrapes job details and runs AI summarization.

    Supported boards include LinkedIn, HeadHunter, Habr Career, Avito, Upwork,
    Glassdoor, SuperJob, Rabota.ru, Layboard, GeekJob, FL.ru, etc.

    Args:
        urls: List of job URLs to import.
    """
    if not urls:
        return "No URLs provided to import."

    res = await client.import_batch(urls)
    queued = res.get("queued", 0)
    batch_id = res.get("batch_id", "")
    message = res.get("message", "Batch import scheduled")

    return (
        f"Import initiated for {len(urls)} vacancy URL(s).\n"
        f"• Status: {res.get('status')}\n"
        f"• Queued: {queued}\n"
        f"• Batch ID: {batch_id}\n"
        f"• Details: {message}"
    )


@mcp.tool()
async def update_vacancy(
    vacancy_id: int,
    status: Optional[str] = None,
    status_comment: Optional[str] = None,
    notes: Optional[str] = None,
    tags: Optional[List[str]] = None,
    title: Optional[str] = None,
    company: Optional[str] = None,
    location: Optional[str] = None,
    salary_min: Optional[float] = None,
    salary_max: Optional[float] = None,
    salary_currency: Optional[str] = None,
    salary_period: Optional[str] = None,
    is_closed: Optional[bool] = None,
    lane: Optional[int] = None,
) -> str:
    """Update fields of an existing vacancy (status, notes, tags, salary, etc.).

    Args:
        vacancy_id: ID of the vacancy to update.
        status: Move to new Kanban column (e.g. 'Еще не написан', 'Написал', 'Собеседование', 'Тестовое', 'Оффер', 'Отказ').
        status_comment: Comment for the status history entry.
        notes: Updated personal notes.
        tags: Updated list of tags.
        title: Updated title.
        company: Updated company.
        location: Updated location.
        salary_min: Updated min salary.
        salary_max: Updated max salary.
        salary_currency: Currency.
        salary_period: Period.
        is_closed: Mark vacancy as closed or open.
        lane: Sub-lane / swimlane index within column.
    """
    payload = {
        "status": status,
        "status_comment": status_comment,
        "notes": notes,
        "tags": tags,
        "title": title,
        "company": company,
        "location": location,
        "salary_min": salary_min,
        "salary_max": salary_max,
        "salary_currency": salary_currency,
        "salary_period": salary_period,
        "is_closed": is_closed,
        "lane": lane,
    }
    clean_payload = {k: v for k, v in payload.items() if v is not None}
    if not clean_payload:
        return "No update parameters provided."

    updated = await client.update_vacancy(vacancy_id, clean_payload)
    return (
        f"Vacancy {updated['id']} updated successfully:\n"
        f"• Title: {updated.get('title')}\n"
        f"• Company: {updated.get('company')}\n"
        f"• Status: {updated.get('status')}\n"
        f"• Tags: {', '.join(updated.get('tags') or [])}\n"
        f"• Notes: {updated.get('notes') or 'None'}"
    )


@mcp.tool()
async def delete_vacancy(vacancy_id: int) -> str:
    """Delete a vacancy from the tracker.

    Args:
        vacancy_id: ID of the vacancy to delete.
    """
    await client.delete_vacancy(vacancy_id)
    return f"Vacancy {vacancy_id} has been permanently deleted."


@mcp.tool()
async def add_status_history(vacancy_id: int, to_status: str, comment: Optional[str] = None) -> str:
    """Record a status progression or log entry in the vacancy's history.

    Args:
        vacancy_id: ID of the vacancy.
        to_status: Target status name.
        comment: Description/comment (e.g. 'Passed 1st HR screen, scheduled technical interview for Thursday').
    """
    updated = await client.add_history(vacancy_id, to_status, comment)
    return (
        f"Status change recorded for vacancy {vacancy_id}:\n"
        f"• Current Status: {updated.get('status')}\n"
        f"• Comment: {comment or 'No comment'}"
    )


@mcp.tool()
async def resummarize_vacancy(vacancy_id: int) -> str:
    """Trigger AI re-analysis (LLM summary and tech stack extraction) for a vacancy.

    Args:
        vacancy_id: ID of the vacancy.
    """
    updated = await client.resummarize(vacancy_id)
    return (
        f"AI re-analysis completed for vacancy {vacancy_id}:\n"
        f"• Tech Stack: {', '.join(updated.get('tech_stack') or [])}\n"
        f"• Summary: {updated.get('ai_summary')}"
    )


@mcp.tool()
async def reparse_vacancy(vacancy_id: int) -> str:
    """Refetch and reparse vacancy content from original website URL.

    Args:
        vacancy_id: ID of the vacancy.
    """
    res = await client.reparse(vacancy_id)
    return f"Reparsing scheduled for vacancy {vacancy_id}: {res}"


@mcp.tool()
async def get_stats() -> str:
    """Get overall job application funnel statistics and conversion rates."""
    stats = await client.get_stats()
    return f"Job Application Statistics:\n{json.dumps(stats, indent=2, ensure_ascii=False)}"


@mcp.tool()
async def get_columns() -> str:
    """Get the active Kanban board columns and their configurations."""
    cols = await client.get_columns()
    lines = ["Active Kanban Columns:"]
    for c in cols:
        lanes_flag = " (has sub-lanes)" if c.get("has_lanes") else ""
        lines.append(f"• '{c.get('id')}' [Color: {c.get('color')}]{lanes_flag}")
    return "\n".join(lines)


@mcp.tool()
async def get_tags() -> str:
    """Get all unique tags used across tracked vacancies."""
    tags = await client.get_tags()
    if not tags:
        return "No tags currently defined."
    return "Existing tags:\n" + ", ".join(tags)


@mcp.tool()
async def check_duplicates(urls: List[str]) -> str:
    """Check if any of the given URLs have already been imported into the tracker.

    Args:
        urls: List of job URLs to verify.
    """
    dupes = await client.check_duplicates(urls)
    duplicates = dupes.get("duplicates", [])
    if not duplicates:
        return f"None of the {len(urls)} URLs are currently in the tracker."

    lines = [f"Found {len(duplicates)} duplicate(s):"]
    for d in duplicates:
        lines.append(f"• URL: {d.get('url')} -> Already imported as ID {d.get('id')}: '{d.get('title')}' @ '{d.get('company')}'")
    return "\n".join(lines)


# ==========================================
# MCP RESOURCES
# ==========================================

@mcp.resource("job-tracker://vacancies")
async def resource_vacancies() -> str:
    """Current list of all tracked vacancies in JSON format."""
    vacancies = await client.list_vacancies(limit=200)
    return json.dumps(vacancies, indent=2, ensure_ascii=False)


@mcp.resource("job-tracker://stats")
async def resource_stats() -> str:
    """Recruitment funnel statistics in JSON format."""
    stats = await client.get_stats()
    return json.dumps(stats, indent=2, ensure_ascii=False)


@mcp.resource("job-tracker://columns")
async def resource_columns() -> str:
    """Current Kanban column configurations in JSON format."""
    cols = await client.get_columns()
    return json.dumps(cols, indent=2, ensure_ascii=False)


def main():
    parser = argparse.ArgumentParser(description="Job Tracker MCP Server")
    parser.add_argument(
        "--url",
        default=DEFAULT_APP_URL,
        help=f"Base URL of Job Tracker backend (default: {DEFAULT_APP_URL})",
    )
    parser.add_argument(
        "--api-key",
        default=DEFAULT_API_KEY,
        help="API Key / Token generated in Job Tracker settings",
    )
    parser.add_argument(
        "--transport",
        choices=["stdio", "sse", "streamable-http"],
        default="stdio",
        help="MCP transport type (default: stdio)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8001,
        help="Port to listen on when using SSE or streamable-http (default: 8001)",
    )

    args = parser.parse_args()

    set_client(base_url=args.url, api_key=args.api_key)

    if args.transport == "stdio":
        mcp.run(transport="stdio")
    elif args.transport == "sse":
        mcp.run(transport="sse", port=args.port)
    elif args.transport == "streamable-http":
        mcp.run(transport="streamable-http", port=args.port)


if __name__ == "__main__":
    main()
