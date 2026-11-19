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
os.environ["MERCURE_JWT_SECRET"] = "4e0df8bb0b1c0b3967d1656096a603954e0df8bb0b1c0b3967d1656096a60395"
os.environ["MERCURE_PUBLIC_URL"] = "https://example.com/.well-known/mercure"
os.environ["JWT_SECRET"] = "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b"

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
