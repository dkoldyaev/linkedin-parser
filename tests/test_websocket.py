import json
import pytest
import hashlib
import secrets
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import engine, Base, SessionLocal
from backend.models import User, ApiToken
from backend.mercure import publish_mercure_event, EVENT_VACANCY_CREATED, EVENT_VACANCY_UPDATED

@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c

def test_websocket_connection_and_events(client):
    db = SessionLocal()
    try:
        user1 = db.query(User).filter(User.email == "ws_user1@example.com").first()
        if not user1:
            user1 = User(email="ws_user1@example.com", google_id="ws_user1_gid", name="WS User 1")
            db.add(user1)
            db.commit()
            db.refresh(user1)

        token1_raw = f"mcp_{secrets.token_hex(24)}"
        token1_hash = hashlib.sha256(token1_raw.encode()).hexdigest()
        token1 = ApiToken(
            user_id=user1.id,
            name="WS Token 1",
            token_hash=token1_hash,
            token_prefix="mcp_ws1...",
        )
        db.add(token1)
        db.commit()

        # Connect to WebSocket with token query param
        with client.websocket_connect(f"/api/ws?token={token1_raw}") as websocket:
            # 1. Check initial connection packet
            init_msg = websocket.receive_json()
            assert init_msg["type"] == "connected"
            assert init_msg["user_id"] == user1.id

            # 2. Check ping-pong
            websocket.send_text(json.dumps({"type": "ping"}))
            pong_msg = websocket.receive_json()
            assert pong_msg["type"] == "pong"

            # 3. Test real-time broadcast via publish_mercure_event
            import asyncio
            asyncio.run(publish_mercure_event(
                event_type=EVENT_VACANCY_CREATED,
                data={
                    "vacancy": {
                        "id": 101,
                        "title": "Realtime React Dev",
                        "company": "Tech Corp",
                        "status": "Еще не написан"
                    }
                },
                topic=f"vacancies:{user1.id}"
            ))

            event_msg = websocket.receive_json()
            assert event_msg["type"] == EVENT_VACANCY_CREATED
            assert event_msg["vacancy"]["title"] == "Realtime React Dev"

    finally:
        db.close()


def test_websocket_user_isolation(client):
    db = SessionLocal()
    try:
        user_a = db.query(User).filter(User.email == "ws_a@example.com").first()
        if not user_a:
            user_a = User(email="ws_a@example.com", google_id="ws_a_gid", name="WS A")
            db.add(user_a)
            db.commit()
            db.refresh(user_a)

        token_a_raw = f"mcp_{secrets.token_hex(24)}"
        token_a = ApiToken(
            user_id=user_a.id,
            name="WS A Token",
            token_hash=hashlib.sha256(token_a_raw.encode()).hexdigest(),
            token_prefix="mcp_wsa...",
        )
        db.add(token_a)
        db.commit()

        user_b = db.query(User).filter(User.email == "ws_b@example.com").first()
        if not user_b:
            user_b = User(email="ws_b@example.com", google_id="ws_b_gid", name="WS B")
            db.add(user_b)
            db.commit()
            db.refresh(user_b)

        token_b_raw = f"mcp_{secrets.token_hex(24)}"
        token_b = ApiToken(
            user_id=user_b.id,
            name="WS B Token",
            token_hash=hashlib.sha256(token_b_raw.encode()).hexdigest(),
            token_prefix="mcp_wsb...",
        )
        db.add(token_b)
        db.commit()

        # Connect user B
        with client.websocket_connect(f"/api/ws?token={token_b_raw}") as ws_b:
            init_b = ws_b.receive_json()
            assert init_b["user_id"] == user_b.id

            # Broadcast event specifically for User A
            import asyncio
            asyncio.run(publish_mercure_event(
                event_type=EVENT_VACANCY_UPDATED,
                data={"vacancy": {"id": 202, "title": "Secret Job A"}},
                topic=f"vacancies:{user_a.id}"
            ))

            # Send ping from user B to ensure stream is flushed and verify no user A event arrived
            ws_b.send_text(json.dumps({"type": "ping"}))
            res = ws_b.receive_json()
            assert res["type"] == "pong"  # User B got pong, did NOT receive User A's private event

    finally:
        db.close()
