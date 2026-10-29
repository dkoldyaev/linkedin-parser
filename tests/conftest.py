import pytest
import fakeredis.aioredis
from unittest.mock import AsyncMock
from backend.queue_manager import queue_manager

@pytest.fixture(autouse=True)
def mock_redis_for_tests(monkeypatch):
    fake_r = fakeredis.aioredis.FakeRedis(decode_responses=True)
    queue_manager.redis = fake_r
    
    async def mock_start():
        queue_manager.redis = fake_r
        queue_manager._running = True

    async def mock_stop():
        queue_manager._running = False

    monkeypatch.setattr(queue_manager, "start", mock_start)
    monkeypatch.setattr(queue_manager, "stop", mock_stop)
