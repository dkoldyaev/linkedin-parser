import time
from fastapi.testclient import TestClient
from backend.main import app
from backend.mercure import generate_publisher_jwt, get_mercure_secret
import jwt


def test_queue_endpoints():
    with TestClient(app) as client:
        # 1. Test /api/v2/config unauthenticated
        config_resp = client.get("/api/v2/config")
        assert config_resp.status_code == 401, f"Config failed: {config_resp.text}"
        # Dev login to get authenticated client
        login_res = client.post("/api/v2/auth/dev-login", json={"email": "queue_test@local.user"})
        token = login_res.json()["token"]
        user_id = login_res.json()["user"]["id"]
        client.cookies.set("access_token", token)

        # Test /api/v2/config authenticated
        config_auth_resp = client.get("/api/v2/config")
        assert config_auth_resp.json()["mercure_topic"] == f"vacancies:{user_id}"
        print("✓ /api/v2/config test passed:", config_auth_resp.json())

        # 2. Test Mercure JWT Generation
        token = generate_publisher_jwt()
        decoded = jwt.decode(token, get_mercure_secret(), algorithms=["HS256"])
        assert "mercure" in decoded
        assert "*" in decoded["mercure"]["publish"]
        print("✓ Mercure JWT generation test passed")

        # 3. Test /api/queue/status
        status_resp = client.get("/api/v2/queue/status")
        assert status_resp.status_code == 200
        status_data = status_resp.json()
        assert "pending" in status_data
        assert "total_remaining" in status_data
        print("✓ /api/queue/status test passed:", status_data)

        # 4. Test async enqueue via /api/v2/vacancies/batch (without wait)
        test_url = "https://www.linkedin.com/jobs/view/4462938317"
        enqueue_resp = client.post("/api/v2/vacancies/batch", json={
            "urls": [test_url],
            "default_tags": ["async-test", "queue"]
        })
        assert enqueue_resp.status_code == 200
        enqueue_data = enqueue_resp.json()
        assert enqueue_data["status"] == "queued"
        assert enqueue_data["queued"] == 1
        assert "batch_id" in enqueue_data
        assert len(enqueue_data["tasks"]) == 1
        print("✓ Async batch enqueue test passed:", enqueue_data)

        # 5. Check queue status immediately after enqueuing
        q_status = client.get("/api/v2/queue/status").json()
        print("✓ Queue status after enqueue:", q_status)

        # Workers are deliberately disabled in endpoint tests. Verify the queued
        # task contract deterministically; worker execution has dedicated tests.
        assert q_status["total_remaining"] == 1
        assert q_status["pending"] == 1
        assert q_status["recent_tasks"][0]["task_id"] == enqueue_data["tasks"][0]["task_id"]


if __name__ == "__main__":
    test_queue_endpoints()
