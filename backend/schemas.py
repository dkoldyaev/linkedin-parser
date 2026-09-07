from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class VacancyBase(BaseModel):
    title: str
    company: str
    url: str
    job_id: Optional[str] = None
    company_url: Optional[str] = None
    company_info: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    ai_summary: Optional[str] = None
    tech_stack: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    status: str = "Еще не написан"
    notes: Optional[str] = None

class VacancyCreate(VacancyBase):
    pass

class VacancyUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    ai_summary: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    company_info: Optional[str] = None

class VacancyResponse(VacancyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BatchImportRequest(BaseModel):
    urls: List[str]
    default_tags: List[str] = Field(default_factory=list)

class ImportItemResult(BaseModel):
    url: str
    job_id: Optional[str] = None
    success: bool
    title: Optional[str] = None
    company: Optional[str] = None
    vacancy_id: Optional[int] = None
    error: Optional[str] = None

class BatchImportResponse(BaseModel):
    total: int
    imported: int
    failed: int
    results: List[ImportItemResult]

class SettingsResponse(BaseModel):
    llm_provider: str
    mistral_api_key_set: bool
    mistral_model: str
    gemini_api_key_set: bool
    gemini_model: str

class SettingsUpdateRequest(BaseModel):
    llm_provider: Optional[str] = None
    mistral_api_key: Optional[str] = None
    mistral_model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    gemini_model: Optional[str] = None
