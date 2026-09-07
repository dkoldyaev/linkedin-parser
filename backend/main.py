import os
import asyncio
import logging
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .database import engine, Base, get_db
from .models import Vacancy, AppSetting, VALID_STATUSES
from .schemas import (
    VacancyResponse,
    VacancyCreate,
    VacancyUpdate,
    BatchImportRequest,
    BatchImportResponse,
    ImportItemResult,
    SettingsResponse,
    SettingsUpdateRequest,
)
from .scraper import scrape_linkedin_job, extract_job_id
from .llm import analyze_vacancy_with_llm

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("linkedin_tracker")

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="LinkedIn Vacancy Tracker", version="1.0.0")

# CORS middleware for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/vacancies", response_model=List[VacancyResponse])
def list_vacancies(
    status_filter: Optional[str] = Query(None, alias="status"),
    tag: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Vacancy)

    if status_filter and status_filter in VALID_STATUSES:
        query = query.filter(Vacancy.status == status_filter)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Vacancy.title.ilike(search_fmt),
                Vacancy.company.ilike(search_fmt),
                Vacancy.location.ilike(search_fmt),
                Vacancy.description.ilike(search_fmt),
                Vacancy.ai_summary.ilike(search_fmt),
            )
        )

    vacancies = query.order_by(Vacancy.updated_at.desc()).all()

    if tag:
        tag_lower = tag.strip().lower()
        vacancies = [
            v for v in vacancies
            if any(t.lower() == tag_lower for t in (v.tags or []))
        ]

    return vacancies


@app.get("/api/vacancies/{vacancy_id}", response_model=VacancyResponse)
def get_vacancy(vacancy_id: int, db: Session = Depends(get_db)):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return v


@app.post("/api/vacancies", response_model=VacancyResponse)
def create_vacancy(payload: VacancyCreate, db: Session = Depends(get_db)):
    v = Vacancy(**payload.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@app.patch("/api/vacancies/{vacancy_id}", response_model=VacancyResponse)
def update_vacancy(vacancy_id: int, payload: VacancyUpdate, db: Session = Depends(get_db)):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"
        )

    for field, val in update_data.items():
        setattr(v, field, val)

    db.commit()
    db.refresh(v)
    return v


@app.delete("/api/vacancies/{vacancy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vacancy(vacancy_id: int, db: Session = Depends(get_db)):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    db.delete(v)
    db.commit()
    return None


@app.post("/api/vacancies/batch", response_model=BatchImportResponse)
async def batch_import_vacancies(payload: BatchImportRequest, db: Session = Depends(get_db)):
    """
    Parse a list of LinkedIn URLs, analyze with LLM, and store in DB.
    """
    results: List[ImportItemResult] = []
    imported_count = 0
    failed_count = 0

    # Filter out blank lines and duplicates
    unique_urls = []
    seen = set()
    for raw_url in payload.urls:
        u = raw_url.strip()
        if u and u not in seen:
            seen.add(u)
            unique_urls.append(u)

    for url in unique_urls:
        try:
            job_id = extract_job_id(url)
            
            # Check if vacancy with same job_id or url already exists
            existing = None
            if job_id:
                existing = db.query(Vacancy).filter(Vacancy.job_id == job_id).first()
            if not existing:
                existing = db.query(Vacancy).filter(Vacancy.url == url).first()

            # Scrape vacancy
            scraped = await scrape_linkedin_job(url)
            
            # Run LLM summarization
            llm_res = await analyze_vacancy_with_llm(
                title=scraped["title"],
                company=scraped["company"],
                location=scraped["location"],
                description=scraped["description"],
                db=db,
            )

            # Combine tags
            initial_tags = list(payload.default_tags)

            if existing:
                # Update existing vacancy
                existing.title = scraped["title"]
                existing.company = scraped["company"]
                existing.company_url = scraped["company_url"]
                existing.company_info = llm_res.get("company_info") or scraped.get("company_info")
                existing.location = scraped["location"]
                existing.country = scraped["country"]
                existing.description = scraped["description"]
                existing.ai_summary = llm_res.get("summary")
                existing.tech_stack = llm_res.get("tech_stack", [])
                
                # Merge tags without duplicating
                current_tags = set(existing.tags or [])
                for t in initial_tags:
                    current_tags.add(t)
                existing.tags = list(current_tags)
                
                db.commit()
                db.refresh(existing)
                
                results.append(ImportItemResult(
                    url=url,
                    job_id=job_id,
                    success=True,
                    title=existing.title,
                    company=existing.company,
                    vacancy_id=existing.id,
                ))
                imported_count += 1
            else:
                # Create new vacancy
                new_v = Vacancy(
                    job_id=scraped.get("job_id"),
                    url=url,
                    title=scraped["title"],
                    company=scraped["company"],
                    company_url=scraped["company_url"],
                    company_info=llm_res.get("company_info") or scraped.get("company_info"),
                    location=scraped["location"],
                    country=scraped["country"],
                    description=scraped["description"],
                    ai_summary=llm_res.get("summary"),
                    tech_stack=llm_res.get("tech_stack", []),
                    tags=initial_tags,
                    status="Еще не написан",
                )
                db.add(new_v)
                db.commit()
                db.refresh(new_v)

                results.append(ImportItemResult(
                    url=url,
                    job_id=job_id,
                    success=True,
                    title=new_v.title,
                    company=new_v.company,
                    vacancy_id=new_v.id,
                ))
                imported_count += 1

        except Exception as e:
            logger.error(f"Failed to process vacancy {url}: {e}", exc_info=True)
            results.append(ImportItemResult(
                url=url,
                job_id=extract_job_id(url),
                success=False,
                error=str(e),
            ))
            failed_count += 1

    return BatchImportResponse(
        total=len(unique_urls),
        imported=imported_count,
        failed=failed_count,
        results=results,
    )


@app.post("/api/vacancies/{vacancy_id}/resummarize", response_model=VacancyResponse)
async def resummarize_vacancy(vacancy_id: int, db: Session = Depends(get_db)):
    """Re-run LLM summarization for an existing vacancy."""
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    llm_res = await analyze_vacancy_with_llm(
        title=v.title,
        company=v.company,
        location=v.location or "",
        description=v.description or "",
        db=db,
    )

    if llm_res.get("summary"):
        v.ai_summary = llm_res["summary"]
    if llm_res.get("tech_stack"):
        v.tech_stack = llm_res["tech_stack"]
    if llm_res.get("company_info"):
        v.company_info = llm_res["company_info"]

    db.commit()
    db.refresh(v)
    return v


@app.get("/api/tags", response_model=List[str])
def list_unique_tags(db: Session = Depends(get_db)):
    vacancies = db.query(Vacancy).all()
    all_tags = set()
    for v in vacancies:
        for t in (v.tags or []):
            if t and t.strip():
                all_tags.add(t.strip())
    return sorted(list(all_tags))


@app.get("/api/settings", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    def _val(key: str, env_default: str = ""):
        setting = db.query(AppSetting).filter(AppSetting.key == key).first()
        if setting and setting.value is not None:
            return setting.value
        return os.getenv(key.upper(), env_default)

    provider = _val("llm_provider", "mistral")
    mistral_key = _val("mistral_api_key", "")
    gemini_key = _val("gemini_api_key", "")
    mistral_model = _val("mistral_model", "mistral-small-latest")
    gemini_model = _val("gemini_model", "gemini-2.5-flash")

    return SettingsResponse(
        llm_provider=provider,
        mistral_api_key_set=bool(mistral_key),
        mistral_model=mistral_model,
        gemini_api_key_set=bool(gemini_key),
        gemini_model=gemini_model,
    )


@app.post("/api/settings", response_model=SettingsResponse)
def update_settings(payload: SettingsUpdateRequest, db: Session = Depends(get_db)):
    def _set(k: str, v: Optional[str]):
        if v is not None:
            setting = db.query(AppSetting).filter(AppSetting.key == k).first()
            if not setting:
                setting = AppSetting(key=k, value=v)
                db.add(setting)
            else:
                setting.value = v

    if payload.llm_provider:
        _set("llm_provider", payload.llm_provider.lower())
    if payload.mistral_api_key is not None:
        _set("mistral_api_key", payload.mistral_api_key.strip())
    if payload.mistral_model is not None:
        _set("mistral_model", payload.mistral_model.strip())
    if payload.gemini_api_key is not None:
        _set("gemini_api_key", payload.gemini_api_key.strip())
    if payload.gemini_model is not None:
        _set("gemini_model", payload.gemini_model.strip())

    db.commit()
    return get_settings(db)


# Static files mount for built React frontend
STATIC_DIR = os.getenv("STATIC_DIR", os.path.join(os.path.dirname(__file__), "../frontend/dist"))
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        # Don't hijack API routes
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not found")
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
