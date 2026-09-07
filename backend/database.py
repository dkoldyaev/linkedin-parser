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
