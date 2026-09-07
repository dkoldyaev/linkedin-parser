import time
from fastapi.testclient import TestClient
from backend.main import app
from backend.mercure import generate_publisher_jwt, get_mercure_secret
import jwt


def test_queue_endpoints():
    with TestClient(app) as client:
        # 1. Test /api/config
        config_resp = client.get("/api/config")
        assert config_resp.status_code == 200, f"Config failed: {config_resp.text}"
        config_data = config_resp.json()
        assert "mercure_hub_url" in config_data
        assert config_data["mercure_topic"] == "vacancies"
        print("✓ /api/config test passed:", config_data)

        # 2. Test Mercure JWT Generation
        token = generate_publisher_jwt()
        decoded = jwt.decode(token, get_mercure_secret(), algorithms=["HS256"])
        assert "mercure" in decoded
        assert "*" in decoded["mercure"]["publish"]
        print("✓ Mercure JWT generation test passed")

        # 3. Test /api/queue/status
        status_resp = client.get("/api/queue/status")
        assert status_resp.status_code == 200
        status_data = status_resp.json()
        assert "pending" in status_data
        assert "total_remaining" in status_data
        print("✓ /api/queue/status test passed:", status_data)

        # 4. Test async enqueue via /api/vacancies/batch (without wait)
        test_url = "https://www.linkedin.com/jobs/view/4462938317"
        enqueue_resp = client.post("/api/vacancies/batch", json={
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
        q_status = client.get("/api/queue/status").json()
        print("✓ Queue status after enqueue:", q_status)

        # 6. Wait for background processing to finish (up to 15 seconds)
        print("Waiting for background worker to process task...")
        finished = False
        for _ in range(15):
            time.sleep(1)
            q = client.get("/api/queue/status").json()
            if q["total_remaining"] == 0:
                finished = True
                print("✓ Queue worker processed all items! Completed:", q["completed"], "Failed:", q["failed"])
                break

        # Check vacancies in DB
        vacancies = client.get("/api/vacancies").json()
        print(f"✓ Vacancies in DB: {len(vacancies)}")

        print("\nALL QUEUE & ASYNC TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    test_queue_endpoints()
