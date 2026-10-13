"""Generate fake ("fish") vacancies for demos and development.

CLI:
    python -m backend.mock_data [--count 30] [--email dev@local.user] [--force]
"""
import argparse
import logging
import os
import random
import datetime

from .database import SessionLocal, Base, engine, ensure_db_schema
from .models import Vacancy, VacancyStatusHistory, VALID_STATUSES

logger = logging.getLogger(__name__)

MOCK_URL_PREFIX = "https://example.com/mock/jobs/"

COMPANIES = ["Acme Corp", "Globex", "Initech", "Umbrella Labs", "Hooli", "Stark Industries",
             "Wayne Tech", "Cyberdyne", "Soylent Systems", "Wonka Digital", "Pied Piper", "Vandelay"]
TITLES = ["Senior Python Developer", "Frontend Engineer (React)", "Full Stack Developer",
          "DevOps Engineer", "Data Engineer", "Backend Engineer (Node.js)", "QA Automation Engineer",
          "Machine Learning Engineer", "Tech Lead", "Mobile Developer (Flutter)", "Site Reliability Engineer"]
SOURCES = ["LinkedIn", "Habr Career", "Upwork", "hh.ru", "Wellfound"]
LOCATIONS = [("Berlin, Germany", "Berlin", "Germany"), ("Warsaw, Poland", "Warsaw", "Poland"),
             ("Amsterdam, Netherlands", "Amsterdam", "Netherlands"), ("Lisbon, Portugal", "Lisbon", "Portugal"),
             ("Remote", None, None)]
STACKS = [["Python", "FastAPI", "PostgreSQL", "Docker"], ["TypeScript", "React", "Vite"],
          ["Node.js", "Redis", "Kubernetes"], ["Go", "gRPC", "AWS"], ["Python", "PyTorch", "Airflow"],
          ["Vue", "Nuxt", "GraphQL"]]
TAGS = ["priority", "remote-friendly", "startup", "relocation", "contract"]


def generate_mock_vacancies(db, count: int = 30, user_id: int = None) -> int:
    now = datetime.datetime.utcnow()
    for i in range(count):
        loc, city, country = random.choice(LOCATIONS)
        status = random.choice(VALID_STATUSES)
        company = random.choice(COMPANIES)
        title = random.choice(TITLES)
        stack = random.choice(STACKS)
        salary_min = random.choice([3000, 4000, 5000, 6000, 8000])
        created = now - datetime.timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
        v = Vacancy(
            user_id=user_id,
            job_id=f"mock-{uuid_hex()}",
            url=f"{MOCK_URL_PREFIX}{uuid_hex()}",
            title=title,
            company=company,
            source=random.choice(SOURCES),
            location=loc,
            city=city,
            country=country,
            workplace_type="remote" if loc == "Remote" else random.choice(["remote", "hybrid", "on-site"]),
            description=(f"{company} is looking for a {title}.\n\nRequirements: {', '.join(stack)}.\n"
                         "This is a generated mock vacancy."),
            salary_min=salary_min,
            salary_max=salary_min + random.choice([1000, 2000, 3000]),
            salary_currency="€",
            salary_period="month",
            ai_summary=f"{title} at {company}. Stack: {', '.join(stack)}.",
            tech_stack=stack,
            status=status,
            tags=random.sample(TAGS, k=random.randint(0, 2)),
            created_at=created,
            updated_at=created,
        )
        if status != VALID_STATUSES[0]:
            v.history.append(VacancyStatusHistory(from_status=VALID_STATUSES[0], to_status=status,
                                                  created_at=created))
        db.add(v)
    db.commit()
    return count


def uuid_hex() -> str:
    import uuid
    return uuid.uuid4().hex[:12]


def mock_data_exists(db) -> bool:
    return db.query(Vacancy.id).filter(Vacancy.url.like(f"{MOCK_URL_PREFIX}%")).first() is not None


def seed_mock_data(count: int = 30, email: str = "dev@local.user", force: bool = False) -> int:
    """Create mock vacancies for the dev user. Skips if mock data already exists unless force=True."""
    from .auth import get_or_create_dev_user
    Base.metadata.create_all(bind=engine)
    ensure_db_schema()
    db = SessionLocal()
    try:
        if not force and mock_data_exists(db):
            logger.info("Mock data already present, skipping")
            return 0
        user = get_or_create_dev_user(db, email=email, name="Dev User")
        created = generate_mock_vacancies(db, count=count, user_id=user.id)
        logger.info(f"Created {created} mock vacancies for {email}")
        return created
    finally:
        db.close()


def is_mock_data_enabled() -> bool:
    return os.getenv("CREATE_MOCK_DATA", "false").strip().lower() in ("true", "1", "yes")


def main():
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(description="Generate fake vacancies")
    parser.add_argument("--count", type=int, default=30)
    parser.add_argument("--email", default="dev@local.user", help="Owner user email (dev user)")
    args = parser.parse_args()
    n = seed_mock_data(args.count, args.email, force=True)
    print(f"Created {n} mock vacancies")


if __name__ == "__main__":
    main()
