import sys
from backend.database import SessionLocal, ensure_db_schema
from backend.models import Vacancy, User
from backend.main import app
from fastapi.testclient import TestClient

def test_sources_api():
    ensure_db_schema()
    client = TestClient(app)

    # 1. Login user A
    login_a = client.post("/api/auth/dev-login", json={"email": "source_test_a@local.user", "name": "User A"})
    assert login_a.status_code == 200
    token_a = login_a.json()["token"]
    client_a = TestClient(app, cookies={"access_token": token_a})

    # 2. Login user B
    login_b = client.post("/api/auth/dev-login", json={"email": "source_test_b@local.user", "name": "User B"})
    assert login_b.status_code == 200
    token_b = login_b.json()["token"]
    client_b = TestClient(app, cookies={"access_token": token_b})

    # Clean existing test vacancies for these users
    db = SessionLocal()
    user_a_id = None
    user_b_id = None
    try:
        user_a = db.query(User).filter(User.email == "source_test_a@local.user").first()
        user_b = db.query(User).filter(User.email == "source_test_b@local.user").first()
        if user_a:
            user_a_id = user_a.id
            db.query(Vacancy).filter(Vacancy.user_id == user_a_id).delete()
        if user_b:
            user_b_id = user_b.id
            db.query(Vacancy).filter(Vacancy.user_id == user_b_id).delete()
        db.commit()
    finally:
        db.close()

    # Create vacancies for User A with different sources
    v1 = client_a.post("/api/vacancies", json={
        "title": "Backend Python Developer",
        "company": "Company A",
        "url": "https://linkedin.com/jobs/view/1001",
        "source": "LinkedIn",
        "country": "Germany"
    }).json()

    v2 = client_a.post("/api/vacancies", json={
        "title": "Frontend React Developer",
        "company": "Company B",
        "url": "https://career.habr.com/vacancies/1002",
        "source": "Habr Career",
        "country": "Germany"
    }).json()

    v3 = client_a.post("/api/vacancies", json={
        "title": "DevOps Engineer",
        "company": "Company C",
        "url": "https://superjob.ru/vacancy/1003",
        "source": "SuperJob",
        "country": "Poland"
    }).json()

    # User B vacancy with another source
    v_b = client_b.post("/api/vacancies", json={
        "title": "QA Engineer",
        "company": "Company D",
        "url": "https://glassdoor.com/job/1004",
        "source": "Glassdoor"
    }).json()

    # Check /api/sources for User A
    sources_a_res = client_a.get("/api/sources")
    assert sources_a_res.status_code == 200
    sources_a = sources_a_res.json()
    assert sources_a == ["Habr Career", "LinkedIn", "SuperJob"], f"Expected ['Habr Career', 'LinkedIn', 'SuperJob'], got {sources_a}"

    # Check /api/sources for User B (isolation)
    sources_b_res = client_b.get("/api/sources")
    assert sources_b_res.status_code == 200
    sources_b = sources_b_res.json()
    assert sources_b == ["Glassdoor"], f"Expected ['Glassdoor'], got {sources_b}"

    # Check /api/vacancies?source=LinkedIn
    vac_res = client_a.get("/api/vacancies?source=LinkedIn")
    assert vac_res.status_code == 200
    vacs = vac_res.json()
    assert len(vacs) == 1
    assert vacs[0]["id"] == v1["id"]

    # Check case insensitivity /api/vacancies?source=linkedin
    vac_lower_res = client_a.get("/api/vacancies?source=linkedin")
    assert vac_lower_res.status_code == 200
    assert len(vac_lower_res.json()) == 1

    # Check combined filter: source=LinkedIn and country=Germany
    vac_comb_res = client_a.get("/api/vacancies?source=LinkedIn&country=Germany")
    assert vac_comb_res.status_code == 200
    assert len(vac_comb_res.json()) == 1

    vac_comb_empty = client_a.get("/api/vacancies?source=LinkedIn&country=Poland")
    assert vac_comb_empty.status_code == 200
    assert len(vac_comb_empty.json()) == 0

    # Check search matches source
    search_res = client_a.get("/api/vacancies?search=SuperJob")
    assert search_res.status_code == 200
    assert any(v["id"] == v3["id"] for v in search_res.json())

    # Check PATCH source update
    patch_res = client_a.patch(f"/api/vacancies/{v1['id']}", json={"source": "Custom Source"})
    assert patch_res.status_code == 200
    assert patch_res.json()["source"] == "Custom Source"

    updated_sources = client_a.get("/api/sources").json()
    assert "Custom Source" in updated_sources

    # Cleanup test vacancies
    db = SessionLocal()
    try:
        if user_a_id:
            db.query(Vacancy).filter(Vacancy.user_id == user_a_id).delete()
        if user_b_id:
            db.query(Vacancy).filter(Vacancy.user_id == user_b_id).delete()
        db.commit()
    finally:
        db.close()

    print("✅ All source filter and endpoint tests PASSED!")

if __name__ == "__main__":
    test_sources_api()
