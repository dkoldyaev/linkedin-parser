import os
import unittest
import tempfile
import uuid
from fastapi.testclient import TestClient

os.environ["DEV_AUTH"] = "true"

from backend.main import app
from backend.database import ensure_db_schema, Base, engine, SessionLocal
from backend.models import User, UserFeatureFlag

class TestUserFeatureFlags(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        ensure_db_schema()

    def setUp(self):
        self.client = TestClient(app)
        # Login dev user without flags using a unique email every run
        unique_id = uuid.uuid4().hex[:8]
        email = f"flag_user_{self._testMethodName}_{unique_id}@local.test"
        res = self.client.post("/api/v2/auth/dev-login", json={"email": email, "name": "Flag User"})
        self.assertEqual(res.status_code, 200)
        self.cookies = res.cookies

    def test_default_feature_flags_and_update(self):
        """User initially has empty feature flags and can update them."""
        me_res = self.client.get("/api/v2/auth/me", cookies=self.cookies)
        self.assertEqual(me_res.status_code, 200)
        user_data = me_res.json()
        self.assertIn("feature_flags", user_data)
        self.assertEqual(user_data["feature_flags"], [])

        # Update flags via /api/v2/auth/me/feature-flags (only valid predefined constants allowed)
        update_res = self.client.put(
            "/api/v2/auth/me/feature-flags",
            json={"feature_flags": ["api_access", "arbitrary_typo_flag"]},
            cookies=self.cookies
        )
        self.assertEqual(update_res.status_code, 200)
        updated_data = update_res.json()
        self.assertIn("api_access", updated_data["feature_flags"])
        # arbitrary_typo_flag should be filtered out
        self.assertNotIn("arbitrary_typo_flag", updated_data["feature_flags"])

        # Check /api/v2/auth/me reflects update
        me_again = self.client.get("/api/v2/auth/me", cookies=self.cookies)
        self.assertEqual(me_again.status_code, 200)
        self.assertEqual(set(me_again.json()["feature_flags"]), {"api_access"})

    def test_cv_edit_available_for_all(self):
        """Saving or deleting approved CV is available for all authenticated users without cv_edit flag."""
        # Reset flags to empty
        self.client.put("/api/v2/auth/me/feature-flags", json={"feature_flags": []}, cookies=self.cookies)

        # Attempt to save approved CV -> 200 OK
        post_cv = self.client.post(
            "/api/v2/cv/approved",
            json={"content": "CV test content", "revision": 1},
            cookies=self.cookies
        )
        self.assertEqual(post_cv.status_code, 200)
        self.assertEqual(post_cv.json()["content"], "CV test content")

        # Attempt to delete approved CV -> 204 No Content
        del_cv = self.client.delete("/api/v2/cv/approved", cookies=self.cookies)
        self.assertEqual(del_cv.status_code, 204)

    def test_admin_user_management_permission_check(self):
        """Access to /api/v2/users is protected by admin flag."""
        # 1. Login user without admin flag
        self.client.put("/api/v2/auth/me/feature-flags", json={"feature_flags": []}, cookies=self.cookies)
        res_denied = self.client.get("/api/v2/users", cookies=self.cookies)
        self.assertEqual(res_denied.status_code, 403)
        self.assertIn("Admin access required", res_denied.json()["detail"])

        # Self-promotion is forbidden; an admin grant is seeded by the fixture.
        denied = self.client.put("/api/v2/auth/me/feature-flags", json={"feature_flags": ["admin"]}, cookies=self.cookies)
        self.assertEqual(denied.status_code, 403)
        own_id = self.client.get("/api/v2/auth/me", cookies=self.cookies).json()["id"]
        denied = self.client.put(f"/api/v2/users/{own_id}/feature-flags", json={"feature_flags": ["admin"]}, cookies=self.cookies)
        self.assertEqual(denied.status_code, 403)
        with SessionLocal() as db:
            db.add(UserFeatureFlag(user_id=own_id, flag="admin"))
            db.commit()
        res_allowed = self.client.get("/api/v2/users", cookies=self.cookies)
        self.assertEqual(res_allowed.status_code, 200)
        users = res_allowed.json()
        self.assertIsInstance(users, list)
        self.assertTrue(len(users) >= 1)

        # 3. Can update other user's flags
        other_user_res = self.client.post("/api/v2/auth/dev-login", json={"email": "target_user@local.test", "name": "Target"})
        other_id = other_user_res.json()["user"]["id"]

        update_target = self.client.put(
            f"/api/v2/users/{other_id}/feature-flags",
            json={"feature_flags": ["api_access"]},
            cookies=self.cookies
        )
        self.assertEqual(update_target.status_code, 200)
        self.assertEqual(update_target.json()["feature_flags"], ["api_access"])
