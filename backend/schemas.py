from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    picture: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AuthConfigResponse(BaseModel):
    google_configured: bool
    google_client_id: Optional[str] = None
    dev_mode: bool = True

class DevLoginRequest(BaseModel):
    email: Optional[str] = "dev@local.user"
    name: Optional[str] = "Dev User"

class VacancyBase(BaseModel):
    title: str
    company: str
    url: str
    user_id: Optional[int] = None
    job_id: Optional[str] = None
    source: Optional[str] = None
    company_url: Optional[str] = None
    company_info: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    workplace_type: Optional[str] = None
    is_closed: bool = False
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    salary_period: Optional[str] = None
    ai_summary: Optional[str] = None
    tech_stack: List[str] = Field(default_factory=list)
    match_score: Optional[float] = None
    tags: List[str] = Field(default_factory=list)
    status: str = "Еще не написан"
    notes: Optional[str] = None

class VacancyCreate(VacancyBase):
    pass

class VacancyUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    source: Optional[str] = None
    description: Optional[str] = None
    workplace_type: Optional[str] = None
    is_closed: Optional[bool] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    salary_period: Optional[str] = None
    ai_summary: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    match_score: Optional[float] = None
    company_info: Optional[str] = None
    status_comment: Optional[str] = None

class VacancyHistoryItem(BaseModel):
    id: int
    vacancy_id: int
    from_status: Optional[str] = None
    to_status: str
    comment: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class VacancyHistoryUpdate(BaseModel):
    comment: Optional[str] = None

class VacancyHistoryCreate(BaseModel):
    to_status: str
    from_status: Optional[str] = None
    comment: Optional[str] = None

class VacancyReorderRequest(BaseModel):
    status: str
    ids: List[int]
    lane: int = 0

class VacancyResponse(VacancyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    sort_order: Optional[float] = None
    lane: int = 0
    history: List[VacancyHistoryItem] = Field(default_factory=list)

    class Config:
        from_attributes = True

class BatchImportRequest(BaseModel):
    urls: List[str]
    default_tags: List[str] = Field(default_factory=list)

class DuplicateVacancyInfo(BaseModel):
    id: int
    url: str
    input_url: str
    job_id: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None

class CheckDuplicatesRequest(BaseModel):
    urls: List[str]

class CheckDuplicatesResponse(BaseModel):
    has_duplicates: bool
    duplicates: List[DuplicateVacancyInfo]

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

class TaskInfo(BaseModel):
    task_id: str
    url: str
    status: str  # pending, processing, completed, failed
    stage: Optional[str] = None  # scraping, ai_analysis, completed, failed
    created_at: float
    vacancy_id: Optional[int] = None
    user_id: Optional[int] = None
    title: Optional[str] = None
    company: Optional[str] = None
    error: Optional[str] = None

class QueueStatusResponse(BaseModel):
    pending: int
    processing: int
    total_remaining: int
    completed: int
    failed: int
    pending_scrape: int = 0
    pending_ai: int = 0
    processing_scrape: int = 0
    processing_ai: int = 0
    recent_tasks: List[TaskInfo] = Field(default_factory=list)

class AsyncBatchImportResponse(BaseModel):
    status: str = "queued"
    queued: int
    batch_id: str
    message: str
    tasks: List[TaskInfo] = Field(default_factory=list)

class ColumnItem(BaseModel):
    id: str
    color: str = "#6366f1"
    has_lanes: bool = False
    is_base: bool = False

class ColumnCreateRequest(BaseModel):
    name: str
    color: Optional[str] = "#6366f1"
    has_lanes: bool = False

class ColumnUpdateRequest(BaseModel):
    new_name: Optional[str] = None
    color: Optional[str] = None
    has_lanes: Optional[bool] = None

class ColumnDeleteRequest(BaseModel):
    migrate_to_status: Optional[str] = "Еще не написан"

class ColumnsOrderRequest(BaseModel):
    columns: List[ColumnItem]

class SettingsResponse(BaseModel):
    llm_provider: str
    mistral_api_key_set: bool
    mistral_model: str
    gemini_api_key_set: bool
    gemini_model: str
    locale: str = "ru"
    salary_display_format: str = "month"
    columns: List[ColumnItem] = Field(default_factory=list)

class SettingsUpdateRequest(BaseModel):
    llm_provider: Optional[str] = None
    mistral_api_key: Optional[str] = None
    mistral_model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    gemini_model: Optional[str] = None
    locale: Optional[str] = None
    salary_display_format: Optional[str] = None
    columns: Optional[List[ColumnItem]] = None

class ExtensionParseRequest(BaseModel):
    url: str
    html: str

class ExtensionTaskResponse(BaseModel):
    task_id: str
    url: str

# --- CV Anonymization & Vacancy Matching Schemas ---

class AnonymizeCompaniesRequest(BaseModel):
    companies: List[str] = Field(..., min_length=1)

class CompanyReplacementItem(BaseModel):
    original: str
    replacement: str

class AnonymizeCompaniesResponse(BaseModel):
    replacements: List[CompanyReplacementItem]

class ApprovedCVCreate(BaseModel):
    content: str = Field(..., min_length=1)
    revision: int = Field(default=1, ge=1)

class ApprovedCVResponse(BaseModel):
    id: int
    user_id: int
    content: str
    revision: int
    approved_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MatchedRequirementItem(BaseModel):
    requirement: str
    evidence: str

class MissingRequirementItem(BaseModel):
    requirement: str
    severity: str
    reason: str

class CriticalGapItem(BaseModel):
    requirement: str
    reason: str

class SeniorityAssessmentData(BaseModel):
    status: str
    comment: str

class VacancyCVAnalysisResponse(BaseModel):
    id: int
    user_id: int
    vacancy_id: int
    cv_revision: int
    scoring_policy_version: str
    model_id: str
    overall_score: float
    llm_score: Optional[float] = None
    calculated_score: Optional[float] = None
    is_outdated: bool
    summary: str
    matched_requirements: List[MatchedRequirementItem] = Field(default_factory=list)
    missing_requirements: List[MissingRequirementItem] = Field(default_factory=list)
    critical_gaps: List[CriticalGapItem] = Field(default_factory=list)
    seniority_assessment: Optional[SeniorityAssessmentData] = None
    recommendations: List[str] = Field(default_factory=list)
    dimension_scores: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

