import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

import logging

logger = logging.getLogger("linkedin_tracker.database")

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

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
        hide_parameters=True,
    )
    logger.info("Using PostgreSQL database")
else:
    DATA_DIR = os.getenv("DATA_DIR", "./data")
    try:
        os.makedirs(DATA_DIR, mode=0o700, exist_ok=True)
        # Attempt to ensure directory is writable
        os.chmod(DATA_DIR, 0o700)
    except Exception as e:
        logger.warning(f"Could not ensure permissions on DATA_DIR '{DATA_DIR}': {e}")

    DB_PATH = os.path.abspath(os.path.join(DATA_DIR, "linkedin_tracker.db"))
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False, "timeout": 30},
        hide_parameters=True,
    )

    # Enable WAL mode and busy_timeout for SQLite for better concurrency
    try:
        with engine.connect() as connection:
            connection.exec_driver_sql("PRAGMA journal_mode=WAL")
            connection.exec_driver_sql("PRAGMA synchronous=NORMAL")
            connection.exec_driver_sql("PRAGMA busy_timeout=30000")
    except Exception as e:
        logger.warning(f"Could not execute SQLite PRAGMAs: {e}")

    os.chmod(DB_PATH, 0o600)
    logger.info("Using SQLite database")

# SQL shapes and request counts are opt-in; never log parameter values.
if os.getenv("SQL_DIAGNOSTICS", "false").lower() in ("1", "true", "yes"):
    from .diagnostics import install_sql_diagnostics
    install_sql_diagnostics(engine)

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
                    if "source" not in existing_cols:
                        conn.execute(text("ALTER TABLE vacancies ADD COLUMN source VARCHAR(64)"))
                    if "sort_order" not in existing_cols:
                        conn.execute(text("ALTER TABLE vacancies ADD COLUMN sort_order REAL"))
                    if "lane" not in existing_cols:
                        conn.execute(text("ALTER TABLE vacancies ADD COLUMN lane INTEGER DEFAULT 0 NOT NULL"))
                    if "match_score" not in existing_cols:
                        conn.execute(text("ALTER TABLE vacancies ADD COLUMN match_score REAL"))

                history_cols = {r[1] for r in conn.execute(text("PRAGMA table_info(vacancy_status_history)")).fetchall()}
                if history_cols:
                    if "from_lane" not in history_cols:
                        conn.execute(text("ALTER TABLE vacancy_status_history ADD COLUMN from_lane INTEGER"))
                    if "to_lane" not in history_cols:
                        conn.execute(text("ALTER TABLE vacancy_status_history ADD COLUMN to_lane INTEGER"))

                user_cols = {r[1] for r in conn.execute(text("PRAGMA table_info(users)")).fetchall()}
                if user_cols:
                    if "feature_flags" not in user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN feature_flags JSON DEFAULT '[]'"))
                    if "is_anonymous" not in user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN is_anonymous BOOLEAN DEFAULT 0 NOT NULL"))
                    if "last_login_at" not in user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at DATETIME"))
                    if "last_board_interaction_at" not in user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN last_board_interaction_at DATETIME"))

                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS user_feature_flags (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        flag VARCHAR(64) NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT uq_user_feature_flag UNIQUE (user_id, flag)
                    )
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_user_feature_flags_user_id ON user_feature_flags(user_id)"))

                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS user_llm_token_usage (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        provider VARCHAR(32) NOT NULL,
                        model VARCHAR(64),
                        operation VARCHAR(64) NOT NULL,
                        prompt_tokens INTEGER DEFAULT 0 NOT NULL,
                        completion_tokens INTEGER DEFAULT 0 NOT NULL,
                        total_tokens INTEGER DEFAULT 0 NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_user_llm_token_usage_user_id ON user_llm_token_usage(user_id)"))
            elif dialect == "postgresql":
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS city VARCHAR(128)"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS salary_min DOUBLE PRECISION"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS salary_max DOUBLE PRECISION"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(16)"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS salary_period VARCHAR(32)"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS workplace_type VARCHAR(32)"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE NOT NULL"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS source VARCHAR(64)"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS sort_order DOUBLE PRECISION"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS lane INTEGER DEFAULT 0 NOT NULL"))
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS match_score DOUBLE PRECISION"))
                conn.execute(text("ALTER TABLE vacancy_status_history ADD COLUMN IF NOT EXISTS from_lane INTEGER"))
                conn.execute(text("ALTER TABLE vacancy_status_history ADD COLUMN IF NOT EXISTS to_lane INTEGER"))
                conn.execute(text("ALTER TABLE vacancies ALTER COLUMN title TYPE VARCHAR(1024)"))
                conn.execute(text("ALTER TABLE vacancies ALTER COLUMN url TYPE VARCHAR(2048)"))
                conn.execute(text("ALTER TABLE vacancies ALTER COLUMN company_url TYPE VARCHAR(2048)"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '[]'::jsonb"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE NOT NULL"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_board_interaction_at TIMESTAMP WITH TIME ZONE"))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS user_feature_flags (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        flag VARCHAR(64) NOT NULL,
                        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT uq_user_feature_flag UNIQUE (user_id, flag)
                    )
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_user_feature_flags_user_id ON user_feature_flags(user_id)"))

                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS user_llm_token_usage (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        provider VARCHAR(32) NOT NULL,
                        model VARCHAR(64),
                        operation VARCHAR(64) NOT NULL,
                        prompt_tokens INTEGER DEFAULT 0 NOT NULL,
                        completion_tokens INTEGER DEFAULT 0 NOT NULL,
                        total_tokens INTEGER DEFAULT 0 NOT NULL,
                        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_user_llm_token_usage_user_id ON user_llm_token_usage(user_id)"))
    except Exception as e:
        logger.warning(f"Schema migration check: {e}")

    try:
        with engine.begin() as conn:
            dialect = engine.dialect.name
            if dialect == "sqlite":
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS approved_cvs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                        content TEXT NOT NULL,
                        revision INTEGER NOT NULL DEFAULT 1,
                        approved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    );
                """))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS vacancy_cv_analyses (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        vacancy_id INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
                        cv_revision INTEGER NOT NULL,
                        scoring_policy_version VARCHAR(32) NOT NULL DEFAULT 'v1.0',
                        model_id VARCHAR(128) NOT NULL,
                        overall_score REAL NOT NULL,
                        result JSON NOT NULL,
                        adapted_cv JSON,
                        is_outdated BOOLEAN NOT NULL DEFAULT 0,
                        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, vacancy_id)
                    );
                """))
                cols = [row[1] for row in conn.execute(text("PRAGMA table_info(vacancy_cv_analyses)")).fetchall()]
                if "adapted_cv" not in cols:
                    conn.execute(text("ALTER TABLE vacancy_cv_analyses ADD COLUMN adapted_cv JSON"))

                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS adapted_cv_versions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        analysis_id INTEGER NOT NULL REFERENCES vacancy_cv_analyses(id) ON DELETE CASCADE,
                        version_number INTEGER NOT NULL,
                        adapted_cv JSON NOT NULL,
                        user_comment TEXT,
                        parent_version_id INTEGER REFERENCES adapted_cv_versions(id) ON DELETE SET NULL,
                        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    );
                """))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS api_keys (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        name VARCHAR(128) NOT NULL,
                        key_hash VARCHAR(64) NOT NULL UNIQUE,
                        key_prefix VARCHAR(16) NOT NULL,
                        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        last_used_at DATETIME,
                        request_count INTEGER NOT NULL DEFAULT 0
                    );
                """))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS exchange_rates (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        source_currency VARCHAR(16) NOT NULL,
                        target_currency VARCHAR(16) NOT NULL,
                        rate REAL NOT NULL,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT uq_exchange_rates_source_target UNIQUE (source_currency, target_currency)
                    );
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_exchange_rates_source ON exchange_rates(source_currency)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_exchange_rates_target ON exchange_rates(target_currency)"))
            elif dialect == "postgresql":
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS approved_cvs (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                        content TEXT NOT NULL,
                        revision INTEGER NOT NULL DEFAULT 1,
                        approved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                    );
                """))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS vacancy_cv_analyses (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        vacancy_id INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
                        cv_revision INTEGER NOT NULL,
                        scoring_policy_version VARCHAR(32) NOT NULL DEFAULT 'v1.0',
                        model_id VARCHAR(128) NOT NULL,
                        overall_score DOUBLE PRECISION NOT NULL,
                        result JSONB NOT NULL,
                        is_outdated BOOLEAN NOT NULL DEFAULT FALSE,
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                        CONSTRAINT uq_user_vacancy_analysis UNIQUE (user_id, vacancy_id)
                    );
                """))
                conn.execute(text("ALTER TABLE vacancy_cv_analyses ADD COLUMN IF NOT EXISTS adapted_cv JSONB"))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS adapted_cv_versions (
                        id SERIAL PRIMARY KEY,
                        analysis_id INTEGER NOT NULL REFERENCES vacancy_cv_analyses(id) ON DELETE CASCADE,
                        version_number INTEGER NOT NULL,
                        adapted_cv JSONB NOT NULL,
                        user_comment TEXT,
                        parent_version_id INTEGER REFERENCES adapted_cv_versions(id) ON DELETE SET NULL,
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                    );
                """))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS api_keys (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        name VARCHAR(128) NOT NULL,
                        key_hash VARCHAR(64) NOT NULL UNIQUE,
                        key_prefix VARCHAR(16) NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                        last_used_at TIMESTAMP WITH TIME ZONE,
                        request_count INTEGER NOT NULL DEFAULT 0
                    );
                """))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS exchange_rates (
                        id SERIAL PRIMARY KEY,
                        source_currency VARCHAR(16) NOT NULL,
                        target_currency VARCHAR(16) NOT NULL,
                        rate DOUBLE PRECISION NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        CONSTRAINT uq_exchange_rates_source_target UNIQUE (source_currency, target_currency)
                    );
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_exchange_rates_source ON exchange_rates(source_currency)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_exchange_rates_target ON exchange_rates(target_currency)"))
    except Exception as e:
        logger.warning(f"Approved CV / Vacancy analysis tables migration check: {e}")

    try:
        with engine.begin() as conn:
            dialect = engine.dialect.name
            if dialect == "sqlite":
                cols = [row[1] for row in conn.execute(text("PRAGMA table_info(api_keys)")).fetchall()]
                if "request_count" not in cols:
                    conn.execute(text("ALTER TABLE api_keys ADD COLUMN request_count INTEGER NOT NULL DEFAULT 0"))
            elif dialect == "postgresql":
                conn.execute(text("ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS request_count INTEGER NOT NULL DEFAULT 0"))
    except Exception as e:
        logger.warning(f"API keys table request_count migration check: {e}")

    try:
        with engine.begin() as conn:
            dialect = engine.dialect.name
            if dialect == "sqlite":
                conn.execute(text("""
                    INSERT INTO vacancy_status_history (vacancy_id, from_status, to_status, comment, created_at, updated_at)
                    SELECT v.id, NULL, v.status, NULL, COALESCE(v.created_at, datetime('now')), COALESCE(v.created_at, datetime('now'))
                    FROM vacancies v
                    WHERE NOT EXISTS (
                        SELECT 1 FROM vacancy_status_history h WHERE h.vacancy_id = v.id
                    )
                """))
            elif dialect == "postgresql":
                conn.execute(text("""
                    INSERT INTO vacancy_status_history (vacancy_id, from_status, to_status, comment, created_at, updated_at)
                    SELECT v.id, NULL, v.status, NULL, COALESCE(v.created_at, NOW()), COALESCE(v.created_at, NOW())
                    FROM vacancies v
                    WHERE NOT EXISTS (
                        SELECT 1 FROM vacancy_status_history h WHERE h.vacancy_id = v.id
                    )
                """))
    except Exception as e:
        logger.warning(f"Backfill vacancy status history check: {e}")

    try:
        with engine.begin() as conn:
            conn.execute(text("DELETE FROM user_settings WHERE key = 'cv_service_token'"))
            conn.execute(text("DELETE FROM settings WHERE key = 'cv_service_token'"))
    except Exception as e:
        logger.warning(f"Cleanup legacy cv_service_token settings: {e}")

    try:
        # Migrate misspelled status and column names from legacy 'Еще не написан' to 'Еще не написал'
        from .models import STATUS_NOT_CONTACTED
        legacy_status = "Еще не написан"
        with engine.begin() as conn:
            # 1. Update vacancies table
            conn.execute(
                text("UPDATE vacancies SET status = :new_status WHERE status = :old_status"),
                {"new_status": STATUS_NOT_CONTACTED, "old_status": legacy_status}
            )
            # 2. Update vacancy_status_history table
            conn.execute(
                text("UPDATE vacancy_status_history SET from_status = :new_status WHERE from_status = :old_status"),
                {"new_status": STATUS_NOT_CONTACTED, "old_status": legacy_status}
            )
            conn.execute(
                text("UPDATE vacancy_status_history SET to_status = :new_status WHERE to_status = :old_status"),
                {"new_status": STATUS_NOT_CONTACTED, "old_status": legacy_status}
            )
            # 3. Update kanban_columns in user_settings if present
            rows = conn.execute(text("SELECT id, value FROM user_settings WHERE key = 'kanban_columns'")).fetchall()
            for row in rows:
                row_id = row[0]
                val_raw = row[1]
                if val_raw and legacy_status in val_raw:
                    try:
                        import json
                        cols = json.loads(val_raw)
                        updated = False
                        for col in cols:
                            if col.get("id") == legacy_status:
                                col["id"] = STATUS_NOT_CONTACTED
                                updated = True
                        if updated:
                            conn.execute(
                                text("UPDATE user_settings SET value = :val WHERE id = :id"),
                                {"val": json.dumps(cols, ensure_ascii=False), "id": row_id}
                            )
                    except Exception as err:
                        logger.warning(f"Failed to update user_settings kanban_columns for id {row_id}: {err}")
    except Exception as e:
        logger.warning(f"Migrate legacy status 'Еще не написан' -> '{STATUS_NOT_CONTACTED}': {e}")




def ensure_query_indexes():
    """create_all does not add indexes to tables that already exist."""
    from .models import Vacancy, VacancyStatusHistory
    for table in (Vacancy.__table__, VacancyStatusHistory.__table__):
        for index in table.indexes:
            if index.name in {"ix_vacancies_user_updated", "ix_vacancies_user_created",
                              "ix_vacancies_user_job", "ix_vacancies_user_url", "ix_history_vacancy_created"}:
                index.create(bind=engine, checkfirst=True)
