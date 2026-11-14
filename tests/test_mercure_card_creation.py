import asyncio
import uuid
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import STATUS_NOT_CONTACTED
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
            login_res = client.post("/api/v2/auth/dev-login", json={"email": "mercure_crud_test@example.com"})
            assert login_res.status_code == 200
            token = login_res.json()["token"]
            user_id = login_res.json()["user"]["id"]
            client.cookies.set("access_token", token)

            # 1. Test POST /api/v2/vacancies publishes EVENT_VACANCY_CREATED
            published_events.clear()
            res = client.post("/api/v2/vacancies", json={
                "title": "Software Engineer Mercure",
                "company": "Mercure Test Corp",
                "url": f"https://example.com/jobs/{uuid.uuid4().hex[:10]}",
                "status": STATUS_NOT_CONTACTED,
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
            print("✓ POST /api/v2/vacancies publishes Mercure EVENT_VACANCY_CREATED passed")

            # 2. Test PATCH /api/v2/vacancies/{id} publishes EVENT_VACANCY_UPDATED
            published_events.clear()
            patch_res = client.patch(f"/api/v2/vacancies/{vacancy_id}", json={
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
            print("✓ PATCH /api/v2/vacancies/{id} publishes Mercure EVENT_VACANCY_UPDATED passed")

            # 3. Test DELETE /api/v2/vacancies/{id} publishes EVENT_VACANCY_DELETED
            published_events.clear()
            del_res = client.delete(f"/api/v2/vacancies/{vacancy_id}")
            assert del_res.status_code == 204
            deleted_events = [e for e in published_events if e["event_type"] == EVENT_VACANCY_DELETED]
            assert len(deleted_events) >= 1, f"Expected EVENT_VACANCY_DELETED, got: {published_events}"
            del_event = deleted_events[0]
            assert del_event["data"]["vacancy_id"] == vacancy_id
            assert del_event["data"]["title"] == "Software Engineer Mercure"
            assert del_event["data"]["message_code"] == MSG_VACANCY_DELETED
            assert del_event["topic"] == f"vacancies:{user_id}"
            print("✓ DELETE /api/v2/vacancies/{id} publishes Mercure EVENT_VACANCY_DELETED passed")

            # 4. Test POST /api/v2/vacancies/batch publishes EVENT_VACANCY_CREATED for new vacancy
            published_events.clear()
            batch_url = f"https://www.linkedin.com/jobs/view/{uuid.uuid4().int % 10000000000}/"
            res = client.post("/api/v2/vacancies/batch", json={
                "urls": [batch_url],
                "default_tags": ["batch-mercure-test"]
            })
            assert res.status_code == 200
            batch_created_events = [e for e in published_events if e["event_type"] == EVENT_VACANCY_CREATED]
            assert len(batch_created_events) >= 1, f"Expected EVENT_VACANCY_CREATED in batch import, got: {published_events}"
            assert batch_created_events[0]["data"]["vacancy"]["url"] == batch_url
            assert batch_created_events[0]["topic"] == f"vacancies:{user_id}"
            print("✓ POST /api/v2/vacancies/batch publishes Mercure EVENT_VACANCY_CREATED passed")

            # 5. Test POST /api/extension/parse_and_add publishes EVENT_VACANCY_CREATED for new vacancy
            published_events.clear()
            ext_url = f"https://www.linkedin.com/jobs/view/{uuid.uuid4().int % 10000000000}/"
            res = client.post("/api/extension/parse_and_add", json={
                "url": ext_url,
                "title": "Extension Card Title",
                "company": "Extension Corp",
                "source": "LinkedIn",
                "description": "Some description",
            })
            assert res.status_code == 200
            ext_created_events = [e for e in published_events if e["event_type"] == EVENT_VACANCY_CREATED]
            assert len(ext_created_events) >= 1, f"Expected EVENT_VACANCY_CREATED in extension parse_and_add, got: {published_events}"
            assert ext_created_events[0]["data"]["vacancy"]["url"] == ext_url
            print("✓ POST /api/extension/parse_and_add publishes Mercure EVENT_VACANCY_CREATED passed")

            # 6. Test PATCH /api/v2/columns/{column_id} and DELETE /api/v2/columns/{column_id} publish EVENT_VACANCY_UPDATED
            custom_col_name = f"Stage_{uuid.uuid4().hex[:6]}"
            renamed_col_name = f"Renamed_{uuid.uuid4().hex[:6]}"
            col_res = client.post("/api/v2/columns", json={"name": custom_col_name, "color": "#6366f1", "has_lanes": False})
            assert col_res.status_code == 200

            v_col_res = client.post("/api/v2/vacancies", json={
                "title": "Column Migration Vacancy",
                "company": "Col Corp",
                "url": f"https://example.com/jobs/{uuid.uuid4().hex[:10]}",
                "status": custom_col_name,
            })
            assert v_col_res.status_code == 200
            col_vacancy_id = v_col_res.json()["id"]

            published_events.clear()
            rename_res = client.patch(f"/api/v2/columns/{custom_col_name}", json={"new_name": renamed_col_name})
            assert rename_res.status_code == 200
            rename_events = [
                e for e in published_events
                if e["event_type"] == EVENT_VACANCY_UPDATED and e["data"]["vacancy"]["id"] == col_vacancy_id
            ]
            assert len(rename_events) == 1
            assert rename_events[0]["data"]["vacancy"]["status"] == renamed_col_name
            assert rename_events[0]["topic"] == f"vacancies:{user_id}"

            published_events.clear()
            del_col_res = client.delete(f"/api/v2/columns/{renamed_col_name}?migrate_to={STATUS_NOT_CONTACTED}")
            assert del_col_res.status_code == 200
            migrate_events = [
                e for e in published_events
                if e["event_type"] == EVENT_VACANCY_UPDATED and e["data"]["vacancy"]["id"] == col_vacancy_id
            ]
            assert len(migrate_events) == 1
            assert migrate_events[0]["data"]["vacancy"]["status"] == STATUS_NOT_CONTACTED
            assert migrate_events[0]["topic"] == f"vacancies:{user_id}"


def test_mock_llm_provider():
    from backend.llm import analyze_vacancy_with_llm
    res = asyncio.run(
        analyze_vacancy_with_llm(
            title="Backend Developer",
            company="MockTech",
            location="Berlin, Germany",
            description="We need Python, FastAPI, PostgreSQL and Docker experience.",
            provider="mock",
            language="ru",
            db=None,
            user_id=None,
        )
    )
    assert res["ai_error"] is None
    assert "[Mock LLM]" in res["summary"]
    assert "Python" in res["tech_stack"]
    assert res["workplace_type"] == "remote"


if __name__ == "__main__":
    test_card_crud_mercure_events()
    test_mock_llm_provider()
    print("\nAll Mercure card CRUD tests passed successfully!")
