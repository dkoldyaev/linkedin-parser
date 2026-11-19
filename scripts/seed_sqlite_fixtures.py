#!/usr/bin/env python3
"""
Seed deterministic fixtures into both Python (legacy) and Symfony SQLite databases.
Uses Python's SQLAlchemy Base.metadata.create_all for 100% legacy schema parity,
and Symfony's schema for Symfony SQLite.
"""

import os
import sys
import sqlite3
import hashlib
import json

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)

KEY1_PLAIN = "test_key_user1"
KEY1_HASH = hashlib.sha256(KEY1_PLAIN.encode()).hexdigest()  # 9dca7e843975cde5bc06d0abd84799835f9928fc7281afd3f77e1f6848032b47

KEY2_PLAIN = "test_key_user2"
KEY2_HASH = hashlib.sha256(KEY2_PLAIN.encode()).hexdigest()  # 4236fe0349e47ff78e6d78d317085e56d85973f829618fa957ba9f44db7df745

VACANCIES_DATA = [
    (1, 1, 'job-001', 'https://example.com/jobs/1', 'Senior Backend Engineer', 'Initech', 'LinkedIn', 'Berlin, Germany', 'Berlin', 'Germany', 'remote', 0, 5000.0, 7500.0, 'EUR', 'month', 'We need a Senior Backend Engineer with Python, PostgreSQL, Docker experience.', 'Backend services at Initech. Stack: Python, PostgreSQL, Docker.', '["Python", "FastAPI", "PostgreSQL", "Docker"]', 'Еще не написал', '["priority", "backend"]', 0, 1.0, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
    (2, 1, 'job-002', 'https://example.com/jobs/2', 'Full Stack Developer', 'Acme Corp', 'Habr Career', 'Amsterdam, Netherlands', 'Amsterdam', 'Netherlands', 'hybrid', 0, 6000.0, 8500.0, 'EUR', 'month', 'Full Stack Developer with React and Node.js.', 'Full Stack at Acme. Stack: React, TypeScript, Node.js.', '["TypeScript", "React", "Node.js"]', 'Написал', '["frontend"]', 0, 2.0, '2026-01-11 10:00:00', '2026-01-11 10:00:00'),
    (3, 1, 'job-003', 'https://example.com/jobs/3', 'Lead Software Architect', 'Globex', 'Upwork', 'Warsaw, Poland', 'Warsaw', 'Poland', 'on-site', 0, 7000.0, 9500.0, 'USD', 'month', 'Architect role with Go and Kubernetes.', 'Architect role at Globex.', '["Go", "Kubernetes", "AWS"]', 'Собеседование', '["lead"]', 0, 3.0, '2026-01-12 10:00:00', '2026-01-12 10:00:00'),
    (4, 1, 'job-004', 'https://example.com/jobs/4', 'DevOps / Platform Engineer', 'Stark Industries', 'LinkedIn', 'Lisbon, Portugal', 'Lisbon', 'Portugal', 'remote', 0, 5500.0, 8000.0, 'EUR', 'month', 'DevOps position with Terraform and CI/CD.', 'DevOps at Stark.', '["Terraform", "Docker", "CI/CD"]', 'Тестовое', '["devops"]', 0, 4.0, '2026-01-13 10:00:00', '2026-01-13 10:00:00'),
    (5, 1, 'job-005', 'https://example.com/jobs/5', 'Staff Python Engineer', 'Pied Piper', 'Wellfound', 'Remote', None, None, 'remote', 0, 8000.0, 11000.0, 'USD', 'month', 'Middle-out compression engine backend.', 'Pied Piper compression engine backend.', '["Python", "Algorithms", "Distributed Systems"]', 'Оффер', '["priority"]', 0, 5.0, '2026-01-14 10:00:00', '2026-01-14 10:00:00'),
    (6, 1, 'job-006', 'https://example.com/jobs/6', 'Junior QA Engineer', 'Hooli', 'hh.ru', 'Berlin, Germany', 'Berlin', 'Germany', 'on-site', 1, 3000.0, 4000.0, 'EUR', 'month', 'QA automation with Selenium and Pytest.', 'QA at Hooli.', '["Python", "Selenium", "Pytest"]', 'Отказ', '[]', 0, 6.0, '2026-01-15 10:00:00', '2026-01-15 10:00:00'),
    # User 2 Vacancies (ids 101, 102) for Tenant Isolation
    (101, 2, 'job-101', 'https://example.com/jobs/101', 'Secret Project Engineer', 'Umbrella Corp', 'LinkedIn', 'Tokyo, Japan', 'Tokyo', 'Japan', 'on-site', 0, 9000.0, 12000.0, 'USD', 'month', 'Classified project in embedded C++.', 'Classified project.', '["C++", "Embedded"]', 'Еще не написал', '["secret"]', 0, 1.0, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
    (102, 2, 'job-102', 'https://example.com/jobs/102', 'Data Scientist', 'Cyberdyne', 'LinkedIn', 'San Francisco, USA', 'San Francisco', 'USA', 'remote', 0, 10000.0, 15000.0, 'USD', 'month', 'Machine learning and deep neural networks.', 'AI systems.', '["Python", "PyTorch"]', 'Написал', '["ai"]', 0, 2.0, '2026-01-11 10:00:00', '2026-01-11 10:00:00'),
]


def seed_legacy_python_db(db_path: str):
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    if os.path.exists(db_path):
        os.remove(db_path)

    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    from sqlalchemy import create_engine
    from backend.models import Base
    engine = create_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(engine)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Users in Python
    cur.execute("""
        INSERT INTO users (id, google_id, email, name, picture, is_anonymous, created_at, updated_at)
        VALUES (1, 'dev_dev@local.user', 'dev@local.user', 'Dev User', 'https://api.dicebear.com/7.x/bottts/svg?seed=dev', 0, '2026-01-01 10:00:00', '2026-01-01 10:00:00')
    """)
    cur.execute("""
        INSERT INTO users (id, google_id, email, name, picture, is_anonymous, created_at, updated_at)
        VALUES (2, 'user2_user2@local.user', 'user2@local.user', 'Regular User', NULL, 0, '2026-01-02 10:00:00', '2026-01-02 10:00:00')
    """)
    cur.execute("""
        INSERT INTO users (id, google_id, email, name, picture, is_anonymous, created_at, updated_at)
        VALUES (3, 'shadow_test@example.com', 'test@example.com', 'Test User', NULL, 0, '2026-01-03 10:00:00', '2026-01-03 10:00:00')
    """)

    # Feature Flags
    cur.execute("INSERT INTO user_feature_flags (id, user_id, flag, created_at) VALUES (1, 1, 'api_access', '2026-01-01 10:00:00')")
    cur.execute("INSERT INTO user_feature_flags (id, user_id, flag, created_at) VALUES (2, 1, 'admin', '2026-01-01 10:00:00')")
    cur.execute("INSERT INTO user_feature_flags (id, user_id, flag, created_at) VALUES (3, 3, 'api_access', '2026-01-03 10:00:00')")
    cur.execute("INSERT INTO user_feature_flags (id, user_id, flag, created_at) VALUES (4, 3, 'admin', '2026-01-03 10:00:00')")

    # API Keys (Python uses key_prefix)
    cur.execute("""
        INSERT INTO api_keys (id, user_id, key_hash, name, key_prefix, created_at, request_count)
        VALUES (1, 1, ?, 'User 1 Main Key', 'lp_test1', '2026-01-01 10:00:00', 0)
    """, (KEY1_HASH,))
    cur.execute("""
        INSERT INTO api_keys (id, user_id, key_hash, name, key_prefix, created_at, request_count)
        VALUES (2, 2, ?, 'User 2 Key', 'lp_test2', '2026-01-02 10:00:00', 0)
    """, (KEY2_HASH,))

    # Settings
    cur.execute("INSERT INTO settings (\"key\", value, updated_at) VALUES ('locale', 'ru', '2026-01-01 10:00:00')")
    cur.execute("INSERT INTO settings (\"key\", value, updated_at) VALUES ('salary_display_format', 'month', '2026-01-01 10:00:00')")

    # Vacancies
    cur.executemany("""
        INSERT INTO vacancies (id, user_id, job_id, url, title, company, source, location, city, country, workplace_type, is_closed, salary_min, salary_max, salary_currency, salary_period, description, ai_summary, tech_stack, status, tags, lane, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, VACANCIES_DATA)

    # Vacancy Status History
    cur.execute("""
        INSERT INTO vacancy_status_history (id, vacancy_id, from_status, to_status, from_lane, to_lane, comment, created_at, updated_at)
        VALUES (1, 2, 'Еще не написал', 'Написал', 0, 0, 'Отправил отклик через форму', '2026-01-11 11:00:00', '2026-01-11 11:00:00')
    """)
    cur.execute("""
        INSERT INTO vacancy_status_history (id, vacancy_id, from_status, to_status, from_lane, to_lane, comment, created_at, updated_at)
        VALUES (2, 3, 'Еще не написал', 'Собеседование', 0, 0, 'Назначен скрининг с техлидом', '2026-01-12 12:00:00', '2026-01-12 12:00:00')
    """)
    cur.executemany("""
        INSERT INTO vacancy_status_history (id, vacancy_id, from_status, to_status, from_lane, to_lane, comment, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (3, 1, None, 'Еще не написал', None, None, None, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
        (4, 4, None, 'Тестовое', None, None, None, '2026-01-13 10:00:00', '2026-01-13 10:00:00'),
        (5, 5, None, 'Оффер', None, None, None, '2026-01-14 10:00:00', '2026-01-14 10:00:00'),
        (6, 6, None, 'Отказ', None, None, None, '2026-01-15 10:00:00', '2026-01-15 10:00:00'),
        (7, 101, None, 'Еще не написал', None, None, None, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
        (8, 102, None, 'Написал', None, None, None, '2026-01-11 10:00:00', '2026-01-11 10:00:00'),
    ])

    # Approved CV
    cur.execute("""
        INSERT INTO approved_cvs (id, user_id, content, parsed_profile, revision, approved_at, created_at, updated_at)
        VALUES (1, 1, 'Senior Software Engineer with 8+ years experience in Python, PostgreSQL, Docker, Microservices.', '{"skills": ["Python", "PostgreSQL", "Docker", "FastAPI"], "seniority": "Senior", "experience_years": 8}', 1, '2026-01-01 10:00:00', '2026-01-01 10:00:00', '2026-01-01 10:00:00')
    """)

    # Exchange Rates
    cur.execute("INSERT INTO exchange_rates (id, source_currency, target_currency, rate, updated_at) VALUES (1, 'USD', 'EUR', 0.92, '2026-01-01 10:00:00')")
    cur.execute("INSERT INTO exchange_rates (id, source_currency, target_currency, rate, updated_at) VALUES (2, 'EUR', 'USD', 1.09, '2026-01-01 10:00:00')")
    cur.execute("INSERT INTO exchange_rates (id, source_currency, target_currency, rate, updated_at) VALUES (3, 'USD', 'RUB', 92.50, '2026-01-01 10:00:00')")

    conn.commit()
    conn.close()
    print(f"[OK] Seeded Python Legacy database at: {db_path}")


def seed_symfony_db(db_path: str):
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    if os.path.exists(db_path):
        os.remove(db_path)

    import shutil
    cache_dir = os.path.join(base_dir, "backend-symfony", "var", "cache")
    if os.path.exists(cache_dir):
        shutil.rmtree(cache_dir, ignore_errors=True)

    import subprocess
    cmd = ["php", "bin/console", "doctrine:schema:create"]
    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///{os.path.abspath(db_path)}"
    subprocess.run(cmd, cwd=os.path.join(base_dir, "backend-symfony"), env=env, check=True)
    subprocess.run(["php", "bin/console", "messenger:setup-transports"], cwd=os.path.join(base_dir, "backend-symfony"), env=env, check=True)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Seed Users
    cur.execute("""
        INSERT INTO users (id, email, name, avatar, is_admin, roles, is_anonymous, created_at, updated_at)
        VALUES (1, 'dev@local.user', 'Dev User', 'https://api.dicebear.com/7.x/bottts/svg?seed=dev', 1, '["ROLE_USER", "ROLE_ADMIN"]', 0, '2026-01-01 10:00:00', '2026-01-01 10:00:00')
    """)
    cur.execute("""
        INSERT INTO users (id, email, name, avatar, is_admin, roles, is_anonymous, created_at, updated_at)
        VALUES (2, 'user2@local.user', 'Regular User', NULL, 0, '["ROLE_USER"]', 0, '2026-01-02 10:00:00', '2026-01-02 10:00:00')
    """)
    cur.execute("""
        INSERT INTO users (id, email, name, avatar, is_admin, roles, is_anonymous, created_at, updated_at)
        VALUES (3, 'test@example.com', 'Test User', NULL, 1, '["ROLE_USER", "ROLE_ADMIN"]', 0, '2026-01-03 10:00:00', '2026-01-03 10:00:00')
    """)

    # Feature Flags
    cur.execute("INSERT INTO user_feature_flags (id, user_id, flag, created_at) VALUES (1, 1, 'api_access', '2026-01-01 10:00:00')")
    cur.execute("INSERT INTO user_feature_flags (id, user_id, flag, created_at) VALUES (2, 1, 'admin', '2026-01-01 10:00:00')")
    cur.execute("INSERT INTO user_feature_flags (id, user_id, flag, created_at) VALUES (3, 3, 'api_access', '2026-01-03 10:00:00')")
    cur.execute("INSERT INTO user_feature_flags (id, user_id, flag, created_at) VALUES (4, 3, 'admin', '2026-01-03 10:00:00')")

    # API Keys (Symfony uses prefix)
    cur.execute("""
        INSERT INTO api_keys (id, user_id, key_hash, name, prefix, created_at, request_count)
        VALUES (1, 1, ?, 'User 1 Main Key', 'lp_test1', '2026-01-01 10:00:00', 0)
    """, (KEY1_HASH,))
    cur.execute("""
        INSERT INTO api_keys (id, user_id, key_hash, name, prefix, created_at, request_count)
        VALUES (2, 2, ?, 'User 2 Key', 'lp_test2', '2026-01-02 10:00:00', 0)
    """, (KEY2_HASH,))

    # User Settings
    cur.execute("INSERT INTO user_settings (id, user_id, \"key\", value, updated_at) VALUES (1, 1, 'locale', 'ru', '2026-01-01 10:00:00')")
    cur.execute("INSERT INTO user_settings (id, user_id, \"key\", value, updated_at) VALUES (2, 1, 'salary_display_format', 'month', '2026-01-01 10:00:00')")

    # Vacancies
    cur.executemany("""
        INSERT INTO vacancies (id, user_id, job_id, url, title, company, source, location, city, country, workplace_type, is_closed, salary_min, salary_max, salary_currency, salary_period, description, ai_summary, tech_stack, status, tags, lane, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, VACANCIES_DATA)

    # Vacancy Status History
    cur.execute("""
        INSERT INTO vacancy_status_history (id, vacancy_id, from_status, to_status, from_lane, to_lane, comment, created_at, updated_at)
        VALUES (1, 2, 'Еще не написал', 'Написал', 0, 0, 'Отправил отклик через форму', '2026-01-11 11:00:00', '2026-01-11 11:00:00')
    """)
    cur.execute("""
        INSERT INTO vacancy_status_history (id, vacancy_id, from_status, to_status, from_lane, to_lane, comment, created_at, updated_at)
        VALUES (2, 3, 'Еще не написал', 'Собеседование', 0, 0, 'Назначен скрининг с техлидом', '2026-01-12 12:00:00', '2026-01-12 12:00:00')
    """)
    cur.executemany("""
        INSERT INTO vacancy_status_history (id, vacancy_id, from_status, to_status, from_lane, to_lane, comment, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (3, 1, None, 'Еще не написал', None, None, None, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
        (4, 4, None, 'Тестовое', None, None, None, '2026-01-13 10:00:00', '2026-01-13 10:00:00'),
        (5, 5, None, 'Оффер', None, None, None, '2026-01-14 10:00:00', '2026-01-14 10:00:00'),
        (6, 6, None, 'Отказ', None, None, None, '2026-01-15 10:00:00', '2026-01-15 10:00:00'),
        (7, 101, None, 'Еще не написал', None, None, None, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
        (8, 102, None, 'Написал', None, None, None, '2026-01-11 10:00:00', '2026-01-11 10:00:00'),
    ])

    # Approved CV for User 1
    cur.execute("""
        INSERT INTO approved_cvs (id, user_id, content, parsed_profile, revision, approved_at, created_at, updated_at)
        VALUES (1, 1, 'Senior Software Engineer with 8+ years experience in Python, PostgreSQL, Docker, Microservices.', '{"skills": ["Python", "PostgreSQL", "Docker", "FastAPI"], "seniority": "Senior", "experience_years": 8}', 1, '2026-01-01 10:00:00', '2026-01-01 10:00:00', '2026-01-01 10:00:00')
    """)

    # Exchange Rates
    cur.execute("INSERT INTO exchange_rates (id, source_currency, target_currency, rate, updated_at) VALUES (1, 'USD', 'EUR', 0.92, '2026-01-01 10:00:00')")
    cur.execute("INSERT INTO exchange_rates (id, source_currency, target_currency, rate, updated_at) VALUES (2, 'EUR', 'USD', 1.09, '2026-01-01 10:00:00')")
    cur.execute("INSERT INTO exchange_rates (id, source_currency, target_currency, rate, updated_at) VALUES (3, 'USD', 'RUB', 92.50, '2026-01-01 10:00:00')")

    conn.commit()
    conn.close()
    print(f"[OK] Seeded Symfony database at: {db_path}")


if __name__ == "__main__":
    legacy_db = os.path.join(base_dir, "data", "legacy", "app.db")
    symfony_db = os.path.join(base_dir, "backend-symfony", "var", "app.db")

    seed_legacy_python_db(legacy_db)
    seed_symfony_db(symfony_db)
