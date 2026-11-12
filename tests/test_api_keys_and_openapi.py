import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import User, ApiKey, UserFeatureFlag
from backend.database import SessionLocal
from backend.auth import create_access_token

@pytest.fixture
def test_user():
    db = SessionLocal()
    user = db.query(User).filter(User.google_id == "test_apikey_user").first()
    if not user:
        user = User(
            google_id="test_apikey_user",
            email="apikey_test@example.com",
            name="API Key Tester",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Ensure api_access flag
    flag = db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id == user.id, UserFeatureFlag.flag == "api_access").first()
    if not flag:
        db.add(UserFeatureFlag(user_id=user.id, flag="api_access"))
        db.commit()

    yield user
    # cleanup
    db.query(ApiKey).filter(ApiKey.user_id == user.id).delete()
    db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id == user.id).delete()
    db.query(User).filter(User.id == user.id).delete()
    db.commit()
    db.close()

def test_openapi_endpoints(test_user):
    client = TestClient(app)
    jwt_token = create_access_token({"sub": str(test_user.id)})
    headers = {"Authorization": f"Bearer {jwt_token}"}

    # /openapi.json redirects to public API openapi.json (requires api_access flag)
    res = client.get("/openapi.json", headers=headers)
    assert res.status_code == 200
    schema = res.json()
    assert "openapi" in schema
    # Public API paths are exposed without /api/v2/api-keys or internal auth
    assert "/api/v2/vacancies" in schema["paths"]
    assert "/api/v2/columns" in schema["paths"]
    assert "/api/v2/api-keys" in schema["paths"]  # unified v2 API includes key management

    # /docs
    res_docs = client.get("/docs", headers=headers)
    assert res_docs.status_code == 200
    assert "swagger" in res_docs.text.lower() or "html" in res_docs.text.lower()

    # /redoc
    res_redoc = client.get("/redoc", headers=headers)
    assert res_redoc.status_code == 200
    assert "redoc" in res_redoc.text.lower() or "html" in res_redoc.text.lower()

def test_api_key_crud_and_auth(test_user):
    client = TestClient(app)
    jwt_token = create_access_token({"sub": str(test_user.id)})
    headers = {"Authorization": f"Bearer {jwt_token}"}

    # 1. Initially no API keys
    res = client.get("/api/v2/api-keys", headers=headers)
    assert res.status_code == 200
    assert res.json() == []

    # 2. Create API key
    res = client.post("/api/v2/api-keys", json={"name": "CLI Script Key"}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "CLI Script Key"
    assert "token" in data
    raw_token = data["token"]
    assert raw_token.startswith("ak_")
    key_id = data["id"]

    # 3. List keys - raw token is not stored or exposed
    res = client.get("/api/v2/api-keys", headers=headers)
    assert res.status_code == 200
    keys_list = res.json()
    assert len(keys_list) == 1
    assert keys_list[0]["id"] == key_id
    assert "token" not in keys_list[0]
    assert keys_list[0]["key_prefix"] == raw_token[:10]

    # 4. Use API key via X-API-Key header to access protected route
    api_client = TestClient(app)
    res_auth = api_client.get("/api/v2/auth/me", headers={"X-API-Key": raw_token})
    assert res_auth.status_code == 200
    assert res_auth.json()["email"] == "apikey_test@example.com"

    # 5. Use API key via Authorization: Bearer ak_...
    res_auth_bearer = api_client.get("/api/v2/auth/me", headers={"Authorization": f"Bearer {raw_token}"})
    assert res_auth_bearer.status_code == 200
    assert res_auth_bearer.json()["email"] == "apikey_test@example.com"

    # 6. Verify last_used_at is updated
    res = client.get("/api/v2/api-keys", headers=headers)
    assert res.json()[0]["last_used_at"] is not None

    # 7. Revoke API key
    res = client.delete(f"/api/v2/api-keys/{key_id}", headers=headers)
    assert res.status_code == 200

    # 8. Request with revoked API key should fail
    res_revoked = api_client.get("/api/v2/auth/me", headers={"X-API-Key": raw_token})
    assert res_revoked.status_code == 401
