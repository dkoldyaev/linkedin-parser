import os
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db, Base, engine, SessionLocal
from backend.models import User, Vacancy, ApiToken
import hashlib

@pytest.fixture
def client():
    # Setup test DB tables
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c

def test_api_token_creation_and_auth(client):
    db = SessionLocal()
    try:
        # Create user
        user1 = db.query(User).filter(User.email == "mcp_user1@example.com").first()
        if not user1:
            user1 = User(email="mcp_user1@example.com", google_id="mcp_user1_gid", name="MCP User 1")
            db.add(user1)
            db.commit()
            db.refresh(user1)

        # Login as user1
        res = client.post("/api/auth/dev-login", json={"email": "mcp_user1@example.com", "name": "MCP User 1"})
        assert res.status_code == 200
        auth_token1 = res.json()["token"]

        # Create API token
        create_res = client.post(
            "/api/tokens",
            json={"name": "Claude Desktop Token"},
            headers={"Authorization": f"Bearer {auth_token1}"}
        )
        assert create_res.status_code == 200
        token_data = create_res.json()
        assert "token" in token_data
        assert token_data["token"].startswith("mcp_")
        assert token_data["name"] == "Claude Desktop Token"
        token_id = token_data["id"]
        raw_token = token_data["token"]

        # List tokens
        list_res = client.get("/api/tokens", headers={"Authorization": f"Bearer {auth_token1}"})
        assert list_res.status_code == 200
        tokens_list = list_res.json()
        assert any(t["id"] == token_id for t in tokens_list)

        # Test calling API with X-API-Key
        vac_res = client.get("/api/vacancies", headers={"X-API-Key": raw_token})
        assert vac_res.status_code == 200

        # Test calling API with Authorization: Bearer
        vac_bearer_res = client.get("/api/vacancies", headers={"Authorization": f"Bearer {raw_token}"})
        assert vac_bearer_res.status_code == 200

        # Create a vacancy using the API token
        new_vac = client.post(
            "/api/vacancies",
            headers={"X-API-Key": raw_token},
            json={
                "title": "Senior Python Engineer",
                "company": "Anthropic",
                "url": "https://example.com/jobs/123",
                "status": "Еще не написан",
            }
        )
        assert new_vac.status_code == 200
        vac_data = new_vac.json()
        assert vac_data["title"] == "Senior Python Engineer"
        assert vac_data["user_id"] == user1.id

        # Verify user isolation: another user cannot see this vacancy
        user2 = db.query(User).filter(User.email == "mcp_user2@example.com").first()
        if not user2:
            user2 = User(email="mcp_user2@example.com", google_id="mcp_user2_gid", name="MCP User 2")
            db.add(user2)
            db.commit()
            db.refresh(user2)

        res2 = client.post("/api/auth/dev-login", json={"email": "mcp_user2@example.com", "name": "MCP User 2"})
        auth_token2 = res2.json()["token"]
        token2_res = client.post(
            "/api/tokens",
            json={"name": "User 2 Token"},
            headers={"Authorization": f"Bearer {auth_token2}"}
        )
        user2_token = token2_res.json()["token"]

        vac_user2 = client.get("/api/vacancies", headers={"X-API-Key": user2_token}).json()
        assert not any(v["id"] == vac_data["id"] for v in vac_user2)

        # Revoke/delete token as user1
        del_res = client.delete(f"/api/tokens/{token_id}", headers={"Authorization": f"Bearer {auth_token1}"})
        assert del_res.status_code == 200

        # Request with revoked token should fail (401)
        fail_res = client.get("/api/vacancies", headers={"X-API-Key": raw_token})
        assert fail_res.status_code == 401

    finally:
        db.close()


def test_expired_token(client):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "expired_test@example.com").first()
        if not user:
            user = User(email="expired_test@example.com", google_id="expired_gid", name="Expired Test")
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create already expired token directly in DB with unique hash
        import secrets
        secret = f"mcp_expired_{secrets.token_hex(16)}"
        token_hash = hashlib.sha256(secret.encode()).hexdigest()
        expired_token = ApiToken(
            user_id=user.id,
            name="Expired Token",
            token_hash=token_hash,
            token_prefix="mcp_alre...",
            expires_at=datetime.utcnow() - timedelta(days=1),
        )
        db.add(expired_token)
        db.commit()

        # Try to use expired token
        res = client.get("/api/vacancies", headers={"X-API-Key": secret})
        assert res.status_code == 401
    finally:
        db.close()


@pytest.mark.anyio
async def test_mcp_tools_integration():
    import httpx
    import secrets
    from backend.mcp_server import (
        mcp,
        JobTrackerClient,
        set_client,
        list_vacancies,
        get_vacancy,
        create_vacancy,
        update_vacancy,
        delete_vacancy,
        get_stats,
        get_columns,
        get_tags,
        check_duplicates,
        add_status_history,
    )

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "mcp_tool_test@example.com").first()
        if not user:
            user = User(email="mcp_tool_test@example.com", google_id="mcp_tool_gid", name="MCP Tool Tester")
            db.add(user)
            db.commit()
            db.refresh(user)

        token_raw = f"mcp_{secrets.token_hex(24)}"
        token_hash = hashlib.sha256(token_raw.encode()).hexdigest()
        api_token = ApiToken(
            user_id=user.id,
            name="Tool Test Token",
            token_hash=token_hash,
            token_prefix="mcp_tool...",
        )
        db.add(api_token)
        db.commit()

        # Custom JobTrackerClient using ASGITransport
        transport = httpx.ASGITransport(app=app)
        class TestJobTrackerClient(JobTrackerClient):
            async def _request(self, method: str, path: str, **kwargs):
                url = f"http://test{path}"
                headers = {**self._get_headers(), **kwargs.pop("headers", {})}
                timeout = kwargs.pop("timeout", 30.0)
                async with httpx.AsyncClient(transport=transport, base_url="http://test", timeout=timeout) as ac:
                    res = await ac.request(method, url, headers=headers, **kwargs)
                    if res.status_code == 401:
                        raise RuntimeError("401 Unauthorized")
                    if res.status_code == 404:
                        raise RuntimeError("404 Not Found")
                    if not res.is_success:
                        raise RuntimeError(f"Error {res.status_code}: {res.text}")
                    if res.status_code == 204 or not res.content:
                        return None
                    return res.json()

        test_client_instance = TestJobTrackerClient(base_url="http://test", api_key=token_raw)
        import backend.mcp_server
        backend.mcp_server.client = test_client_instance

        # Test 1: create_vacancy tool
        created_str = await create_vacancy(
            url="https://linkedin.com/jobs/view/999999",
            title="Senior AI Engineer",
            company="DeepMind",
            location="London, UK",
            salary_min=120000,
            salary_max=180000,
            salary_currency="£",
            salary_period="year",
            tags=["AI", "Python"],
            notes="Initial contact via recruiter",
        )
        assert "Successfully created vacancy" in created_str
        assert "Senior AI Engineer" in created_str

        # Test 2: list_vacancies tool
        vacancies_str = await list_vacancies(status="Еще не написан")
        assert "Found 1 vacancy(ies)" in vacancies_str
        assert "Senior AI Engineer" in vacancies_str
        assert "DeepMind" in vacancies_str

        # Extract vacancy ID
        import re
        match = re.search(r"ID: (\d+)", vacancies_str)
        assert match is not None
        vac_id = int(match.group(1))

        # Test 3: get_vacancy tool
        detail_str = await get_vacancy(vacancy_id=vac_id)
        assert "Senior AI Engineer" in detail_str
        assert "London, UK" in detail_str
        assert "Initial contact via recruiter" in detail_str

        # Test 4: update_vacancy tool
        updated_str = await update_vacancy(
            vacancy_id=vac_id,
            status="Собеседование",
            notes="Passed screening round, final interview next week",
        )
        assert "updated successfully" in updated_str
        assert "Собеседование" in updated_str

        # Test 5: add_status_history tool
        hist_str = await add_status_history(
            vacancy_id=vac_id,
            to_status="Собеседование",
            comment="Round 1 interview scheduled",
        )
        assert "Status change recorded" in hist_str

        # Test 6: get_stats tool
        stats_str = await get_stats()
        assert "Job Application Statistics" in stats_str

        # Test 7: get_columns tool
        cols_str = await get_columns()
        assert "Active Kanban Columns" in cols_str
        assert "Еще не написан" in cols_str

        # Test 8: get_tags tool
        tags_str = await get_tags()
        assert "AI" in tags_str

        # Test 9: check_duplicates tool
        dupes_str = await check_duplicates(urls=["https://linkedin.com/jobs/view/999999"])
        assert "Found 1 duplicate" in dupes_str

        # Test 10: delete_vacancy tool
        del_str = await delete_vacancy(vacancy_id=vac_id)
        assert f"Vacancy {vac_id} has been permanently deleted" in del_str

    finally:
        db.close()

