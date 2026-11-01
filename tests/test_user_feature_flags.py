import os
import unittest
import tempfile
import uuid
from fastapi.testclient import TestClient

os.environ["DATA_DIR"] = tempfile.mkdtemp()
os.environ["DEV_AUTH"] = "true"

from backend.main import app
from backend.database import ensure_db_schema, Base, engine
from backend.models import User

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
        res = self.client.post("/api/auth/dev-login", json={"email": email, "name": "Flag User"})
        self.assertEqual(res.status_code, 200)
        self.cookies = res.cookies

    def test_default_feature_flags_and_update(self):
        """User initially has empty feature flags and can update them."""
        me_res = self.client.get("/api/auth/me", cookies=self.cookies)
        self.assertEqual(me_res.status_code, 200)
        user_data = me_res.json()
        self.assertIn("feature_flags", user_data)
        self.assertEqual(user_data["feature_flags"], [])

        # Update flags via /api/auth/me/feature-flags
        update_res = self.client.put(
            "/api/auth/me/feature-flags",
            json={"feature_flags": ["cv_edit", "api_access", "beta_test"]},
            cookies=self.cookies
        )
        self.assertEqual(update_res.status_code, 200)
        updated_data = update_res.json()
        self.assertIn("cv_edit", updated_data["feature_flags"])
        self.assertIn("api_access", updated_data["feature_flags"])
        self.assertIn("beta_test", updated_data["feature_flags"])

        # Check /api/auth/me reflects update
        me_again = self.client.get("/api/auth/me", cookies=self.cookies)
        self.assertEqual(me_again.status_code, 200)
        self.assertEqual(me_again.json()["feature_flags"], ["cv_edit", "api_access", "beta_test"])

    def test_cv_editing_permission_check(self):
        """Saving or deleting approved CV is blocked if user lacks cv_edit feature flag."""
        # Reset flags to empty
        self.client.put("/api/auth/me/feature-flags", json={"feature_flags": []}, cookies=self.cookies)

        # Attempt to save approved CV -> 403 Forbidden
        post_cv = self.client.post(
            "/api/cv/approved",
            json={"content": "CV test content", "revision": 1},
            cookies=self.cookies
        )
        self.assertEqual(post_cv.status_code, 403)
        self.assertIn("missing feature flag", post_cv.json()["detail"])

        # Attempt to delete approved CV -> 403 Forbidden
        del_cv = self.client.delete("/api/cv/approved", cookies=self.cookies)
        self.assertEqual(del_cv.status_code, 403)

        # Now grant cv_edit flag
        self.client.put("/api/auth/me/feature-flags", json={"feature_flags": ["cv_edit"]}, cookies=self.cookies)

        # Attempt to save approved CV -> 200 OK
        post_cv_ok = self.client.post(
            "/api/cv/approved",
            json={"content": "CV test content", "revision": 1},
            cookies=self.cookies
        )
        self.assertEqual(post_cv_ok.status_code, 200)
        self.assertEqual(post_cv_ok.json()["content"], "CV test content")

        # Attempt to delete approved CV -> 204 No Content
        del_cv_ok = self.client.delete("/api/cv/approved", cookies=self.cookies)
        self.assertEqual(del_cv_ok.status_code, 204)

    def test_user_management_permission_check(self):
        """Access to /api/users is protected by user_management flag."""
        # 1. Login user without user_management flag
        self.client.put("/api/auth/me/feature-flags", json={"feature_flags": ["cv_edit"]}, cookies=self.cookies)
        res_denied = self.client.get("/api/users", cookies=self.cookies)
        self.assertEqual(res_denied.status_code, 403)
        self.assertIn("user_management", res_denied.json()["detail"])

        # 2. Grant user_management flag
        self.client.put("/api/auth/me/feature-flags", json={"feature_flags": ["cv_edit", "user_management"]}, cookies=self.cookies)
        res_allowed = self.client.get("/api/users", cookies=self.cookies)
        self.assertEqual(res_allowed.status_code, 200)
        users = res_allowed.json()
        self.assertIsInstance(users, list)
        self.assertTrue(len(users) >= 1)

        # 3. Can update other user's flags
        other_user_res = self.client.post("/api/auth/dev-login", json={"email": "target_user@local.test", "name": "Target"})
        other_id = other_user_res.json()["user"]["id"]

        update_target = self.client.put(
            f"/api/users/{other_id}/feature-flags",
            json={"feature_flags": ["cv_edit"]},
            cookies=self.cookies
        )
        self.assertEqual(update_target.status_code, 200)
        self.assertEqual(update_target.json()["feature_flags"], ["cv_edit"])
