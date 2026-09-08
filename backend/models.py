import datetime
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, JSON, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

VALID_STATUSES = [
    "Еще не написан",
    "Написал",
    "Собеседование",
    "Тестовое",
    "Оффер",
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

    vacancies = relationship("Vacancy", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSetting", back_populates="user", cascade="all, delete-orphan")


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

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True)
    job_id = Column(String(64), index=True, nullable=True)
    url = Column(String(1024), nullable=False)
    title = Column(String(256), nullable=False, default="Untitled Vacancy")
    company = Column(String(256), nullable=False, default="Unknown Company")
    company_url = Column(String(1024), nullable=True)
    company_info = Column(Text, nullable=True)
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
    
    # Kanban & User organization
    status = Column(String(64), nullable=False, default="Еще не написан")
    tags = Column(JSON, default=list)  # list of string labels
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="vacancies")


class AppSetting(Base):
    __tablename__ = "settings"

    key = Column(String(128), primary_key=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
