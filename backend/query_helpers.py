"""Dialect-aware filters; keep filtering before pagination."""
from sqlalchemy import func, select, literal, cast, JSON
from .models import Vacancy


def filter_tag(query, db, tag):
    if not tag:
        return query
    if db.bind.dialect.name == 'postgresql':
        tags = func.json_array_elements_text(cast(Vacancy.tags, JSON)).table_valued('value').render_derived()
    else:
        tags = func.json_each(Vacancy.tags).table_valued('value')
    matching = select(literal(1)).select_from(tags).where(func.lower(tags.c.value) == tag.strip().lower()).correlate(Vacancy)
    return query.filter(matching.exists())


def duplicate_response(db, user_id, urls):
    from sqlalchemy import or_
    from sqlalchemy.orm import noload
    from .scraper import normalize_url, extract_job_id
    from .schemas import CheckDuplicatesResponse, DuplicateVacancyInfo
    inputs = [(u.strip(), normalize_url(u.strip()) or u.strip()) for u in urls if u.strip()]
    all_urls = {value for pair in inputs for value in pair}
    jobs = {extract_job_id(canonical) or extract_job_id(raw) for raw, canonical in inputs}
    jobs.discard(None)
    rows = db.query(Vacancy).options(noload(Vacancy.history)).filter(
        Vacancy.user_id == user_id,
        or_(Vacancy.url.in_(all_urls), Vacancy.job_id.in_(jobs))).order_by(Vacancy.id).all() if inputs else []
    by_url = {row.url: row for row in reversed(rows)}
    by_job = {row.job_id: row for row in reversed(rows) if row.job_id}
    found, seen = [], set()
    for raw, canonical in inputs:
        job_id = extract_job_id(canonical) or extract_job_id(raw)
        row = by_job.get(job_id) or by_url.get(canonical) or by_url.get(raw)
        if row and row.id not in seen:
            seen.add(row.id)
            found.append(DuplicateVacancyInfo(id=row.id, url=row.url, input_url=raw, job_id=row.job_id,
                                             title=row.title, company=row.company, status=row.status))
    from backend.parsers.registry import registry as parser_registry
    requires_extension = False
    for raw, canonical in inputs:
        p = parser_registry.find(canonical) or parser_registry.find(raw)
        if p and getattr(p, "needs_extension", False):
            requires_extension = True
            break
    return CheckDuplicatesResponse(
        has_duplicates=bool(found),
        duplicates=found,
        requires_extension=requires_extension,
    )


def local_date(column, dialect, tz_offset):
    import datetime
    from sqlalchemy import Date
    if dialect == 'postgresql':
        return cast(column + datetime.timedelta(minutes=-tz_offset), Date)
    return func.date(column, f"{-tz_offset} minutes")
