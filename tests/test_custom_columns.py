import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import (
    BASE_STATUSES,
    DEFAULT_COLUMNS,
    STATUS_NOT_CONTACTED,
    STATUS_REJECTED,
)

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
        self.assertTrue(any(c["id"] == STATUS_NOT_CONTACTED and c["is_base"] for c in cols))
        self.assertTrue(any(c["id"] == STATUS_REJECTED and c["is_base"] for c in cols))

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
        del_res = self.client.delete(f"/api/columns/Tech Interview?migrate_to={STATUS_NOT_CONTACTED}")
        self.assertEqual(del_res.status_code, 200)
        cols = del_res.json()
        self.assertFalse(any(c["id"] == "Tech Interview" for c in cols))

        # Vacancy should have moved to STATUS_NOT_CONTACTED
        get_vac_after = self.client.get(f"/api/vacancies/{vac_id}")
        self.assertEqual(get_vac_after.status_code, 200)
        self.assertEqual(get_vac_after.json()["status"], STATUS_NOT_CONTACTED)

        # 6. Cannot delete base column
        bad_del = self.client.delete(f"/api/columns/{STATUS_NOT_CONTACTED}")
        self.assertEqual(bad_del.status_code, 400)
        bad_del2 = self.client.delete(f"/api/columns/{STATUS_REJECTED}")
        self.assertEqual(bad_del2.status_code, 400)

        # Cleanup
        self.client.delete(f"/api/vacancies/{vac_id}")

    def test_rename_and_customize_base_columns(self):
        # 1. Create a vacancy in STATUS_REJECTED
        vac_res = self.client.post("/api/vacancies", json={
            "title": "Backend Go Developer",
            "company": "Fast Corp",
            "url": "https://example.com/job/456",
            "status": STATUS_REJECTED
        })
        self.assertEqual(vac_res.status_code, 200)
        vac_id = vac_res.json()["id"]
        self.assertEqual(vac_res.json()["status"], STATUS_REJECTED)

        # 2. Rename base column STATUS_REJECTED ("Отказ") to "Архив" and change color to purple
        patch_res = self.client.patch(f"/api/columns/{STATUS_REJECTED}", json={
            "new_name": "Архив",
            "color": "#a855f7"
        })
        self.assertEqual(patch_res.status_code, 200)
        cols = patch_res.json()

        # Verify "Архив" exists, has is_base=True, system_role="rejected", color="#a855f7"
        archived_col = next((c for c in cols if c["id"] == "Архив"), None)
        self.assertIsNotNone(archived_col)
        self.assertTrue(archived_col["is_base"])
        self.assertEqual(archived_col["system_role"], "rejected")
        self.assertEqual(archived_col["color"], "#a855f7")

        # Verify old name no longer in columns
        self.assertFalse(any(c["id"] == STATUS_REJECTED for c in cols))

        # 3. Vacancy status was migrated to "Архив"
        get_vac = self.client.get(f"/api/vacancies/{vac_id}")
        self.assertEqual(get_vac.status_code, 200)
        self.assertEqual(get_vac.json()["status"], "Архив")

        # 4. Renamed base column STILL cannot be deleted
        del_res = self.client.delete("/api/columns/Архив")
        self.assertEqual(del_res.status_code, 400)
        self.assertIn("cannot be deleted", del_res.json()["detail"])

        # 5. Rename initial column STATUS_NOT_CONTACTED to "Новые"
        patch_res2 = self.client.patch(f"/api/columns/{STATUS_NOT_CONTACTED}", json={
            "new_name": "Новые",
            "color": "#3b82f6"
        })
        self.assertEqual(patch_res2.status_code, 200)
        cols2 = patch_res2.json()
        new_initial_col = next((c for c in cols2 if c["id"] == "Новые"), None)
        self.assertIsNotNone(new_initial_col)
        self.assertTrue(new_initial_col["is_base"])
        self.assertEqual(new_initial_col["system_role"], "not_contacted")

        # 6. Reorder columns with new names succeeds
        order_res = self.client.put("/api/columns/order", json={
            "columns": cols2
        })
        self.assertEqual(order_res.status_code, 200)

        # 7. Reorder omitting a base column fails
        cols_missing_base = [c for c in cols2 if c["id"] != "Архив"]
        bad_order_res = self.client.put("/api/columns/order", json={
            "columns": cols_missing_base
        })
        self.assertEqual(bad_order_res.status_code, 400)

        # Cleanup: rename back so other tests aren't affected
        self.client.patch("/api/columns/Архив", json={"new_name": STATUS_REJECTED, "color": "#ef4444"})
        self.client.patch("/api/columns/Новые", json={"new_name": STATUS_NOT_CONTACTED, "color": "#6366f1"})
        self.client.delete(f"/api/vacancies/{vac_id}")

if __name__ == "__main__":
    unittest.main()
