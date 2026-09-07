import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from .database import Base

VALID_STATUSES = [
    "Еще не написан",
    "Написал",
    "Собеседование",
    "Тестовое",
    "Оффер",
]

class Vacancy(Base):
    __tablename__ = "vacancies"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(64), index=True, nullable=True)
    url = Column(String(1024), nullable=False)
    title = Column(String(256), nullable=False, default="Untitled Vacancy")
    company = Column(String(256), nullable=False, default="Unknown Company")
    company_url = Column(String(1024), nullable=True)
    company_info = Column(Text, nullable=True)
    location = Column(String(256), nullable=True)
    country = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)
    
    # AI-generated fields
    ai_summary = Column(Text, nullable=True)
    tech_stack = Column(JSON, default=list)  # list of strings e.g. ["Python", "Docker"]
    
    # Kanban & User organization
    status = Column(String(64), nullable=False, default="Еще не написан")
    tags = Column(JSON, default=list)  # list of string labels
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class AppSetting(Base):
    __tablename__ = "settings"

    key = Column(String(128), primary_key=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
