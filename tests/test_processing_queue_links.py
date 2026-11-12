import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import ProcessingQueueItem, Vacancy
from backend import queue_manager as queue_manager_module


def last_queue_state(user_id):
    """Return the payload of the most recent Mercure `queue_state` event published to the user's topic."""
    calls = [
        c for c in queue_manager_module.publish_mercure_event.call_args_list
        if c.kwargs["event_type"] == "queue_state" and c.kwargs["topic"] == f"vacancies:{user_id}"
    ]
    assert calls, "no queue_state event was published to Mercure"
    return calls[-1].kwargs["data"]


def sync_queue(client, user_id):
    """Queue data is delivered only via Mercure: trigger a republish and read the event."""
    queue_manager_module.publish_mercure_event.reset_mock()
    resp = client.post("/api/v2/queue/sync")
    assert resp.status_code == 202
    assert resp.content == b""
    return last_queue_state(user_id)


def test_queue_links_state_and_deduplication():
    with TestClient(app) as client:
        # Dev login
        login_res = client.post("/api/v2/auth/dev-login", json={"email": "links_queue_test@local.user"})
        assert login_res.status_code == 200
        token = login_res.json()["token"]
        user_id = login_res.json()["user"]["id"]
        client.cookies.set("access_token", token)

        # Queue data endpoints are not available on v2: everything comes from Mercure
        assert client.get("/api/v2/queue/links").status_code in (404, 405)
        assert client.get("/api/v2/queue/status").status_code in (404, 405)
        assert client.get("/api/v2/queue/tasks").status_code in (404, 405)

        # 1. Initially queue should be empty
        data = sync_queue(client, user_id)
        assert data["total"] == 0
        assert data["pending_count"] == 0
        assert data["processing_count"] == 0
        assert data["failed_count"] == 0
        assert data["links"] == []

        # 2. Enqueue a link
        test_url = "https://www.linkedin.com/jobs/view/999111222333"
        batch_resp = client.post("/api/v2/vacancies/batch", json={
            "urls": [test_url],
            "default_tags": ["python"]
        })
        assert batch_resp.status_code == 200
        batch_data = batch_resp.json()
        assert batch_data["queued"] == 1
        assert len(batch_data["already_in_queue"]) == 0
        task_id = batch_data["tasks"][0]["task_id"]

        # 3. Enqueue itself publishes the snapshot to Mercure (no sync request needed)
        data = last_queue_state(user_id)
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

        # Legacy extension endpoints remain available on /api/queue/tasks
        assert client.get("/api/queue/tasks").status_code == 200

        # 4. Deduplication: attempt to enqueue the exact same link again while it's in queue
        dup_resp = client.post("/api/v2/vacancies/batch", json={
            "urls": [test_url],
            "default_tags": ["another-tag"]
        })
        assert dup_resp.status_code == 200
        dup_data = dup_resp.json()
        assert dup_data["status"] == "already_queued"
        assert dup_data["queued"] == 0
        assert len(dup_data["already_in_queue"]) == 1

        # Check total remaining is still 1 (no duplicates added)
        data = sync_queue(client, user_id)
        assert data["total"] == 1

        # 5. Cancel link via DELETE /api/queue/links/{task_id}
        del_resp = client.delete(f"/api/v2/queue/links/{task_id}")
        assert del_resp.status_code == 200

        # The cancellation is published as a new snapshot without the link
        data = last_queue_state(user_id)
        assert data["total"] == 0

        # And the vacancy placeholder was kept in DB (Variant 2)
        with SessionLocal() as db:
            vac = db.query(Vacancy).filter(Vacancy.user_id == user_id).first()
            assert vac is not None


def test_reparse_deduplication():
    with TestClient(app) as client:
        # Dev login
        login_res = client.post("/api/v2/auth/dev-login", json={"email": "reparse_test@local.user"})
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
        r_resp = client.post(f"/api/v2/vacancies/{v_id}/reparse")
        assert r_resp.status_code == 200
        r_data = r_resp.json()
        assert r_data["status"] == "queued"
        task_id = r_data["task_id"]

        # Immediate reparse attempt should detect active queue task
        r_resp_dup = client.post(f"/api/v2/vacancies/{v_id}/reparse")
        assert r_resp_dup.status_code == 200
        dup_data = r_resp_dup.json()
        assert dup_data["status"] == "already_queued"
        assert dup_data["task_id"] == task_id

        # Clean up
        client.delete(f"/api/v2/queue/links/{task_id}")


def test_clear_all_queue_links():
    with TestClient(app) as client:
        login_res = client.post("/api/v2/auth/dev-login", json={"email": "clear_all_test@local.user"})
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
        b_res = client.post("/api/v2/vacancies/batch", json={"urls": urls, "default_tags": []})
        assert b_res.status_code == 200
        assert b_res.json()["queued"] == 3

        # Verify all 3 appear in the published snapshot
        assert last_queue_state(user_id)["total"] == 3

        # Batch delete all links via DELETE /api/queue/links
        clear_res = client.delete("/api/v2/queue/links")
        assert clear_res.status_code == 200
        assert clear_res.json()["cleared"] == 3

        # Queue should now be completely empty (published via Mercure)
        data = last_queue_state(user_id)
        assert data["total"] == 0
        assert len(data["links"]) == 0


def test_queue_state_is_published_per_user_topic():
    with TestClient(app) as client_a, TestClient(app) as client_b:
        login_a = client_a.post("/api/v2/auth/dev-login", json={"email": "queue_topic_a@local.user"}).json()
        login_b = client_b.post("/api/v2/auth/dev-login", json={"email": "queue_topic_b@local.user"}).json()
        client_a.cookies.set("access_token", login_a["token"])
        client_b.cookies.set("access_token", login_b["token"])

        resp = client_a.post("/api/v2/vacancies/batch", json={
            "urls": ["https://www.linkedin.com/jobs/view/7770001"], "default_tags": [],
        })
        assert resp.status_code == 200

        assert last_queue_state(login_a["user"]["id"])["total"] == 1
        state_b = sync_queue(client_b, login_b["user"]["id"])
        assert state_b["total"] == 0
        assert state_b["links"] == []


def test_stage_transition_publishes_queue_state():
    import asyncio

    with TestClient(app) as client:
        login = client.post("/api/v2/auth/dev-login", json={"email": "queue_stage@local.user"}).json()
        user_id = login["user"]["id"]
        client.cookies.set("access_token", login["token"])
        resp = client.post("/api/v2/vacancies/batch", json={
            "urls": ["https://www.linkedin.com/jobs/view/6660001"], "default_tags": [],
        })
        task_id = resp.json()["tasks"][0]["task_id"]

        async def transition():
            queue_manager_module.sync_db_queue_item(task_id, "processing", "scraping", 1, None, None)
            await asyncio.gather(*list(queue_manager_module._queue_state_publish_tasks))

        queue_manager_module.publish_mercure_event.reset_mock()
        asyncio.run(transition())

        state = last_queue_state(user_id)
        assert state["processing_count"] == 1
        assert state["pending_count"] == 0
        assert state["links"][0]["stage"] == "scraping"
