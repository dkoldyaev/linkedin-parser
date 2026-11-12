import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import ProcessingQueueItem, Vacancy


def test_queue_links_state_and_deduplication():
    with TestClient(app) as client:
        # Dev login
        login_res = client.post("/api/auth/dev-login", json={"email": "links_queue_test@local.user"})
        assert login_res.status_code == 200
        token = login_res.json()["token"]
        user_id = login_res.json()["user"]["id"]
        client.cookies.set("access_token", token)

        # 1. Initially queue should be empty
        resp = client.get("/api/queue/links")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["pending_count"] == 0
        assert data["processing_count"] == 0
        assert data["failed_count"] == 0
        assert data["links"] == []

        # 2. Enqueue a link
        test_url = "https://www.linkedin.com/jobs/view/999111222333"
        batch_resp = client.post("/api/vacancies/batch", json={
            "urls": [test_url],
            "default_tags": ["python"]
        })
        assert batch_resp.status_code == 200
        batch_data = batch_resp.json()
        assert batch_data["queued"] == 1
        assert len(batch_data["already_in_queue"]) == 0
        task_id = batch_data["tasks"][0]["task_id"]

        # 3. Check /api/queue/links
        resp = client.get("/api/queue/links")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["pending_count"] == 1
        assert data["processing_count"] == 0
        assert data["failed_count"] == 0
        assert len(data["links"]) == 1
        link_info = data["links"][0]
        assert link_info["task_id"] == task_id
        assert link_info["stage"] == "queued"
        assert link_info["status"] == "pending"
        assert "999111222333" in link_info["url"]

        # Check single link info via GET /api/queue/links/{task_id}
        single_resp = client.get(f"/api/queue/links/{task_id}")
        assert single_resp.status_code == 200
        assert single_resp.json()["task_id"] == task_id
        assert single_resp.json()["stage"] == "queued"

        # Verify old endpoints are removed (not 200 OK)
        assert client.get("/api/queue/tasks").status_code == 404
        assert client.delete(f"/api/queue/tasks/{task_id}").status_code in (404, 405)

        # 4. Deduplication: attempt to enqueue the exact same link again while it's in queue
        dup_resp = client.post("/api/vacancies/batch", json={
            "urls": [test_url],
            "default_tags": ["another-tag"]
        })
        assert dup_resp.status_code == 200
        dup_data = dup_resp.json()
        assert dup_data["status"] == "already_queued"
        assert dup_data["queued"] == 0
        assert len(dup_data["already_in_queue"]) == 1

        # Check total remaining is still 1 (no duplicates added)
        resp = client.get("/api/queue/links")
        data = resp.json()
        assert data["total"] == 1

        # 5. Cancel link via DELETE /api/queue/links/{task_id}
        del_resp = client.delete(f"/api/queue/links/{task_id}")
        assert del_resp.status_code == 200

        # Now /api/queue/links should no longer return it as active
        resp = client.get("/api/queue/links")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0

        # And the vacancy placeholder was kept in DB (Variant 2)
        with SessionLocal() as db:
            vac = db.query(Vacancy).filter(Vacancy.user_id == user_id).first()
            assert vac is not None


def test_reparse_deduplication():
    with TestClient(app) as client:
        # Dev login
        login_res = client.post("/api/auth/dev-login", json={"email": "reparse_test@local.user"})
        assert login_res.status_code == 200
        token = login_res.json()["token"]
        user_id = login_res.json()["user"]["id"]
        client.cookies.set("access_token", token)

        # Create vacancy in DB
        with SessionLocal() as db:
            v = Vacancy(
                user_id=user_id,
                url="https://www.linkedin.com/jobs/view/888777666",
                title="Software Engineer",
                company="Tech Corp",
                status="Еще не написал",
            )
            db.add(v)
            db.commit()
            db.refresh(v)
            v_id = v.id

        # Reparse vacancy
        r_resp = client.post(f"/api/vacancies/{v_id}/reparse")
        assert r_resp.status_code == 200
        r_data = r_resp.json()
        assert r_data["status"] == "queued"
        task_id = r_data["task_id"]

        # Immediate reparse attempt should detect active queue task
        r_resp_dup = client.post(f"/api/vacancies/{v_id}/reparse")
        assert r_resp_dup.status_code == 200
        dup_data = r_resp_dup.json()
        assert dup_data["status"] == "already_queued"
        assert dup_data["task_id"] == task_id

        # Clean up
        client.delete(f"/api/queue/links/{task_id}")


def test_clear_all_queue_links():
    with TestClient(app) as client:
        login_res = client.post("/api/auth/dev-login", json={"email": "clear_all_test@local.user"})
        assert login_res.status_code == 200
        token = login_res.json()["token"]
        user_id = login_res.json()["user"]["id"]
        client.cookies.set("access_token", token)

        # Enqueue 3 links
        urls = [
            "https://www.linkedin.com/jobs/view/1110001",
            "https://www.linkedin.com/jobs/view/1110002",
            "https://www.linkedin.com/jobs/view/1110003",
        ]
        b_res = client.post("/api/vacancies/batch", json={"urls": urls, "default_tags": []})
        assert b_res.status_code == 200
        assert b_res.json()["queued"] == 3

        # Verify all 3 appear in queue
        q_res = client.get("/api/queue/links")
        assert q_res.status_code == 200
        assert q_res.json()["total"] == 3

        # Batch delete all links via DELETE /api/queue/links
        clear_res = client.delete("/api/queue/links")
        assert clear_res.status_code == 200
        assert clear_res.json()["cleared"] == 3

        # Queue should now be completely empty
        q_res2 = client.get("/api/queue/links")
        assert q_res2.status_code == 200
        assert q_res2.json()["total"] == 0
        assert len(q_res2.json()["links"]) == 0

