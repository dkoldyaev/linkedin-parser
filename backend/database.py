import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

import logging

logger = logging.getLogger("linkedin_tracker.database")

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Support postgres:// URL scheme from some cloud providers
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    # If running outside container on host, resolve host.docker.internal to localhost if needed
    if "host.docker.internal" in DATABASE_URL and not os.path.exists("/.dockerenv"):
        import socket
        try:
            socket.gethostbyname("host.docker.internal")
        except socket.gaierror:
            DATABASE_URL = DATABASE_URL.replace("host.docker.internal", "localhost")

    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
    )
    logger.info("Using PostgreSQL database")
else:
    DATA_DIR = os.getenv("DATA_DIR", "./data")
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        # Attempt to ensure directory is writable
        os.chmod(DATA_DIR, 0o777)
    except Exception as e:
        logger.warning(f"Could not ensure permissions on DATA_DIR '{DATA_DIR}': {e}")

    DB_PATH = os.path.abspath(os.path.join(DATA_DIR, "linkedin_tracker.db"))
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False, "timeout": 30},
    )

    # Enable WAL mode and busy_timeout for SQLite for better concurrency
    try:
        with engine.connect() as connection:
            connection.exec_driver_sql("PRAGMA journal_mode=WAL")
            connection.exec_driver_sql("PRAGMA synchronous=NORMAL")
            connection.exec_driver_sql("PRAGMA busy_timeout=30000")
    except Exception as e:
        logger.warning(f"Could not execute SQLite PRAGMAs: {e}")

    logger.info(f"Using SQLite database at {DB_PATH}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_db_schema():
    """Ensure newly added columns exist in existing database tables."""
    from sqlalchemy import text
    try:
        with engine.begin() as conn:
            dialect = engine.dialect.name
            if dialect == "sqlite":
                result = conn.execute(text("PRAGMA table_info(vacancies)")).fetchall()
                existing_cols = {r[1] for r in result}
                if existing_cols:
                    if "city" not in existing_cols:
                        conn.execute(text("ALTER TABLE vacancies ADD COLUMN city VARCHAR(128)"))
                    if "salary_min" not in existing_cols:
                        conn.execute(text("ALTER TABLE vacancies ADD COLUMN salary_min REAL"))
                    if "salary_max" not in existing_cols:
                        conn.execute(text("ALTER TABLE vacancies ADD COLUMN salary_max REAL"))
                    if "salary_currency" not in existing_cols:
                        conn.execute(text("ALTER TABLE vacancies ADD COLUMN salary_currency VARCHAR(16)"))
                    if "salary_period" not in existing_cols:
                        conn.execute(text("ALTER TABLE vacancies ADD COLUMN salary_period VARCHAR(32)"))
                    if "workplace_type" not in existing_cols:
                        conn.execute(text("ALTER TABLE vacancies ADD COLUMN workplace_type VARCHAR(32)"))
                    if "is_closed" not in existing_cols:
                        conn.execute(text("ALTER TABLE vacancies ADD COLUMN is_closed BOOLEAN DEFAULT 0 NOT NULL"))
                    if "user_id" not in existing_cols:
                        conn.execute(text("ALTER TABLE vacancies ADD COLUMN user_id INTEGER"))
            elif dialect == "postgresql":
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS city VARCHAR(128)"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS salary_min DOUBLE PRECISION"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS salary_max DOUBLE PRECISION"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(16)"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS salary_period VARCHAR(32)"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS workplace_type VARCHAR(32)"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE NOT NULL"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE"))
    except Exception as e:
        logger.warning(f"Schema migration check: {e}")

