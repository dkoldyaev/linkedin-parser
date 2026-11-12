import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import ensure_db_schema

class TestStageTransitions(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ensure_db_schema()

    def setUp(self):
        self.client = TestClient(app)
        login_res = self.client.post("/api/v2/auth/dev-login", json={"email": "stage_test@example.com", "name": "Stage Tester"})
        self.assertEqual(login_res.status_code, 200)

    def test_reorder_lane_isolation_and_history(self):
        # 1. Create two vacancies in 'Собеседование' (a column with has_lanes=True)
        res1 = self.client.post("/api/v2/vacancies", json={
            "title": "Engineer Alpha",
            "company": "Alpha Corp",
            "url": "https://example.com/job/alpha",
            "status": "Собеседование"
        })
        self.assertEqual(res1.status_code, 200)
        vac1 = res1.json()
        self.assertEqual(vac1["lane"], 0)

        res2 = self.client.post("/api/v2/vacancies", json={
            "title": "Engineer Beta",
            "company": "Beta Corp",
            "url": "https://example.com/job/beta",
            "status": "Собеседование"
        })
        self.assertEqual(res2.status_code, 200)
        vac2 = res2.json()
        self.assertEqual(vac2["lane"], 0)

        # 2. Reorder moving vac1 to Stage 2 (lane=1), while vac2 remains in Stage 1 (lane=0)
        reorder_res = self.client.post("/api/v2/vacancies/reorder", json={
            "status": "Собеседование",
            "ids": [vac2["id"], vac1["id"]],
            "lane": 1,
            "moved_id": vac1["id"]
        })
        self.assertEqual(reorder_res.status_code, 200)
        updated_list = reorder_res.json()
        by_id = {v["id"]: v for v in updated_list}

        # Verify vac1 moved to lane 1, but vac2 stayed at lane 0
        self.assertEqual(by_id[vac1["id"]]["lane"], 1)
        self.assertEqual(by_id[vac2["id"]]["lane"], 0)

        # 3. Verify history for vac1 records the stage transition
        vac1_fresh = self.client.get(f"/api/v2/vacancies/{vac1['id']}").json()
        self.assertEqual(len(vac1_fresh["history"]), 2)
        stage_move = vac1_fresh["history"][-1]
        self.assertEqual(stage_move["from_status"], "Собеседование")
        self.assertEqual(stage_move["to_status"], "Собеседование")
        self.assertEqual(stage_move["from_lane"], 0)
        self.assertEqual(stage_move["to_lane"], 1)

        # Verify vac2 has no stage move history
        vac2_fresh = self.client.get(f"/api/v2/vacancies/{vac2['id']}").json()
        self.assertEqual(len(vac2_fresh["history"]), 1)

        # 4. Move vac1 via PATCH to column without lanes ('Оффер')
        patch_res = self.client.patch(f"/api/v2/vacancies/{vac1['id']}", json={"status": "Оффер"})
        self.assertEqual(patch_res.status_code, 200)
        vac1_offer = patch_res.json()
        self.assertEqual(vac1_offer["status"], "Оффер")
        self.assertEqual(vac1_offer["lane"], 0)

        offer_history = vac1_offer["history"][-1]
        self.assertEqual(offer_history["from_status"], "Собеседование")
        self.assertEqual(offer_history["to_status"], "Оффер")
        self.assertEqual(offer_history["from_lane"], 1)
        self.assertEqual(offer_history["to_lane"], 0)

        # 5. Move vac2 via PATCH to lane 2 in 'Собеседование'
        patch_res2 = self.client.patch(f"/api/v2/vacancies/{vac2['id']}", json={"lane": 2})
        self.assertEqual(patch_res2.status_code, 200)
        vac2_lane2 = patch_res2.json()
        self.assertEqual(vac2_lane2["lane"], 2)
        vac2_history = vac2_lane2["history"][-1]
        self.assertEqual(vac2_history["from_lane"], 0)
        self.assertEqual(vac2_history["to_lane"], 2)

        # Cleanup
        self.client.delete(f"/api/v2/vacancies/{vac1['id']}")
        self.client.delete(f"/api/v2/vacancies/{vac2['id']}")

if __name__ == "__main__":
    unittest.main()

