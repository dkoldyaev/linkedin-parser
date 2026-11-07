import uuid
from fastapi.testclient import TestClient
from backend.main import app
from backend.queue_manager import queue_manager

def test_extension_ping_and_status():
    with TestClient(app) as client:
        unique_email = f"ext_test_{uuid.uuid4().hex[:6]}@local.user"
        login_res = client.post("/api/auth/dev-login", json={"email": unique_email})
        assert login_res.status_code == 200
        token = login_res.json()["token"]
        user_id = login_res.json()["user"]["id"]
        client.cookies.set("access_token", token)

        # Initially, extension is not active for this brand new user
        res_initial = client.get("/api/extension/status")
        assert res_initial.status_code == 200
        assert res_initial.json()["active"] is False

        # Extension sends ping
        res_ping = client.post("/api/extension/ping")
        assert res_ping.status_code == 200
        assert res_ping.json()["status"] == "ok"

        # Now status should be active
        res_after = client.get("/api/extension/status")
        assert res_after.status_code == 200
        assert res_after.json()["active"] is True
        print("✓ Extension ping and status API verified successfully!")


def test_check_duplicates_requires_extension():
    with TestClient(app) as client:
        unique_email = f"ext_dup_{uuid.uuid4().hex[:6]}@local.user"
        login_res = client.post("/api/auth/dev-login", json={"email": unique_email})
        assert login_res.status_code == 200
        token = login_res.json()["token"]
        client.cookies.set("access_token", token)

        # Standard job boards that do not require an extension
        res_standard = client.post("/api/vacancies/check-duplicates", json={
            "urls": [
                "https://hh.ru/vacancy/12345678",
                "https://career.habr.com/vacancies/1000123456"
            ]
        })
        assert res_standard.status_code == 200
        data_standard = res_standard.json()
        assert data_standard["requires_extension"] is False

        # Upwork requires an extension
        res_upwork = client.post("/api/vacancies/check-duplicates", json={
            "urls": ["https://www.upwork.com/jobs/~01abc123def456"]
        })
        assert res_upwork.status_code == 200
        data_upwork = res_upwork.json()
        assert data_upwork["requires_extension"] is True

        # Indeed requires an extension
        res_indeed = client.post("/api/vacancies/check-duplicates", json={
            "urls": ["https://www.indeed.com/viewjob?jk=1234567890abcdef"]
        })
        assert res_indeed.status_code == 200
        data_indeed = res_indeed.json()
        assert data_indeed["requires_extension"] is True

        # Mixed URLs: if at least one requires extension, flag is True
        res_mixed = client.post("/api/vacancies/check-duplicates", json={
            "urls": [
                "https://hh.ru/vacancy/12345678",
                "https://www.upwork.com/jobs/~01abc123def456"
            ]
        })
        assert res_mixed.status_code == 200
        data_mixed = res_mixed.json()
        assert data_mixed["requires_extension"] is True

if __name__ == "__main__":
    test_extension_ping_and_status()
