#!/usr/bin/env python3
"""
Launcher for Python FastAPI backend using fakeredis for self-contained shadow testing.
"""
import os
import sys

# Set environment before any imports
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)
os.environ["PORT"] = "8000"
os.environ["DATA_DIR"] = os.path.join(base_dir, "data", "legacy")
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(base_dir, 'data', 'legacy', 'app.db')}"
os.environ["DEV_AUTH"] = "true"
os.environ["CREATE_MOCK_DATA"] = "false"
os.environ["LLM_PROVIDER"] = "mock"
os.environ["APP_URL"] = "http://localhost:8000"
os.environ["MERCURE_JWT_SECRET"] = "f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5"
os.environ["MERCURE_URL"] = "https://test-symfony.linkedinparser.build.dkoldyaev.com/.well-known/mercure"
os.environ["MERCURE_PUBLIC_URL"] = "https://test-symfony.linkedinparser.build.dkoldyaev.com/.well-known/mercure"
os.environ["JWT_SECRET"] = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"

import fakeredis.aioredis
from backend.queue_manager import queue_manager

fake_r = fakeredis.aioredis.FakeRedis(decode_responses=True)
queue_manager.redis = fake_r

async def mock_start():
    queue_manager.redis = fake_r
    queue_manager._running = True

async def mock_stop():
    queue_manager._running = False

queue_manager.start = mock_start
queue_manager.stop = mock_stop

import uvicorn
from backend.main import app

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")
