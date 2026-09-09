import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import ensure_db_schema, SessionLocal, engine, Base
from backend.models import User, Vacancy, UserSetting
from backend.auth import create_access_token, COOKIE_NAME

class TestAuthAndIsolation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        ensure_db_schema()

    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()

    def tearDown(self):
        # Clean up test users
        users = self.db.query(User).filter(User.email.in_(["user_a@test.com", "user_b@test.com"])).all()
        for u in users:
            self.db.delete(u)
        self.db.commit()
        self.db.close()

    def test_unauthenticated_request_rejected(self):
        # Unauthenticated request to /api/vacancies must return 401
        res = self.client.get("/api/vacancies")
        self.assertEqual(res.status_code, 401)

        # Unauthenticated request to /api/settings must return 401
        res_settings = self.client.get("/api/settings")
        self.assertEqual(res_settings.status_code, 401)

    def test_auth_config_endpoint(self):
        res = self.client.get("/api/auth/config")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("google_configured", data)
        self.assertIn("dev_mode", data)

    def test_dev_login_flow(self):
        # Log in as user A
        res_a = self.client.post("/api/auth/dev-login", json={
            "email": "user_a@test.com",
            "name": "User Alpha"
        })
        self.assertEqual(res_a.status_code, 200)
        data_a = res_a.json()
        self.assertIn("user", data_a)
        self.assertEqual(data_a["user"]["email"], "user_a@test.com")
        self.assertEqual(data_a["user"]["name"], "User Alpha")
        self.assertIn("token", data_a)

        # Token allows accessing /api/auth/me
        token_a = data_a["token"]
        res_me = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token_a}"})
        self.assertEqual(res_me.status_code, 200)
        self.assertEqual(res_me.json()["email"], "user_a@test.com")

    def test_user_board_isolation(self):
        # 1. Login User A
        res_a = self.client.post("/api/auth/dev-login", json={
            "email": "user_a@test.com",
            "name": "User Alpha"
        })
        token_a = res_a.json()["token"]
        client_a = TestClient(app, cookies={COOKIE_NAME: token_a})

        # 2. Login User B
        res_b = self.client.post("/api/auth/dev-login", json={
            "email": "user_b@test.com",
            "name": "User Beta"
        })
        token_b = res_b.json()["token"]
        client_b = TestClient(app, cookies={COOKIE_NAME: token_b})

        # 3. User A creates a vacancy
        create_res = client_a.post("/api/vacancies", json={
            "title": "Senior AI Architect",
            "company": "DeepMind Partner",
            "url": "https://www.linkedin.com/jobs/view/10000001",
            "tags": ["python", "ai-alpha"],
            "country": "Germany",
            "city": "Berlin"
        })
        self.assertEqual(create_res.status_code, 200)
        vac_a_id = create_res.json()["id"]

        # 4. User A sees their vacancy
        vacs_a = client_a.get("/api/vacancies").json()
        self.assertTrue(any(v["id"] == vac_a_id for v in vacs_a))

        # 5. User B must NOT see User A's vacancy on their board!
        vacs_b = client_b.get("/api/vacancies").json()
        self.assertFalse(any(v["id"] == vac_a_id for v in vacs_b))

        # 6. User B cannot access User A's vacancy directly
        get_b = client_b.get(f"/api/vacancies/{vac_a_id}")
        self.assertEqual(get_b.status_code, 404)

        # 7. User B cannot modify User A's vacancy
        patch_b = client_b.patch(f"/api/vacancies/{vac_a_id}", json={"status": "Оффер"})
        self.assertEqual(patch_b.status_code, 404)

        # 8. User B cannot delete User A's vacancy
        del_b = client_b.delete(f"/api/vacancies/{vac_a_id}")
        self.assertEqual(del_b.status_code, 404)

        # 9. Tags & Location isolation
        tags_a = client_a.get("/api/tags").json()
        tags_b = client_b.get("/api/tags").json()
        self.assertIn("ai-alpha", tags_a)
        self.assertNotIn("ai-alpha", tags_b)

        countries_a = client_a.get("/api/countries").json()
        countries_b = client_b.get("/api/countries").json()
        self.assertIn("Germany", countries_a)
        self.assertNotIn("Germany", countries_b)

        # 10. User A can delete their own vacancy
        del_a = client_a.delete(f"/api/vacancies/{vac_a_id}")
        self.assertEqual(del_a.status_code, 204)

    def test_user_settings_isolation(self):
        # 1. Login User A and User B
        res_a = self.client.post("/api/auth/dev-login", json={"email": "user_a@test.com", "name": "User Alpha"})
        token_a = res_a.json()["token"]
        client_a = TestClient(app, cookies={COOKIE_NAME: token_a})

        res_b = self.client.post("/api/auth/dev-login", json={"email": "user_b@test.com", "name": "User Beta"})
        token_b = res_b.json()["token"]
        client_b = TestClient(app, cookies={COOKIE_NAME: token_b})

        # 2. User A sets Gemini provider and English locale
        set_a = client_a.post("/api/settings", json={
            "llm_provider": "gemini",
            "gemini_model": "gemini-2.5-pro",
            "locale": "en"
        })
        self.assertEqual(set_a.status_code, 200)

        # 3. User B sets Mistral provider and Russian locale
        set_b = client_b.post("/api/settings", json={
            "llm_provider": "mistral",
            "mistral_model": "mistral-large-latest",
            "locale": "ru"
        })
        self.assertEqual(set_b.status_code, 200)

        # 4. Verify settings remain isolated
        settings_a = client_a.get("/api/settings").json()
        settings_b = client_b.get("/api/settings").json()

        self.assertEqual(settings_a["llm_provider"], "gemini")
        self.assertEqual(settings_a["gemini_model"], "gemini-2.5-pro")
        self.assertEqual(settings_a["locale"], "en")

        self.assertEqual(settings_b["llm_provider"], "mistral")
        self.assertEqual(settings_b["mistral_model"], "mistral-large-latest")
        self.assertEqual(settings_b["locale"], "ru")

    def test_mercure_user_scoped_topic(self):
        res_a = self.client.post("/api/auth/dev-login", json={"email": "user_a@test.com", "name": "User Alpha"})
        user_a_id = res_a.json()["user"]["id"]
        token_a = res_a.json()["token"]
        client_a = TestClient(app, cookies={COOKIE_NAME: token_a})

        cfg_a = client_a.get("/api/config").json()
        self.assertEqual(cfg_a["mercure_topic"], f"vacancies:{user_a_id}")

    def test_google_auth_url_query_format(self):
        from backend.auth import get_google_auth_url
        url = get_google_auth_url(redirect_uri="http://localhost:8000/api/auth/google/callback", state="test_state_123")
        self.assertIn("https://accounts.google.com/o/oauth2/v2/auth?", url)
        self.assertIn("response_type=code", url)
        self.assertIn("state=test_state_123", url)
        # Ensure no malformed double keys like 'client_id=client_id=' or 'state=state='
        self.assertNotIn("client_id=client_id=", url)
        self.assertNotIn("state=state=", url)
        self.assertNotIn("response_type=response_type=", url)

if __name__ == "__main__":
    unittest.main()
