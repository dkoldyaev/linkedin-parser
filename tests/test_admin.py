import unittest
import os
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import ensure_db_schema, SessionLocal, engine, Base
from backend.models import User, UserFeatureFlag
from backend.auth import COOKIE_NAME

class TestAdminPanel(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        ensure_db_schema()

    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()

        # Create or fetch non-admin user
        res_user = self.client.post("/api/auth/dev-login", json={
            "email": "regular_user@test.com",
            "name": "Regular User"
        })
        self.user_token = res_user.json()["token"]

        # Create or fetch admin user
        res_admin = self.client.post("/api/auth/dev-login", json={
            "email": "admin_user@test.com",
            "name": "Admin User"
        })
        self.admin_token = res_admin.json()["token"]

        # Make admin_user an actual admin via admin feature flag
        admin_db = self.db.query(User).filter(User.email == "admin_user@test.com").first()
        existing_flag = self.db.query(UserFeatureFlag).filter(
            UserFeatureFlag.user_id == admin_db.id,
            UserFeatureFlag.flag == "admin"
        ).first()
        if not existing_flag:
            self.db.add(UserFeatureFlag(user_id=admin_db.id, flag="admin"))
            self.db.commit()

        self.user_client = TestClient(app, cookies={COOKIE_NAME: self.user_token})
        self.admin_client = TestClient(app, cookies={COOKIE_NAME: self.admin_token})

    def tearDown(self):
        users = self.db.query(User).filter(User.email.in_(["regular_user@test.com", "admin_user@test.com"])).all()
        user_ids = [u.id for u in users]
        if user_ids:
            self.db.query(UserFeatureFlag).filter(UserFeatureFlag.user_id.in_(user_ids)).delete(synchronize_session=False)
        for u in users:
            self.db.delete(u)
        self.db.commit()
        self.db.close()

    def test_admin_endpoints_require_admin_role(self):
        # 1. Anonymous request to /api/admin/users -> 401
        anon_client = TestClient(app)
        res_anon = anon_client.get("/api/admin/users")
        self.assertEqual(res_anon.status_code, 401)

        # 2. Regular user request to /api/admin/users -> 403 Forbidden
        res_user = self.user_client.get("/api/admin/users")
        self.assertEqual(res_user.status_code, 403)

        # 3. Regular user PATCH -> 403
        res_patch = self.user_client.patch("/api/admin/users/1", json={"feature_flags": ["admin"]})
        self.assertEqual(res_patch.status_code, 403)

    def test_admin_can_list_and_update_feature_flags(self):
        # 1. Admin can list users
        res = self.admin_client.get("/api/admin/users")
        self.assertEqual(res.status_code, 200)
        users = res.json()
        self.assertTrue(len(users) >= 2)

        reg_user = next((u for u in users if u["email"] == "regular_user@test.com"), None)
        self.assertIsNotNone(reg_user)
        self.assertNotIn("admin", reg_user.get("feature_flags", []))

        # 2. Admin assigns feature flags to regular user
        patch_res = self.admin_client.patch(f"/api/admin/users/{reg_user['id']}", json={
            "feature_flags": ["cv_edit", "api_access"]
        })
        self.assertEqual(patch_res.status_code, 200)
        updated = patch_res.json()
        self.assertIn("cv_edit", updated["feature_flags"])
        self.assertIn("api_access", updated["feature_flags"])

        # 3. Regular user sees their feature flags in /api/auth/me
        me_res = self.user_client.get("/api/auth/me")
        self.assertEqual(me_res.status_code, 200)
        me_data = me_res.json()
        self.assertIn("cv_edit", me_data["feature_flags"])
        self.assertIn("api_access", me_data["feature_flags"])

        # 4. Admin promotes user to admin via "admin" feature flag
        admin_promo_res = self.admin_client.patch(f"/api/admin/users/{reg_user['id']}", json={
            "feature_flags": ["cv_edit", "api_access", "admin"]
        })
        self.assertEqual(admin_promo_res.status_code, 200)
        self.assertIn("admin", admin_promo_res.json()["feature_flags"])

        # 5. Newly promoted user can now access admin endpoint
        res_promoted = self.user_client.get("/api/admin/users")
        self.assertEqual(res_promoted.status_code, 200)
