import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal, ensure_db_schema
from backend.models import Vacancy, VacancyStatusHistory, User

class TestVacancyHistory(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ensure_db_schema()

    def setUp(self):
        self.client = TestClient(app)
        # Login dev user to get authenticated session
        login_res = self.client.post("/api/auth/dev-login", json={"email": "history_test@example.com", "name": "History Tester"})
        self.assertEqual(login_res.status_code, 200)

    def test_history_lifecycle(self):
        # 1. Create a vacancy
        create_payload = {
            "title": "Lead Python Architect",
            "company": "Tech Innovators",
            "url": "https://www.linkedin.com/jobs/view/77777777/",
            "status": "Еще не написан"
        }
        res = self.client.post("/api/vacancies", json=create_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        vacancy_id = data["id"]
        
        # Verify initial history record exists
        self.assertTrue("history" in data)
        self.assertGreaterEqual(len(data["history"]), 1)
        initial_history = data["history"][0]
        self.assertEqual(initial_history["to_status"], "Еще не написан")
        self.assertIsNone(initial_history["from_status"])
        self.assertIsNone(initial_history["comment"])

        # 2. Update status with status_comment
        update_payload = {
            "status": "Написал",
            "status_comment": "Откликнулся через рекрутера в Telegram"
        }
        res = self.client.patch(f"/api/vacancies/{vacancy_id}", json=update_payload)
        self.assertEqual(res.status_code, 200)
        updated_data = res.json()
        self.assertEqual(updated_data["status"], "Написал")
        self.assertEqual(len(updated_data["history"]), 2)
        
        step2 = updated_data["history"][1]
        self.assertEqual(step2["from_status"], "Еще не написан")
        self.assertEqual(step2["to_status"], "Написал")
        self.assertEqual(step2["comment"], "Откликнулся через рекрутера в Telegram")

        # 3. Update comment on step 2 via PATCH /history/{history_id}
        history_id = step2["id"]
        comment_update_res = self.client.patch(
            f"/api/vacancies/{vacancy_id}/history/{history_id}",
            json={"comment": "Обновленный комментарий: собеседование назначено на четверг"}
        )
        self.assertEqual(comment_update_res.status_code, 200)
        updated_history_data = comment_update_res.json()
        step2_updated = [h for h in updated_history_data["history"] if h["id"] == history_id][0]
        self.assertEqual(step2_updated["comment"], "Обновленный комментарий: собеседование назначено на четверг")

        # 4. Move to another status without comment
        res = self.client.patch(f"/api/vacancies/{vacancy_id}", json={"status": "Собеседование"})
        self.assertEqual(res.status_code, 200)
        updated_data3 = res.json()
        self.assertEqual(len(updated_data3["history"]), 3)
        step3 = updated_data3["history"][2]
        self.assertEqual(step3["from_status"], "Написал")
        self.assertEqual(step3["to_status"], "Собеседование")
        self.assertIsNone(step3["comment"])

        # 5. Add comment to step 3 later
        res = self.client.patch(
            f"/api/vacancies/{vacancy_id}/history/{step3['id']}",
            json={"comment": "Техническое интервью прошло отлично"}
        )
        self.assertEqual(res.status_code, 200)
        step3_updated = [h for h in res.json()["history"] if h["id"] == step3["id"]][0]
        self.assertEqual(step3_updated["comment"], "Техническое интервью прошло отлично")

        # Cleanup
        self.client.delete(f"/api/vacancies/{vacancy_id}")

if __name__ == "__main__":
    unittest.main()
