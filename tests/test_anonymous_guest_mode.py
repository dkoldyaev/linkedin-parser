import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth import create_access_token, decode_access_token, COOKIE_NAME
from backend.models import User, Vacancy

def test_anonymous_user_auto_creation_and_cookie():
    client = TestClient(app)
    # 1. Unauthenticated request to /api/auth/me should auto-create anonymous user
    res = client.get("/api/auth/me")
    assert res.status_code == 200
    user_data = res.json()
    assert user_data["is_anonymous"] is True
    assert user_data["name"] == "Гость"
    assert user_data["email"].startswith("guest_")
    
    # Check that access_token cookie was set
    assert COOKIE_NAME in client.cookies
    token = client.cookies[COOKIE_NAME]
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == str(user_data["id"])

    # 2. Subsequent requests retain the same anonymous user
    res2 = client.get("/api/auth/me")
    assert res2.status_code == 200
    assert res2.json()["id"] == user_data["id"]

def test_anonymous_user_can_create_vacancies_and_migrate_on_login():
    client = TestClient(app)
    # Start guest session
    res_me = client.get("/api/auth/me")
    anon_id = res_me.json()["id"]

    # Anonymous user adds vacancies
    res_v1 = client.post("/api/vacancies", json={
        "title": "Guest Python Dev",
        "company": "Startup Inc",
        "url": "https://example.com/job/1"
    })
    assert res_v1.status_code == 200
    v1_id = res_v1.json()["id"]
    assert res_v1.json()["user_id"] == anon_id

    res_v2 = client.post("/api/vacancies", json={
        "title": "Guest React Dev",
        "company": "Startup Inc",
        "url": "https://example.com/job/2"
    })
    assert res_v2.status_code == 200
    v2_id = res_v2.json()["id"]

    # Check vacancies list
    res_list = client.get("/api/vacancies")
    assert res_list.status_code == 200
    vac_ids = [v["id"] for v in res_list.json()]
    assert v1_id in vac_ids
    assert v2_id in vac_ids

    # User now logs in via dev-login (e.g. to save progress across computers)
    dev_res = client.post("/api/auth/dev-login", json={
        "name": "Ivan Permanent",
        "email": "ivan.perm@example.com"
    })
    assert dev_res.status_code == 200
    perm_user = dev_res.json()["user"]
    assert perm_user["is_anonymous"] is False
    assert perm_user["id"] != anon_id

    # Vacancies should now belong to the permanent user!
    res_list_after = client.get("/api/vacancies")
    assert res_list_after.status_code == 200
    vacancies_after = res_list_after.json()
    assert len(vacancies_after) >= 2
    for v in vacancies_after:
        if v["id"] in (v1_id, v2_id):
            assert v["user_id"] == perm_user["id"]
