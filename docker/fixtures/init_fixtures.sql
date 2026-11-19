-- Deterministic Test & Development Fixtures for LinkedIn Tracker
-- Compatible with both Python/FastAPI (SQLAlchemy) and Symfony 7 (Doctrine)

BEGIN;

-- Drop existing tables to ensure a clean state
DROP TABLE IF EXISTS vacancy_cv_analyses CASCADE;
DROP TABLE IF EXISTS adapted_cv_versions CASCADE;
DROP TABLE IF EXISTS vacancy_status_history CASCADE;
DROP TABLE IF EXISTS vacancies CASCADE;
DROP TABLE IF EXISTS user_feature_flags CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS approved_cvs CASCADE;
DROP TABLE IF EXISTS processing_queue_items CASCADE;
DROP TABLE IF EXISTS user_llm_token_usage CASCADE;
DROP TABLE IF EXISTS exchange_rates CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar VARCHAR(1024),
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    roles JSONB NOT NULL DEFAULT '["ROLE_USER"]',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. User Feature Flags
CREATE TABLE user_feature_flags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flag VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_feature_flag UNIQUE (user_id, flag)
);

-- 3. User Settings
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key VARCHAR(128) NOT NULL,
    value TEXT,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_setting_key UNIQUE (user_id, key)
);

-- 4. App Settings
CREATE TABLE settings (
    key VARCHAR(128) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Vacancies
CREATE TABLE vacancies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    job_id VARCHAR(64),
    url VARCHAR(1024) NOT NULL,
    title VARCHAR(256) NOT NULL DEFAULT 'Untitled Vacancy',
    company VARCHAR(256) NOT NULL DEFAULT 'Unknown Company',
    company_url VARCHAR(1024),
    company_info TEXT,
    source VARCHAR(64),
    location VARCHAR(256),
    city VARCHAR(128),
    country VARCHAR(128),
    description TEXT,
    workplace_type VARCHAR(32),
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    salary_min DOUBLE PRECISION,
    salary_max DOUBLE PRECISION,
    salary_currency VARCHAR(16),
    salary_period VARCHAR(32),
    ai_summary TEXT,
    tech_stack JSONB NOT NULL DEFAULT '[]',
    extracted_requirements JSONB,
    match_score DOUBLE PRECISION,
    status VARCHAR(64) NOT NULL DEFAULT 'Еще не написал',
    tags JSONB NOT NULL DEFAULT '[]',
    notes TEXT,
    lane INTEGER NOT NULL DEFAULT 0,
    sort_order DOUBLE PRECISION,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_vacancies_user_updated ON vacancies (user_id, updated_at, id);
CREATE INDEX ix_vacancies_user_created ON vacancies (user_id, created_at);
CREATE INDEX ix_vacancies_user_job ON vacancies (user_id, job_id);
CREATE INDEX ix_vacancies_user_url ON vacancies (user_id, url);

-- 6. Vacancy Status History
CREATE TABLE vacancy_status_history (
    id SERIAL PRIMARY KEY,
    vacancy_id INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    from_status VARCHAR(64),
    to_status VARCHAR(64) NOT NULL,
    from_lane INTEGER,
    to_lane INTEGER,
    comment TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Approved CVs
CREATE TABLE approved_cvs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parsed_profile JSONB,
    revision INTEGER NOT NULL DEFAULT 1,
    approved_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Vacancy CV Analyses
CREATE TABLE vacancy_cv_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vacancy_id INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    cv_revision INTEGER NOT NULL DEFAULT 1,
    scoring_policy_version VARCHAR(32) NOT NULL DEFAULT 'v1.0',
    model_id VARCHAR(128) NOT NULL DEFAULT 'mock-llm-v1',
    overall_score DOUBLE PRECISION NOT NULL,
    result JSONB NOT NULL,
    adapted_cv JSONB,
    is_outdated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_vacancy_analysis UNIQUE (user_id, vacancy_id)
);

-- 9. API Keys
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    prefix VARCHAR(16) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP WITHOUT TIME ZONE
);

-- 10. Exchange Rates
CREATE TABLE exchange_rates (
    id SERIAL PRIMARY KEY,
    source_currency VARCHAR(16) NOT NULL,
    target_currency VARCHAR(16) NOT NULL,
    rate DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_exchange_rates_source_target UNIQUE (source_currency, target_currency)
);

-- 11. Processing Queue Items
CREATE TABLE processing_queue_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    task_id VARCHAR(64) UNIQUE NOT NULL,
    url VARCHAR(1024) NOT NULL,
    normalized_url VARCHAR(2048) NOT NULL DEFAULT '',
    status VARCHAR(32) NOT NULL,
    stage VARCHAR(32),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 4,
    error TEXT,
    vacancy_id INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- 12. User LLM Token Usage
CREATE TABLE user_llm_token_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL,
    model VARCHAR(64) NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- SEED DATA
--------------------------------------------------------------------------------

-- Users:
-- User 1: Dev Admin with full rights and API Access
INSERT INTO users (id, email, name, avatar, is_admin, roles, created_at, updated_at)
VALUES (1, 'dev@local.user', 'Dev User', 'https://api.dicebear.com/7.x/bottts/svg?seed=dev', TRUE, '["ROLE_USER", "ROLE_ADMIN"]', '2026-01-01 10:00:00', '2026-01-01 10:00:00');

-- User 2: Regular User (multi-tenancy check, no api_access flag)
INSERT INTO users (id, email, name, avatar, is_admin, roles, created_at, updated_at)
VALUES (2, 'user2@local.user', 'Regular User', NULL, FALSE, '["ROLE_USER"]', '2026-01-02 10:00:00', '2026-01-02 10:00:00');

-- User 3: Shadow Test User
INSERT INTO users (id, email, name, avatar, is_admin, roles, created_at, updated_at)
VALUES (3, 'shadow@test.local', 'Shadow User', NULL, TRUE, '["ROLE_USER", "ROLE_ADMIN"]', '2026-01-03 10:00:00', '2026-01-03 10:00:00');

SELECT setval('users_id_seq', 3);

-- Feature Flags:
INSERT INTO user_feature_flags (id, user_id, flag, created_at) VALUES (1, 1, 'api_access', '2026-01-01 10:00:00');
INSERT INTO user_feature_flags (id, user_id, flag, created_at) VALUES (2, 1, 'admin', '2026-01-01 10:00:00');
INSERT INTO user_feature_flags (id, user_id, flag, created_at) VALUES (3, 3, 'api_access', '2026-01-03 10:00:00');
INSERT INTO user_feature_flags (id, user_id, flag, created_at) VALUES (4, 3, 'admin', '2026-01-03 10:00:00');
SELECT setval('user_feature_flags_id_seq', 4);

-- API Keys:
-- Key 'test_key_user1' -> sha256 = '9dca7e843975cde5bc06d0abd84799835f9928fc7281afd3f77e1f6848032b47'
INSERT INTO api_keys (id, user_id, key_hash, name, prefix, created_at)
VALUES (1, 1, '9dca7e843975cde5bc06d0abd84799835f9928fc7281afd3f77e1f6848032b47', 'User 1 Main Key', 'lp_test1', '2026-01-01 10:00:00');

-- Key 'test_key_user2' -> sha256 = '4236fe0349e47ff78e6d78d317085e56d85973f829618fa957ba9f44db7df745'
INSERT INTO api_keys (id, user_id, key_hash, name, prefix, created_at)
VALUES (2, 2, '4236fe0349e47ff78e6d78d317085e56d85973f829618fa957ba9f44db7df745', 'User 2 Key', 'lp_test2', '2026-01-02 10:00:00');
SELECT setval('api_keys_id_seq', 2);

-- Settings:
INSERT INTO settings (key, value, updated_at) VALUES ('locale', 'ru', '2026-01-01 10:00:00');
INSERT INTO settings (key, value, updated_at) VALUES ('salary_display_format', 'month', '2026-01-01 10:00:00');

-- User 1 Vacancies (covering all kanban statuses, tags, locations, salary):
INSERT INTO vacancies (id, user_id, job_id, url, title, company, source, location, city, country, workplace_type, is_closed, salary_min, salary_max, salary_currency, salary_period, ai_summary, tech_stack, status, tags, lane, sort_order, created_at, updated_at)
VALUES 
(1, 1, 'job-001', 'https://example.com/jobs/1', 'Senior Backend Engineer', 'Initech', 'LinkedIn', 'Berlin, Germany', 'Berlin', 'Germany', 'remote', FALSE, 5000, 7500, 'EUR', 'month', 'Backend services at Initech. Stack: Python, PostgreSQL, Docker.', '["Python", "FastAPI", "PostgreSQL", "Docker"]', 'Еще не написал', '["priority", "backend"]', 0, 1.0, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
(2, 1, 'job-002', 'https://example.com/jobs/2', 'Full Stack Developer', 'Acme Corp', 'Habr Career', 'Amsterdam, Netherlands', 'Amsterdam', 'Netherlands', 'hybrid', FALSE, 6000, 8500, 'EUR', 'month', 'Full Stack at Acme. Stack: React, TypeScript, Node.js.', '["TypeScript", "React", "Node.js"]', 'Написал', '["frontend"]', 0, 2.0, '2026-01-11 10:00:00', '2026-01-11 10:00:00'),
(3, 1, 'job-003', 'https://example.com/jobs/3', 'Lead Software Architect', 'Globex', 'Upwork', 'Warsaw, Poland', 'Warsaw', 'Poland', 'on-site', FALSE, 7000, 9500, 'USD', 'month', 'Architect role at Globex.', '["Go", "Kubernetes", "AWS"]', 'Собеседование', '["lead"]', 0, 3.0, '2026-01-12 10:00:00', '2026-01-12 10:00:00'),
(4, 1, 'job-004', 'https://example.com/jobs/4', 'DevOps / Platform Engineer', 'Stark Industries', 'LinkedIn', 'Lisbon, Portugal', 'Lisbon', 'Portugal', 'remote', FALSE, 5500, 8000, 'EUR', 'month', 'DevOps at Stark.', '["Terraform", "Docker", "CI/CD"]', 'Тестовое', '["devops"]', 0, 4.0, '2026-01-13 10:00:00', '2026-01-13 10:00:00'),
(5, 1, 'job-005', 'https://example.com/jobs/5', 'Staff Python Engineer', 'Pied Piper', 'Wellfound', 'Remote', NULL, NULL, 'remote', FALSE, 8000, 11000, 'USD', 'month', 'Pied Piper compression engine backend.', '["Python", "Algorithms", "Distributed Systems"]', 'Оффер', '["priority"]', 0, 5.0, '2026-01-14 10:00:00', '2026-01-14 10:00:00'),
(6, 1, 'job-006', 'https://example.com/jobs/6', 'Junior QA Engineer', 'Hooli', 'hh.ru', 'Berlin, Germany', 'Berlin', 'Germany', 'on-site', TRUE, 3000, 4000, 'EUR', 'month', 'QA at Hooli.', '["Python", "Selenium", "Pytest"]', 'Отказ', '[]', 0, 6.0, '2026-01-15 10:00:00', '2026-01-15 10:00:00');

-- User 2 Vacancies (Tenant Isolation Check):
INSERT INTO vacancies (id, user_id, job_id, url, title, company, source, location, city, country, workplace_type, is_closed, salary_min, salary_max, salary_currency, salary_period, ai_summary, tech_stack, status, tags, lane, sort_order, created_at, updated_at)
VALUES
(101, 2, 'job-101', 'https://example.com/jobs/101', 'Secret Project Engineer', 'Umbrella Corp', 'LinkedIn', 'Tokyo, Japan', 'Tokyo', 'Japan', 'on-site', FALSE, 9000, 12000, 'USD', 'month', 'Classified project.', '["C++", "Embedded"]', 'Еще не написал', '["secret"]', 0, 1.0, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
(102, 2, 'job-102', 'https://example.com/jobs/102', 'Data Scientist', 'Cyberdyne', 'LinkedIn', 'San Francisco, USA', 'San Francisco', 'USA', 'remote', FALSE, 10000, 15000, 'USD', 'month', 'AI systems.', '["Python", "PyTorch"]', 'Написал', '["ai"]', 0, 2.0, '2026-01-11 10:00:00', '2026-01-11 10:00:00');

SELECT setval('vacancies_id_seq', 102);

-- Vacancy History:
INSERT INTO vacancy_status_history (id, vacancy_id, from_status, to_status, from_lane, to_lane, comment, created_at, updated_at)
VALUES
(1, 2, 'Еще не написал', 'Написал', 0, 0, 'Отправил отклик через форму', '2026-01-11 11:00:00', '2026-01-11 11:00:00'),
(2, 3, 'Еще не написал', 'Собеседование', 0, 0, 'Назначен скрининг с техлидом', '2026-01-12 12:00:00', '2026-01-12 12:00:00'),
(3, 1, NULL, 'Еще не написал', NULL, NULL, NULL, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
(4, 4, NULL, 'Тестовое', NULL, NULL, NULL, '2026-01-13 10:00:00', '2026-01-13 10:00:00'),
(5, 5, NULL, 'Оффер', NULL, NULL, NULL, '2026-01-14 10:00:00', '2026-01-14 10:00:00'),
(6, 6, NULL, 'Отказ', NULL, NULL, NULL, '2026-01-15 10:00:00', '2026-01-15 10:00:00'),
(7, 101, NULL, 'Еще не написал', NULL, NULL, NULL, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
(8, 102, NULL, 'Написал', NULL, NULL, NULL, '2026-01-11 10:00:00', '2026-01-11 10:00:00');
SELECT setval('vacancy_status_history_id_seq', 8);

-- Approved CV for User 1:
INSERT INTO approved_cvs (id, user_id, content, parsed_profile, revision, approved_at, created_at, updated_at)
VALUES (1, 1, 'Senior Software Engineer with 8+ years experience in Python, PostgreSQL, Docker, Microservices.', '{"skills": ["Python", "PostgreSQL", "Docker", "FastAPI"], "seniority": "Senior", "experience_years": 8}', 1, '2026-01-01 10:00:00', '2026-01-01 10:00:00', '2026-01-01 10:00:00');
SELECT setval('approved_cvs_id_seq', 1);

-- Exchange Rates:
INSERT INTO exchange_rates (id, source_currency, target_currency, rate, updated_at)
VALUES 
(1, 'USD', 'EUR', 0.92, '2026-01-01 10:00:00'),
(2, 'EUR', 'USD', 1.09, '2026-01-01 10:00:00'),
(3, 'USD', 'RUB', 92.50, '2026-01-01 10:00:00');
SELECT setval('exchange_rates_id_seq', 3);

COMMIT;
