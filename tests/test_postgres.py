"""Storage contract. The same tests run against PostgreSQL in the Docker e2e suite."""
from sqlalchemy import text
from backend.database import engine


def test_database_connection():
    with engine.connect() as connection:
        assert connection.execute(text("SELECT 1")).scalar_one() == 1
