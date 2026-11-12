import uuid
from fastapi.testclient import TestClient
from backend.main import app
from backend.queue_manager import queue_manager

def test_extension_ping_and_status():
    with TestClient(app) as client:
        unique_email = f"ext_test_{uuid.uuid4().hex[:6]}@local.user"
        login_res = client.post("/api/v2/auth/dev-login", json={"email": unique_email})
        assert login_res.status_code == 200
        token = login_res.json()["token"]
        user_id = login_res.json()["user"]["id"]
        client.cookies.set("access_token", token)

        # Initially, extension is not active for this brand new user
        res_initial = client.get("/api/extension/status")
        assert res_initial.status_code == 200
        assert res_initial.json()["active"] is False

        # Extension sends ping with version
        res_ping = client.post("/api/extension/ping", json={"version": "1.0.6"})
        assert res_ping.status_code == 200
        assert res_ping.json()["status"] == "ok"

        # Now status should be active and include last_known_version
        res_after = client.get("/api/extension/status")
        assert res_after.status_code == 200
        assert res_after.json()["active"] is True
        assert res_after.json()["last_known_version"] == "1.0.6"

        # Check changelog endpoint
        res_changelog = client.get("/api/extension/changelog")
        assert res_changelog.status_code == 200
        changelog_data = res_changelog.json()
        assert "latest_version" in changelog_data
        assert "releases" in changelog_data
        print("✓ Extension ping, changelog and status API verified successfully!")


def test_check_duplicates_requires_extension():
    with TestClient(app) as client:
        unique_email = f"ext_dup_{uuid.uuid4().hex[:6]}@local.user"
        login_res = client.post("/api/v2/auth/dev-login", json={"email": unique_email})
        assert login_res.status_code == 200
        token = login_res.json()["token"]
        client.cookies.set("access_token", token)

        # Standard job boards that do not require an extension
        res_standard = client.post("/api/v2/vacancies/check-duplicates", json={
            "urls": [
                "https://hh.ru/vacancy/12345678",
                "https://career.habr.com/vacancies/1000123456"
            ]
        })
        assert res_standard.status_code == 200
        data_standard = res_standard.json()
        assert data_standard["requires_extension"] is False

        # Upwork requires an extension
        res_upwork = client.post("/api/v2/vacancies/check-duplicates", json={
            "urls": ["https://www.upwork.com/jobs/~01abc123def456"]
        })
        assert res_upwork.status_code == 200
        data_upwork = res_upwork.json()
        assert data_upwork["requires_extension"] is True

        # Indeed requires an extension
        res_indeed = client.post("/api/v2/vacancies/check-duplicates", json={
            "urls": ["https://www.indeed.com/viewjob?jk=1234567890abcdef"]
        })
        assert res_indeed.status_code == 200
        data_indeed = res_indeed.json()
        assert data_indeed["requires_extension"] is True

        # Mixed URLs: if at least one requires extension, flag is True
        res_mixed = client.post("/api/v2/vacancies/check-duplicates", json={
            "urls": [
                "https://hh.ru/vacancy/12345678",
                "https://www.upwork.com/jobs/~01abc123def456"
            ]
        })
        assert res_mixed.status_code == 200
        data_mixed = res_mixed.json()
        assert data_mixed["requires_extension"] is True

def test_legacy_extension_endpoints_full_lifecycle():
    with TestClient(app) as client:
        unique_email = f"legacy_ext_{uuid.uuid4().hex[:6]}@local.user"
        login_res = client.post("/api/v2/auth/dev-login", json={"email": unique_email})
        assert login_res.status_code == 200
        token = login_res.json()["token"]
        client.cookies.set("access_token", token)

        # 1. Ping
        ping_res = client.post("/api/extension/ping", json={"version": "1.0.6"})
        assert ping_res.status_code == 200
        assert ping_res.json()["status"] == "ok"

        # 2. Status
        status_res = client.get("/api/extension/status")
        assert status_res.status_code == 200
        assert status_res.json()["active"] is True
        assert status_res.json()["last_known_version"] == "1.0.6"

        # 3. Changelog
        changelog_res = client.get("/api/extension/changelog")
        assert changelog_res.status_code == 200

        # 4. Mercure config
        mercure_res = client.get("/api/extension/mercure_config")
        assert mercure_res.status_code == 200
        assert "mercure_hub_url" in mercure_res.json()
        assert "topic" in mercure_res.json()

        # 5. Extension tasks polling
        tasks_res = client.get("/api/extension/tasks")
        assert tasks_res.status_code == 200
        assert isinstance(tasks_res.json(), list)

        # 6. Remote logging
        log_res = client.post("/api/extension/log", json={
            "level": "info",
            "message": "test legacy log",
            "data": {"foo": "bar"}
        })
        assert log_res.status_code == 200

        # 7. Parse and add (context menu or popup single add)
        add_res = client.post("/api/extension/parse_and_add", json={
            "url": "https://career.habr.com/vacancies/1000999999",
            "data": {
                "title": "Python Developer",
                "company": "Legacy Corp",
                "description": "Legacy description",
                "url": "https://career.habr.com/vacancies/1000999999"
            }
        })
        assert add_res.status_code == 200
        assert add_res.json()["status"] in ("ok", "queued_for_ai")
        assert "vacancy_id" in add_res.json()

        # 8. Queue status
        q_status_res = client.get("/api/queue/status")
        assert q_status_res.status_code == 200

        # 9. Queue tasks (v1.0.0-1.0.6 popup)
        q_tasks_res = client.get("/api/queue/tasks")
        assert q_tasks_res.status_code == 200
        assert isinstance(q_tasks_res.json(), list)

        # 10. Queue links (v1.0.7 popup)
        q_links_res = client.get("/api/queue/links")
        assert q_links_res.status_code == 200
        assert "links" in q_links_res.json()
        assert "total" in q_links_res.json()

        # 11. Clear / cancel
        clear_res = client.delete("/api/queue/links")
        assert clear_res.status_code == 200


if __name__ == "__main__":
    test_extension_ping_and_status()
