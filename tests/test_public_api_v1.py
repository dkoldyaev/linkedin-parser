import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import User, Vacancy, ApiKey
from backend.database import SessionLocal
from backend.auth import create_access_token

@pytest.fixture
def api_user_fixture():
    db = SessionLocal()
    existing_user = db.query(User).filter(User.email == "public_api_user@test.com").first()
    if existing_user:
        db.query(Vacancy).filter(Vacancy.user_id == existing_user.id).delete()
        db.query(ApiKey).filter(ApiKey.user_id == existing_user.id).delete()
        db.delete(existing_user)
        db.commit()

    user = User(
        google_id="public_api_user",
        email="public_api_user@test.com",
        name="Public API User"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    client = TestClient(app)
    # Generate API key for this user
    jwt_token = create_access_token({"sub": str(user.id)})
    res = client.post("/api/api-keys", json={"name": "Public Key"}, headers={"Authorization": f"Bearer {jwt_token}"})
    raw_api_key = res.json()["token"]

    yield user, raw_api_key, jwt_token

    db = SessionLocal()
    cleanup_user = db.query(User).filter(User.email == "public_api_user@test.com").first()
    if cleanup_user:
        db.query(Vacancy).filter(Vacancy.user_id == cleanup_user.id).delete()
        db.query(ApiKey).filter(ApiKey.user_id == cleanup_user.id).delete()
        db.delete(cleanup_user)
        db.commit()
    db.close()

def test_system_vs_public_api_docs():
    client = TestClient(app)

    # 1. System API documentation is NOT exposed; /docs, /redoc, /openapi.json redirect to public API
    r_docs = client.get("/docs", follow_redirects=False)
    assert r_docs.status_code == 307
    assert r_docs.headers["location"] == "/api/v1/docs"

    r_redoc = client.get("/redoc", follow_redirects=False)
    assert r_redoc.status_code == 307
    assert r_redoc.headers["location"] == "/api/v1/redoc"

    r_schema = client.get("/openapi.json", follow_redirects=False)
    assert r_schema.status_code == 307
    assert r_schema.headers["location"] == "/api/v1/openapi.json"

    # 2. Public API OpenAPI documentation at /api/v1/openapi.json exists
    res_pub_schema = client.get("/api/v1/openapi.json")
    assert res_pub_schema.status_code == 200
    schema = res_pub_schema.json()

    # Documentation must be specifically for Public API
    assert "Job Vacancies Public API" in schema["info"]["title"]
    paths = schema["paths"]

    # Must contain public endpoints
    assert "/vacancies" in paths
    assert "/vacancies/{vacancy_id}" in paths
    assert "/columns" in paths
    assert "/tags" in paths

    # Must NOT contain system or internal auth endpoints!
    assert "/api/auth/dev-login" not in paths
    assert "/api/auth/google/login" not in paths
    assert "/api/auth/google/callback" not in paths
    assert "/api/auth/config" not in paths
    assert "/api/auth/me" not in paths
    assert "/api/auth/logout" not in paths
    assert "/api/extension/ping" not in paths
    assert "/api/extension/tasks" not in paths

    # Verify security schemes define API Key
    sec_schemes = schema.get("components", {}).get("securitySchemes", {})
    assert "APIKeyHeader" in sec_schemes or any(v.get("type") == "apiKey" for v in sec_schemes.values())

def test_public_api_access_control(api_user_fixture):
    user, raw_api_key, jwt_token = api_user_fixture
    client = TestClient(app)

    # 1. Unauthenticated request to Public API -> 401
    res_no_auth = client.get("/api/v1/vacancies")
    assert res_no_auth.status_code == 401

    # 2. Using JWT token directly on Public API -> 401 (Public API strictly requires API key!)
    res_jwt = client.get("/api/v1/vacancies", headers={"Authorization": f"Bearer {jwt_token}"})
    assert res_jwt.status_code == 401

    # 3. Using invalid API key -> 401
    res_bad_key = client.get("/api/v1/vacancies", headers={"X-API-Key": "ak_invalid_key_12345"})
    assert res_bad_key.status_code == 401

    # 4. Using valid API key via X-API-Key header -> 200
    res_ok = client.get("/api/v1/vacancies", headers={"X-API-Key": raw_api_key})
    assert res_ok.status_code == 200
    assert res_ok.json() == []

    # 5. Using valid API key via Authorization: Bearer ak_... -> 200
    res_bearer_ok = client.get("/api/v1/vacancies", headers={"Authorization": f"Bearer {raw_api_key}"})
    assert res_bearer_ok.status_code == 200

    # 6. Create vacancy via Public API
    create_res = client.post("/api/v1/vacancies", json={
        "title": "Public API Engineer",
        "company": "OpenAPI Corp",
        "url": "https://www.linkedin.com/jobs/view/11223344",
        "tags": ["public", "fastapi"]
    }, headers={"X-API-Key": raw_api_key})
    assert create_res.status_code == 200
    vac_id = create_res.json()["id"]

    # 7. Get vacancy by ID
    get_res = client.get(f"/api/v1/vacancies/{vac_id}", headers={"X-API-Key": raw_api_key})
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Public API Engineer"

    # 8. Update vacancy
    patch_res = client.patch(f"/api/v1/vacancies/{vac_id}", json={
        "status": "Написал",
        "notes": "Contacted via recruiter"
    }, headers={"X-API-Key": raw_api_key})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "Написал"

    # 9. List metadata
    assert "public" in client.get("/api/v1/tags", headers={"X-API-Key": raw_api_key}).json()
    assert len(client.get("/api/v1/columns", headers={"X-API-Key": raw_api_key}).json()) > 0

    # 10. Delete vacancy
    del_res = client.delete(f"/api/v1/vacancies/{vac_id}", headers={"X-API-Key": raw_api_key})
    assert del_res.status_code == 204
