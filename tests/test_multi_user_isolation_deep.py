import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import User, Vacancy, ApiKey, ApprovedCV, VacancyCVAnalysis, AdaptedCVVersion
from backend.database import SessionLocal
from backend.auth import create_access_token

@pytest.fixture
def users_fixture():
    db = SessionLocal()
    # Cleanup prior test data
    existing = db.query(User).filter(User.email.in_(["iso_alice@test.com", "iso_bob@test.com"])).all()
    for u in existing:
        db.query(Vacancy).filter(Vacancy.user_id == u.id).delete()
        db.query(ApiKey).filter(ApiKey.user_id == u.id).delete()
        db.query(ApprovedCV).filter(ApprovedCV.user_id == u.id).delete()
        db.delete(u)
    db.commit()

    user_a = User(google_id="iso_alice", email="iso_alice@test.com", name="Alice")
    user_b = User(google_id="iso_bob", email="iso_bob@test.com", name="Bob")
    db.add_all([user_a, user_b])
    db.commit()
    db.refresh(user_a)
    db.refresh(user_b)

    yield user_a, user_b

    # Cleanup
    db = SessionLocal()
    cleanup_users = db.query(User).filter(User.email.in_(["iso_alice@test.com", "iso_bob@test.com"])).all()
    for u in cleanup_users:
        db.query(Vacancy).filter(Vacancy.user_id == u.id).delete()
        db.query(ApiKey).filter(ApiKey.user_id == u.id).delete()
        db.query(ApprovedCV).filter(ApprovedCV.user_id == u.id).delete()
        db.delete(u)
    db.commit()
    db.close()

def test_api_keys_strict_user_isolation(users_fixture):
    user_a, user_b = users_fixture
    client = TestClient(app)

    token_a = create_access_token({"sub": str(user_a.id)})
    token_b = create_access_token({"sub": str(user_b.id)})

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. User A creates an API key
    res_a = client.post("/api/api-keys", json={"name": "Alice Secret Key"}, headers=headers_a)
    assert res_a.status_code == 200
    key_a = res_a.json()
    key_a_id = key_a["id"]
    alice_raw_api_key = key_a["token"]

    # 2. User B lists API keys -> must NOT see Alice's key
    res_b = client.get("/api/api-keys", headers=headers_b)
    assert res_b.status_code == 200
    b_keys = res_b.json()
    assert len(b_keys) == 0
    assert not any(k["id"] == key_a_id for k in b_keys)

    # 3. User B cannot delete/revoke Alice's key
    res_del = client.delete(f"/api/api-keys/{key_a_id}", headers=headers_b)
    assert res_del.status_code == 404

    # 4. User A can see their own key
    res_list_a = client.get("/api/api-keys", headers=headers_a)
    assert len(res_list_a.json()) == 1
    assert res_list_a.json()[0]["id"] == key_a_id

    # 5. Alice API key only accesses Alice data
    alice_api_headers = {"X-API-Key": alice_raw_api_key}
    res_me = client.get("/api/auth/me", headers=alice_api_headers)
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "iso_alice@test.com"

def test_vacancies_and_history_isolation(users_fixture):
    user_a, user_b = users_fixture
    client = TestClient(app)

    headers_a = {"Authorization": f"Bearer {create_access_token({'sub': str(user_a.id)})}"}
    headers_b = {"Authorization": f"Bearer {create_access_token({'sub': str(user_b.id)})}"}

    # User A creates vacancy
    v_a = client.post("/api/vacancies", json={
        "title": "Confidential A Job",
        "company": "Company A",
        "url": "https://www.linkedin.com/jobs/view/999111",
        "status": "Еще не написан"
    }, headers=headers_a).json()
    vac_id = v_a["id"]

    # User B cannot access, patch, resummarize, reparse, or delete vacancy
    assert client.get(f"/api/vacancies/{vac_id}", headers=headers_b).status_code == 404
    assert client.patch(f"/api/vacancies/{vac_id}", json={"title": "Hacked"}, headers=headers_b).status_code == 404
    assert client.post(f"/api/vacancies/{vac_id}/resummarize", headers=headers_b).status_code == 404
    assert client.post(f"/api/vacancies/{vac_id}/reparse", headers=headers_b).status_code == 404
    assert client.delete(f"/api/vacancies/{vac_id}", headers=headers_b).status_code == 404

    # User B cannot add or edit or delete history on User A's vacancy
    assert client.post(f"/api/vacancies/{vac_id}/history", json={"to_status": "Написал"}, headers=headers_b).status_code == 404
    if v_a.get("history"):
        hist_id = v_a["history"][0]["id"]
        assert client.patch(f"/api/vacancies/{vac_id}/history/{hist_id}", json={"comment": "Hacked"}, headers=headers_b).status_code == 404
        assert client.delete(f"/api/vacancies/{vac_id}/history/{hist_id}", headers=headers_b).status_code == 404

def test_cv_and_analysis_isolation(users_fixture):
    user_a, user_b = users_fixture
    client = TestClient(app)

    headers_a = {"Authorization": f"Bearer {create_access_token({'sub': str(user_a.id)})}"}
    headers_b = {"Authorization": f"Bearer {create_access_token({'sub': str(user_b.id)})}"}

    # User A saves approved CV
    cv_res = client.post("/api/cv/approved", json={
        "content": "Alice Secret Resume Content",
        "revision": 1
    }, headers=headers_a)
    assert cv_res.status_code == 200

    # User B cannot see User A's approved CV
    b_cv = client.get("/api/cv/approved", headers=headers_b)
    assert b_cv.status_code == 200
    assert b_cv.json() is None

    # User A creates a vacancy
    v_a = client.post("/api/vacancies", json={
        "title": "Software Engineer",
        "company": "Top Secret Tech",
        "url": "https://www.linkedin.com/jobs/view/999222",
    }, headers=headers_a).json()
    vac_id = v_a["id"]

    # User B cannot get or adapt CV analysis for User A's vacancy
    assert client.get(f"/api/vacancies/{vac_id}/compatibility", headers=headers_b).status_code == 404
    assert client.post(f"/api/vacancies/{vac_id}/compatibility", headers=headers_b).status_code == 404
    assert client.post(f"/api/vacancies/{vac_id}/adapt-cv", headers=headers_b).status_code == 404

def test_stats_and_metadata_isolation(users_fixture):
    user_a, user_b = users_fixture
    client = TestClient(app)

    headers_a = {"Authorization": f"Bearer {create_access_token({'sub': str(user_a.id)})}"}
    headers_b = {"Authorization": f"Bearer {create_access_token({'sub': str(user_b.id)})}"}

    # User A has 1 vacancy
    client.post("/api/vacancies", json={
        "title": "Engineer",
        "company": "Company A",
        "url": "https://www.linkedin.com/jobs/view/999333",
        "country": "France",
        "city": "Paris",
        "source": "Habr Career",
        "tags": ["secret-tag"]
    }, headers=headers_a)

    # User B stats must be 0
    stats_b = client.get("/api/stats", headers=headers_b).json()
    assert stats_b["total"] == 0

    # User B tags, countries, cities, sources must be empty
    assert client.get("/api/tags", headers=headers_b).json() == []
    assert client.get("/api/countries", headers=headers_b).json() == []
    assert client.get("/api/cities", headers=headers_b).json() == []
    assert client.get("/api/sources", headers=headers_b).json() == []
