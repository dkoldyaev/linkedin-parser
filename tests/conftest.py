"""Hermetic test environment; never connect to the developer's database or broker."""
import os
import secrets
import tempfile
from unittest.mock import AsyncMock

_TEST_DATA = tempfile.TemporaryDirectory(prefix="linkedin-tests-")
os.environ["DATABASE_URL"] = ""
os.environ["DATA_DIR"] = _TEST_DATA.name
os.environ["DEV_AUTH"] = "true"
os.environ["APP_URL"] = "http://localhost:8000"
os.environ["JWT_SECRET"] = secrets.token_urlsafe(48)
os.environ["MERCURE_JWT_SECRET"] = secrets.token_urlsafe(48)
os.environ["CREATE_MOCK_DATA"] = "false"
os.environ["MISTRAL_API_KEY"] = ""
os.environ["GEMINI_API_KEY"] = ""
os.environ["PARSER_API_URL"] = ""
os.environ["ADMIN_EMAILS"] = ""

import pytest
import fakeredis.aioredis
from backend.database import engine, Base
from backend.queue_manager import queue_manager

@pytest.fixture(autouse=True)
def isolated_services(monkeypatch):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    fake_r = fakeredis.aioredis.FakeRedis(decode_responses=True)
    queue_manager.redis = fake_r
    async def mock_start():
        queue_manager.redis = fake_r
        queue_manager._running = True
    async def mock_stop():
        queue_manager._running = False
    monkeypatch.setattr(queue_manager, "start", mock_start)
    monkeypatch.setattr(queue_manager, "stop", mock_stop)
    for module in ("backend.main", "backend.queue_manager", "backend.public_api"):
        monkeypatch.setattr(f"{module}.publish_mercure_event", AsyncMock(return_value=True))
    yield
    queue_manager.redis = None
    queue_manager._running = False
