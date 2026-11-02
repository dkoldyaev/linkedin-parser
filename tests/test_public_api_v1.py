import pytest
from fastapi.testclient import TestClient
from backend.main import app, queue_manager
from backend.models import User, Vacancy, ApiKey, UserFeatureFlag, ApprovedCV, VacancyCVAnalysis
from backend.database import SessionLocal
from backend.auth import create_access_token
import datetime

@pytest.fixture
def api_user_fixture():
    db = SessionLocal()
    existing_user = db.query(User).filter(User.email == "public_api_user@test.com").first()
    if existing_user:
        db.query(VacancyCVAnalysis).filter(VacancyCVAnalysis.user_id == existing_user.id).delete()
        db.query(ApprovedCV).filter(ApprovedCV.user_id == existing_user.id).delete()
        db.query(Vacancy).filter(Vacancy.user_id == existing_user.id).delete()
        db.query(ApiKey).filter(ApiKey.user_id == existing_user.id).delete()
        db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id == existing_user.id).delete()
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

    # Grant api_access feature flag
    db.add(UserFeatureFlag(user_id=user.id, flag="api_access"))
    db.commit()

    client = TestClient(app)
    # Generate API key for this user
    jwt_token = create_access_token({"sub": str(user.id)})
    res = client.post("/api/api-keys", json={"name": "Public Key"}, headers={"Authorization": f"Bearer {jwt_token}"})
    raw_api_key = res.json()["token"]

    yield user, raw_api_key, jwt_token

    db = SessionLocal()
    cleanup_user = db.query(User).filter(User.email == "public_api_user@test.com").first()
    if cleanup_user:
        db.query(VacancyCVAnalysis).filter(VacancyCVAnalysis.user_id == cleanup_user.id).delete()
        db.query(ApprovedCV).filter(ApprovedCV.user_id == cleanup_user.id).delete()
        db.query(Vacancy).filter(Vacancy.user_id == cleanup_user.id).delete()
        db.query(ApiKey).filter(ApiKey.user_id == cleanup_user.id).delete()
        db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id == cleanup_user.id).delete()
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
    assert "/vacancies/{vacancy_id}/history" in paths
    assert "/vacancies/{vacancy_id}/compatibility" in paths
    assert "/vacancies/batch" in paths
    assert "/queue/tasks/{task_id}" in paths
    assert "/cv" in paths
    assert "/countries" in paths
    assert "/cities" in paths
    assert "/columns" in paths
    assert "/tags" in paths
    assert "/sources" in paths

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
        "tags": ["public", "fastapi"],
        "city": "Berlin",
        "country": "Germany"
    }, headers={"X-API-Key": raw_api_key})
    assert create_res.status_code == 200
    vac_id = create_res.json()["id"]

    # Duplicate creation check
    dup_res = client.post("/api/v1/vacancies", json={
        "title": "Duplicate Engineer",
        "company": "Another Corp",
        "url": "https://www.linkedin.com/jobs/view/11223344",
    }, headers={"X-API-Key": raw_api_key})
    assert dup_res.status_code == 409

    # 7. Get vacancy by ID
    get_res = client.get(f"/api/v1/vacancies/{vac_id}", headers={"X-API-Key": raw_api_key})
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Public API Engineer"

    # 8. Update vacancy and check history
    patch_res = client.patch(f"/api/v1/vacancies/{vac_id}", json={
        "status": "Написал",
        "notes": "Contacted via recruiter"
    }, headers={"X-API-Key": raw_api_key})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "Написал"

    hist_res = client.get(f"/api/v1/vacancies/{vac_id}/history", headers={"X-API-Key": raw_api_key})
    assert hist_res.status_code == 200
    assert len(hist_res.json()) >= 2  # initial create + status update

    # 9. List metadata (tags, columns, countries, cities)
    assert "public" in client.get("/api/v1/tags", headers={"X-API-Key": raw_api_key}).json()
    assert len(client.get("/api/v1/columns", headers={"X-API-Key": raw_api_key}).json()) > 0
    assert "Germany" in client.get("/api/v1/countries", headers={"X-API-Key": raw_api_key}).json()
    assert "Berlin" in client.get("/api/v1/cities", headers={"X-API-Key": raw_api_key}).json()

    # 10. Check pagination
    list_paged = client.get("/api/v1/vacancies?limit=1&offset=0", headers={"X-API-Key": raw_api_key})
    assert list_paged.status_code == 200
    assert len(list_paged.json()) == 1

    list_paged_empty = client.get("/api/v1/vacancies?limit=1&offset=10", headers={"X-API-Key": raw_api_key})
    assert list_paged_empty.status_code == 200
    assert len(list_paged_empty.json()) == 0

    # 11. Test CV & Compatibility
    cv_res = client.get("/api/v1/cv", headers={"X-API-Key": raw_api_key})
    assert cv_res.status_code == 200
    assert cv_res.json() is None

    compat_res = client.get(f"/api/v1/vacancies/{vac_id}/compatibility", headers={"X-API-Key": raw_api_key})
    assert compat_res.status_code == 200
    assert compat_res.json() is None

    # Setup approved CV and analysis in DB
    db = SessionLocal()
    cv_obj = ApprovedCV(user_id=user.id, content="Senior Software Engineer CV", revision=1)
    db.add(cv_obj)
    db.commit()
    analysis_obj = VacancyCVAnalysis(
        user_id=user.id,
        vacancy_id=vac_id,
        cv_revision=1,
        scoring_policy_version="v1.0",
        model_id="gemini-pro",
        overall_score=85.0,
        result={"summary": "Great match", "matchedRequirements": [{"requirement": "Python", "evidence": "5 years"}]}
    )
    db.add(analysis_obj)
    db.commit()
    db.close()

    cv_res2 = client.get("/api/v1/cv", headers={"X-API-Key": raw_api_key})
    assert cv_res2.status_code == 200
    assert cv_res2.json()["content"] == "Senior Software Engineer CV"

    compat_res2 = client.get(f"/api/v1/vacancies/{vac_id}/compatibility", headers={"X-API-Key": raw_api_key})
    assert compat_res2.status_code == 200
    assert compat_res2.json()["overall_score"] == 85.0

    # 12. Batch import async
    batch_res = client.post("/api/v1/vacancies/batch", json={
        "urls": ["https://www.linkedin.com/jobs/view/99887766"],
        "default_tags": ["batch-test"]
    }, headers={"X-API-Key": raw_api_key})
    assert batch_res.status_code == 200
    batch_data = batch_res.json()
    assert batch_data["status"] == "queued"
    assert len(batch_data["tasks"]) == 1
    task_id = batch_data["tasks"][0]["task_id"]

    # 13. Queue task status endpoint
    task_res = client.get(f"/api/v1/queue/tasks/{task_id}", headers={"X-API-Key": raw_api_key})
    assert task_res.status_code == 200
    assert task_res.json()["task_id"] == task_id

    # 14. Delete vacancy
    del_res = client.delete(f"/api/v1/vacancies/{vac_id}", headers={"X-API-Key": raw_api_key})
    assert del_res.status_code == 204

    # 15. Revoke api_access feature flag -> Public API access should return 403 Forbidden
    db = SessionLocal()
    db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id == user.id, UserFeatureFlag.flag == "api_access").delete()
    db.commit()
    db.close()

    res_no_flag = client.get("/api/v1/vacancies", headers={"X-API-Key": raw_api_key})
    assert res_no_flag.status_code == 403
    assert "api_access" in res_no_flag.json()["detail"]
