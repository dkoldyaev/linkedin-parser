import os
import sys
from sqlalchemy import create_engine, text

# Test candidate URLs
candidates = [
    "postgresql://dkoldaev@localhost:5432/linkedin_tracker",
    "postgresql://postgres@localhost:5432/linkedin_tracker",
    "postgresql://postgres:postgres@localhost:5432/linkedin_tracker",
    "postgresql://localhost:5432/linkedin_tracker",
]

working_url = None

for url in candidates:
    try:
        engine = create_engine(url, pool_pre_ping=True)
        with engine.connect() as conn:
            res = conn.execute(text("SELECT current_user, current_database();")).fetchone()
            print(f"✓ Connected successfully with URL: {url}")
            print(f"  User: {res[0]} | Database: {res[1]}")
            working_url = url
            break
    except Exception as e:
        print(f"✗ Failed with URL: {url} -> {e}")

if not working_url:
    print("Could not connect to PostgreSQL!")
    sys.exit(1)

# Now test with backend models
os.environ["DATABASE_URL"] = working_url
from backend.database import Base, SessionLocal, engine
from backend.models import Vacancy

Base.metadata.create_all(bind=engine)
print("✓ Tables created in PostgreSQL successfully!")

with SessionLocal() as db:
    # Check current count
    count = db.query(Vacancy).count()
    print(f"✓ Current vacancies in PostgreSQL: {count}")
    
    # Add a test vacancy
    test_v = Vacancy(
        title="Senior Python / Postgres Developer",
        company="Antigravity Test Lab",
        url="https://www.linkedin.com/jobs/view/test-postgres-1",
        description="Testing PostgreSQL storage and persistence",
        status="Еще не написан",
        tags=["postgres", "test"],
    )
    db.add(test_v)
    db.commit()
    db.refresh(test_v)
    print(f"✓ Saved vacancy ID: {test_v.id} in PostgreSQL successfully!")

with SessionLocal() as db:
    saved = db.query(Vacancy).filter(Vacancy.company == "Antigravity Test Lab").first()
    assert saved is not None
    assert saved.title == "Senior Python / Postgres Developer"
    print(f"✓ Verified vacancy persistence: ID {saved.id} - '{saved.title}'")

print("\nALL POSTGRESQL TESTS PASSED SUCCESSFULLY!")
