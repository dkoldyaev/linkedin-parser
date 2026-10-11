import asyncio
import uuid
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.main import app
from backend.mercure import (
    EVENT_VACANCY_CREATED,
    MSG_VACANCY_CREATED,
    EVENT_VACANCY_UPDATED,
    MSG_VACANCY_UPDATED,
    EVENT_VACANCY_DELETED,
    MSG_VACANCY_DELETED,
)


def test_card_crud_mercure_events():
    published_events = []

    async def mock_publish(event_type, data, topic=None, **kwargs):
        published_events.append({"event_type": event_type, "data": data, "topic": topic})
        return True

    with patch("backend.main.publish_mercure_event", new=mock_publish), \
         patch("backend.queue_manager.publish_mercure_event", new=mock_publish):
        with TestClient(app) as client:
            # Login
            login_res = client.post("/api/auth/dev-login", json={"email": "mercure_crud_test@example.com"})
            assert login_res.status_code == 200
            token = login_res.json()["token"]
            user_id = login_res.json()["user"]["id"]
            client.cookies.set("access_token", token)

            # 1. Test POST /api/vacancies publishes EVENT_VACANCY_CREATED
            published_events.clear()
            res = client.post("/api/vacancies", json={
                "title": "Software Engineer Mercure",
                "company": "Mercure Test Corp",
                "url": f"https://example.com/jobs/{uuid.uuid4().hex[:10]}",
                "status": "Еще не написан",
            })
            assert res.status_code == 200
            created_v = res.json()
            vacancy_id = created_v["id"]

            created_events = [e for e in published_events if e["event_type"] == EVENT_VACANCY_CREATED]
            assert len(created_events) >= 1, f"Expected EVENT_VACANCY_CREATED, got: {published_events}"
            event = created_events[0]
            assert event["data"]["vacancy"]["id"] == vacancy_id
            assert event["data"]["message_code"] == MSG_VACANCY_CREATED
            assert event["topic"] == f"vacancies:{user_id}"
            print("✓ POST /api/vacancies publishes Mercure EVENT_VACANCY_CREATED passed")

            # 2. Test PATCH /api/vacancies/{id} publishes EVENT_VACANCY_UPDATED
            published_events.clear()
            patch_res = client.patch(f"/api/vacancies/{vacancy_id}", json={
                "status": "Написал",
                "status_comment": "Applied via referral"
            })
            assert patch_res.status_code == 200
            updated_events = [e for e in published_events if e["event_type"] == EVENT_VACANCY_UPDATED]
            assert len(updated_events) >= 1, f"Expected EVENT_VACANCY_UPDATED, got: {published_events}"
            up_event = updated_events[0]
            assert up_event["data"]["vacancy"]["id"] == vacancy_id
            assert up_event["data"]["vacancy"]["status"] == "Написал"
            assert up_event["data"]["message_code"] == MSG_VACANCY_UPDATED
            assert up_event["topic"] == f"vacancies:{user_id}"
            print("✓ PATCH /api/vacancies/{id} publishes Mercure EVENT_VACANCY_UPDATED passed")

            # 3. Test DELETE /api/vacancies/{id} publishes EVENT_VACANCY_DELETED
            published_events.clear()
            del_res = client.delete(f"/api/vacancies/{vacancy_id}")
            assert del_res.status_code == 204
            deleted_events = [e for e in published_events if e["event_type"] == EVENT_VACANCY_DELETED]
            assert len(deleted_events) >= 1, f"Expected EVENT_VACANCY_DELETED, got: {published_events}"
            del_event = deleted_events[0]
            assert del_event["data"]["vacancy_id"] == vacancy_id
            assert del_event["data"]["title"] == "Software Engineer Mercure"
            assert del_event["data"]["message_code"] == MSG_VACANCY_DELETED
            assert del_event["topic"] == f"vacancies:{user_id}"
            print("✓ DELETE /api/vacancies/{id} publishes Mercure EVENT_VACANCY_DELETED passed")

            # 4. Test POST /api/vacancies/batch publishes EVENT_VACANCY_CREATED for new vacancy
            published_events.clear()
            batch_url = f"https://www.linkedin.com/jobs/view/{uuid.uuid4().int % 10000000000}"
            res = client.post("/api/vacancies/batch", json={
                "urls": [batch_url],
                "default_tags": ["batch-mercure-test"]
            })
            assert res.status_code == 200
            batch_created_events = [e for e in published_events if e["event_type"] == EVENT_VACANCY_CREATED]
            assert len(batch_created_events) >= 1, f"Expected EVENT_VACANCY_CREATED in batch import, got: {published_events}"
            assert batch_created_events[0]["data"]["vacancy"]["url"] == batch_url
            assert batch_created_events[0]["topic"] == f"vacancies:{user_id}"
            print("✓ POST /api/vacancies/batch publishes Mercure EVENT_VACANCY_CREATED passed")

            # 5. Test POST /api/extension/parse_and_add publishes EVENT_VACANCY_CREATED for new vacancy
            published_events.clear()
            ext_url = f"https://www.linkedin.com/jobs/view/{uuid.uuid4().int % 10000000000}"
            res = client.post("/api/extension/parse_and_add", json={
                "url": ext_url,
                "title": "Extension Card Title",
                "company": "Extension Corp",
                "description": "Some description",
            })
            assert res.status_code == 200
            ext_created_events = [e for e in published_events if e["event_type"] == EVENT_VACANCY_CREATED]
            assert len(ext_created_events) >= 1, f"Expected EVENT_VACANCY_CREATED in extension parse_and_add, got: {published_events}"
            assert ext_created_events[0]["data"]["vacancy"]["url"] == ext_url
            print("✓ POST /api/extension/parse_and_add publishes Mercure EVENT_VACANCY_CREATED passed")


if __name__ == "__main__":
    test_card_crud_mercure_events()
    print("\nAll Mercure card CRUD tests passed successfully!")
