import os
import sqlite3
from sqlalchemy import create_engine
from backend.database import Base, SessionLocal, engine
from backend.models import Vacancy, AppSetting

# Source SQLite DB
sqlite_file = os.path.abspath("data/linkedin_tracker.db")
if not os.path.exists(sqlite_file):
    print(f"No SQLite file at {sqlite_file}")
    exit(0)

# Connect to SQLite
src_conn = sqlite3.connect(sqlite_file)
src_conn.row_factory = sqlite3.Row
src_cur = src_conn.cursor()

# Check tables
src_cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [r[0] for r in src_cur.fetchall()]
print(f"Tables in SQLite: {tables}")

if "vacancies" in tables:
    src_cur.execute("SELECT * FROM vacancies")
    rows = src_cur.fetchall()
    print(f"Found {len(rows)} vacancies in SQLite")

    with SessionLocal() as db:
        migrated = 0
        for r in rows:
            d = dict(r)
            # Check if exists by url or job_id
            existing = None
            if d.get("job_id"):
                existing = db.query(Vacancy).filter(Vacancy.job_id == d["job_id"]).first()
            if not existing and d.get("url"):
                existing = db.query(Vacancy).filter(Vacancy.url == d["url"]).first()

            if not existing:
                import json
                tech_stack = json.loads(d["tech_stack"]) if isinstance(d.get("tech_stack"), str) else (d.get("tech_stack") or [])
                tags = json.loads(d["tags"]) if isinstance(d.get("tags"), str) else (d.get("tags") or [])
                
                v = Vacancy(
                    job_id=d.get("job_id"),
                    url=d.get("url"),
                    title=d.get("title", "Untitled"),
                    company=d.get("company", "Unknown"),
                    company_url=d.get("company_url"),
                    company_info=d.get("company_info"),
                    location=d.get("location"),
                    country=d.get("country"),
                    description=d.get("description"),
                    ai_summary=d.get("ai_summary"),
                    tech_stack=tech_stack,
                    tags=tags,
                    status=d.get("status", "Еще не написан"),
                    notes=d.get("notes"),
                )
                db.add(v)
                migrated += 1
        db.commit()
        print(f"✓ Successfully migrated {migrated} new vacancies to PostgreSQL!")

with SessionLocal() as db:
    total = db.query(Vacancy).count()
    print(f"✓ Total vacancies in PostgreSQL now: {total}")
