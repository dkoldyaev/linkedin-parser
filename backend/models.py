import datetime
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, JSON, Boolean, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from .database import Base

STATUS_NOT_CONTACTED = "Еще не написал"
STATUS_CONTACTED = "Написал"
STATUS_INTERVIEW = "Собеседование"
STATUS_ASSESSMENT = "Тестовое"
STATUS_OFFER = "Оффер"
STATUS_REJECTED = "Отказ"

DEFAULT_COLUMNS = [
    {"id": STATUS_NOT_CONTACTED, "color": "#6366f1", "has_lanes": False, "is_base": True},
    {"id": STATUS_CONTACTED, "color": "#0284c7", "has_lanes": False, "is_base": False},
    {"id": STATUS_INTERVIEW, "color": "#d97706", "has_lanes": True, "is_base": False},
    {"id": STATUS_ASSESSMENT, "color": "#9333ea", "has_lanes": True, "is_base": False},
    {"id": STATUS_OFFER, "color": "#059669", "has_lanes": False, "is_base": False},
    {"id": STATUS_REJECTED, "color": "#ef4444", "has_lanes": False, "is_base": True},
]

BASE_STATUSES = [STATUS_NOT_CONTACTED, STATUS_REJECTED]

VALID_STATUSES = [col["id"] for col in DEFAULT_COLUMNS]

# Predefined constant feature flags
FEATURE_FLAG_API_ACCESS = "api_access"
FEATURE_FLAG_ADMIN = "admin"

KNOWN_FEATURE_FLAGS = [
    FEATURE_FLAG_API_ACCESS,
    FEATURE_FLAG_ADMIN,
]

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String(128), unique=True, index=True, nullable=False)
    email = Column(String(256), unique=True, index=True, nullable=False)
    name = Column(String(256), nullable=False, default="")
    picture = Column(String(1024), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)
    last_board_interaction_at = Column(DateTime, nullable=True)
    is_anonymous = Column(Boolean, default=False, nullable=False)
    # Kept for backward compatibility if needed, but primary storage is user_feature_flags table
    feature_flags = Column(JSON, default=list)

    vacancies = relationship("Vacancy", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSetting", back_populates="user", cascade="all, delete-orphan")
    flags = relationship("UserFeatureFlag", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="user", cascade="all, delete-orphan")


class UserFeatureFlag(Base):
    __tablename__ = "user_feature_flags"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    flag = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "flag", name="uq_user_feature_flag"),
    )

    user = relationship("User", back_populates="flags")


class UserSetting(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    key = Column(String(128), nullable=False)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "key", name="uq_user_setting_key"),
    )

    user = relationship("User", back_populates="settings")


class Vacancy(Base):
    __tablename__ = "vacancies"
    __table_args__ = (
        Index("ix_vacancies_user_updated", "user_id", "updated_at", "id"),
        Index("ix_vacancies_user_created", "user_id", "created_at"),
        Index("ix_vacancies_user_job", "user_id", "job_id"),
        Index("ix_vacancies_user_url", "user_id", "url"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True)
    job_id = Column(String(64), index=True, nullable=True)
    url = Column(String(1024), nullable=False)
    title = Column(String(256), nullable=False, default="Untitled Vacancy")
    company = Column(String(256), nullable=False, default="Unknown Company")
    company_url = Column(String(1024), nullable=True)
    company_info = Column(Text, nullable=True)
    source = Column(String(64), nullable=True)  # Name of job board/source e.g. "Avito", "Habr Career"
    location = Column(String(256), nullable=True)
    city = Column(String(128), nullable=True)
    country = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)
    workplace_type = Column(String(32), nullable=True)  # "remote", "hybrid", "on-site"
    is_closed = Column(Boolean, default=False, nullable=False)

    # Salary fields (raw numeric values & period)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    salary_currency = Column(String(16), nullable=True)  # e.g. "$", "€", "₽", "USD"
    salary_period = Column(String(32), nullable=True)    # "year", "month", "hour", "week", "day"
    
    # AI-generated fields
    ai_summary = Column(Text, nullable=True)
    tech_stack = Column(JSON, default=list)  # list of strings e.g. ["Python", "Docker"]
    match_score = Column(Float, nullable=True)  # Compatibility score (0-100) with approved CV
    
    # Kanban & User organization
    status = Column(String(64), nullable=False, default=STATUS_NOT_CONTACTED)
    tags = Column(JSON, default=list)  # list of string labels
    notes = Column(Text, nullable=True)
    lane = Column(Integer, nullable=False, default=0, server_default="0")  # vertical section (swimlane) index within a Kanban column
    sort_order = Column(Float, nullable=True)  # manual position within a Kanban column (NULL = not ordered, shown on top)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="vacancies")
    history = relationship(
        "VacancyStatusHistory",
        back_populates="vacancy",
        cascade="all, delete-orphan",
        order_by="VacancyStatusHistory.created_at.asc()",
        lazy="selectin",
    )


class VacancyStatusHistory(Base):
    __tablename__ = "vacancy_status_history"
    __table_args__ = (Index("ix_history_vacancy_created", "vacancy_id", "created_at"),)

    id = Column(Integer, primary_key=True, index=True)
    vacancy_id = Column(Integer, ForeignKey("vacancies.id", ondelete="CASCADE"), nullable=False, index=True)
    from_status = Column(String(64), nullable=True)
    to_status = Column(String(64), nullable=False)
    from_lane = Column(Integer, nullable=True)
    to_lane = Column(Integer, nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    vacancy = relationship("Vacancy", back_populates="history")


class AppSetting(Base):
    __tablename__ = "settings"

    key = Column(String(128), primary_key=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ApprovedCV(Base):
    __tablename__ = "approved_cvs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    content = Column(Text, nullable=False)
    revision = Column(Integer, nullable=False, default=1)
    approved_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_approved_cv"),
    )

    user = relationship("User")


class VacancyCVAnalysis(Base):
    __tablename__ = "vacancy_cv_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    vacancy_id = Column(Integer, ForeignKey("vacancies.id", ondelete="CASCADE"), index=True, nullable=False)
    cv_revision = Column(Integer, nullable=False)
    scoring_policy_version = Column(String(32), nullable=False, default="v1.0")
    model_id = Column(String(128), nullable=False)
    overall_score = Column(Float, nullable=False)
    result = Column(JSON, nullable=False)
    adapted_cv = Column(JSON, nullable=True)  # Anonymized DeveloperCV payload tailored for this vacancy
    is_outdated = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "vacancy_id", name="uq_user_vacancy_analysis"),
    )

    user = relationship("User")
    vacancy = relationship("Vacancy")
    versions = relationship("AdaptedCVVersion", back_populates="analysis", cascade="all, delete-orphan", order_by="AdaptedCVVersion.version_number.desc()")


class AdaptedCVVersion(Base):
    __tablename__ = "adapted_cv_versions"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("vacancy_cv_analyses.id", ondelete="CASCADE"), index=True, nullable=False)
    version_number = Column(Integer, nullable=False)
    adapted_cv = Column(JSON, nullable=False)
    user_comment = Column(Text, nullable=True)  # User instructions/comment that produced this version
    parent_version_id = Column(Integer, ForeignKey("adapted_cv_versions.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    analysis = relationship("VacancyCVAnalysis", back_populates="versions")
    parent_version = relationship("AdaptedCVVersion", remote_side=[id])


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(128), nullable=False, default="Default API Key")
    key_hash = Column(String(64), unique=True, index=True, nullable=False)
    key_prefix = Column(String(16), nullable=False)  # e.g. "ak_..." first characters for display
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_used_at = Column(DateTime, nullable=True)
    request_count = Column(Integer, default=0, nullable=False, server_default="0")

    user = relationship("User", back_populates="api_keys")


class UserLLMTokenUsage(Base):
    __tablename__ = "user_llm_token_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    provider = Column(String(32), nullable=False)  # "mistral", "gemini"
    model = Column(String(64), nullable=True)
    operation = Column(String(64), nullable=False)  # "vacancy_summary", "cv_compatibility", "anonymize", "adapt_cv"
    prompt_tokens = Column(Integer, default=0, nullable=False)
    completion_tokens = Column(Integer, default=0, nullable=False)
    total_tokens = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User")



