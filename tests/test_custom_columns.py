import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import BASE_STATUSES, DEFAULT_COLUMNS

class TestCustomColumns(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Login dev user
        login_resp = self.client.post("/api/auth/dev-login", json={"email": "col_test@local.user", "name": "Column Tester"})
        self.assertEqual(login_resp.status_code, 200)

    def test_default_columns_and_crud(self):
        # 1. Fetch default columns
        res = self.client.get("/api/columns")
        self.assertEqual(res.status_code, 200)
        cols = res.json()
        self.assertEqual(len(cols), len(DEFAULT_COLUMNS))
        self.assertTrue(any(c["id"] == "Еще не написан" and c["is_base"] for c in cols))
        self.assertTrue(any(c["id"] == "Отказ" and c["is_base"] for c in cols))

        # 2. Add custom column with stages (has_lanes)
        create_res = self.client.post("/api/columns", json={
            "name": "Технический скрининг",
            "color": "#10b981",
            "has_lanes": True
        })
        self.assertEqual(create_res.status_code, 200)
        cols = create_res.json()
        custom_col = next((c for c in cols if c["id"] == "Технический скрининг"), None)
        self.assertIsNotNone(custom_col)
        self.assertTrue(custom_col["has_lanes"])
        self.assertEqual(custom_col["color"], "#10b981")
        self.assertFalse(custom_col["is_base"])

        # 3. Create a vacancy with this custom status
        vac_res = self.client.post("/api/vacancies", json={
            "title": "Senior Python Engineer",
            "company": "Tech Corp",
            "url": "https://example.com/job/123",
            "status": "Технический скрининг"
        })
        self.assertEqual(vac_res.status_code, 200)
        vac_id = vac_res.json()["id"]
        self.assertEqual(vac_res.json()["status"], "Технический скрининг")

        # 4. Rename custom column
        patch_res = self.client.patch("/api/columns/Технический скрининг", json={
            "new_name": "Tech Interview"
        })
        self.assertEqual(patch_res.status_code, 200)
        cols = patch_res.json()
        self.assertTrue(any(c["id"] == "Tech Interview" for c in cols))
        self.assertFalse(any(c["id"] == "Технический скрининг" for c in cols))

        # Verify vacancy was updated to renamed status
        get_vac = self.client.get(f"/api/vacancies/{vac_id}")
        self.assertEqual(get_vac.status_code, 200)
        self.assertEqual(get_vac.json()["status"], "Tech Interview")

        # 5. Delete column with migration
        del_res = self.client.delete("/api/columns/Tech Interview?migrate_to=Еще не написан")
        self.assertEqual(del_res.status_code, 200)
        cols = del_res.json()
        self.assertFalse(any(c["id"] == "Tech Interview" for c in cols))

        # Vacancy should have moved to 'Еще не написан'
        get_vac_after = self.client.get(f"/api/vacancies/{vac_id}")
        self.assertEqual(get_vac_after.status_code, 200)
        self.assertEqual(get_vac_after.json()["status"], "Еще не написан")

        # 6. Cannot delete base column
        bad_del = self.client.delete("/api/columns/Еще не написан")
        self.assertEqual(bad_del.status_code, 400)
        bad_del2 = self.client.delete("/api/columns/Отказ")
        self.assertEqual(bad_del2.status_code, 400)

        # Cleanup
        self.client.delete(f"/api/vacancies/{vac_id}")

if __name__ == "__main__":
    unittest.main()
