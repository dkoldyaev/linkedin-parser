import unittest
from bs4 import BeautifulSoup
from backend.scraper import extract_is_closed_from_soup
from backend.database import ensure_db_schema
from backend.main import app
from fastapi.testclient import TestClient

from backend.models import STATUS_NOT_CONTACTED, STATUS_REJECTED

class TestClosedVacancy(unittest.TestCase):
    def test_extract_closed_linkedin_figcaption(self):
        html = """
        <div class="top-card-layout">
          <h1 class="top-card-layout__title">Software Engineer</h1>
          <figcaption class="closed-job__flavor">No longer accepting applications</figcaption>
        </div>
        """
        soup = BeautifulSoup(html, "html.parser")
        self.assertTrue(extract_is_closed_from_soup(soup, html))

    def test_extract_closed_topcard_flavor_closed(self):
        html = """
        <div class="top-card-layout">
          <span class="topcard__flavor topcard__flavor--closed">Closed</span>
        </div>
        """
        soup = BeautifulSoup(html, "html.parser")
        self.assertTrue(extract_is_closed_from_soup(soup, html))

    def test_extract_closed_russian_variants(self):
        cases = [
            '<div class="top-card-layout__entity-info">Заявки больше не принимаются</div>',
            '<span class="topcard__flavor">Прием заявок закрыт</span>',
            '<span class="topcard__flavor">Приём заявок закрыт</span>',
            '<span class="topcard__flavor">Прием заявок завершен</span>',
            '<span class="topcard__flavor">Приём откликов приостановлен</span>',
            '<div class="banner">Вакансия закрыта</div>',
        ]
        for html in cases:
            soup = BeautifulSoup(html, "html.parser")
            self.assertTrue(extract_is_closed_from_soup(soup, html), f"Failed to detect closed in: {html}")

    def test_extract_closed_multilingual(self):
        html_de = '<span class="topcard__flavor">Es werden keine Bewerbungen mehr angenommen</span>'
        soup_de = BeautifulSoup(html_de, "html.parser")
        self.assertTrue(extract_is_closed_from_soup(soup_de, html_de))

        html_fr = '<span class="topcard__flavor">Les candidatures ne sont plus acceptées</span>'
        soup_fr = BeautifulSoup(html_fr, "html.parser")
        self.assertTrue(extract_is_closed_from_soup(soup_fr, html_fr))

    def test_extract_open_vacancy(self):
        html = """
        <div class="top-card-layout">
          <h1 class="top-card-layout__title">Senior Backend Developer</h1>
          <span class="topcard__flavor">Berlin, Germany</span>
          <button class="apply-button">Apply now</button>
        </div>
        <div class="description__text">
          <p>We are hiring an experienced engineer!</p>
        </div>
        """
        soup = BeautifulSoup(html, "html.parser")
        self.assertFalse(extract_is_closed_from_soup(soup, html))

    def test_no_false_positive_in_description_body(self):
        html = """
        <div class="top-card-layout">
          <h1 class="top-card-layout__title">DevOps Engineer</h1>
          <button class="apply-button">Easy Apply</button>
        </div>
        <div class="description__text">
          <p>Please note: we are no longer accepting applications by fax or mail.</p>
        </div>
        """
        soup = BeautifulSoup(html, "html.parser")
        self.assertFalse(extract_is_closed_from_soup(soup, html))

    def test_is_closed_bogus_title(self):
        from backend.parsers.types import is_closed_bogus_title
        # Empty, None or unloaded title must NOT be considered a bogus closed title
        self.assertFalse(is_closed_bogus_title(None))
        self.assertFalse(is_closed_bogus_title(""))
        self.assertFalse(is_closed_bogus_title("   "))
        self.assertFalse(is_closed_bogus_title("Software Engineer"))

        # Explicit bogus error/closure titles MUST be detected
        self.assertTrue(is_closed_bogus_title("This job is no longer available."))
        self.assertTrue(is_closed_bogus_title("404 Not Found"))
        self.assertTrue(is_closed_bogus_title("Page Not Found"))
        self.assertTrue(is_closed_bogus_title("Вакансия закрыта"))
        self.assertTrue(is_closed_bogus_title("Приём откликов закрыт"))

    def test_database_and_api(self):
        ensure_db_schema()
        client = TestClient(app)
        login_res = client.post("/api/auth/dev-login", json={"email": "closed_test@local.user"})
        token = login_res.json()["token"]
        client = TestClient(app, cookies={"access_token": token})

        # Create a vacancy with is_closed=False
        res = client.post("/api/vacancies", json={
            "title": "Test Closed Field Engineer",
            "company": "ClosedTest Inc",
            "url": "https://www.linkedin.com/jobs/view/7777777777",
            "is_closed": False
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        vid = data["id"]
        self.assertFalse(data["is_closed"])

        # Patch is_closed to True
        res_patch = client.patch(f"/api/vacancies/{vid}", json={"is_closed": True})
        self.assertEqual(res_patch.status_code, 200)
        self.assertTrue(res_patch.json()["is_closed"])

        # Filter API by is_closed
        res_filter = client.get("/api/vacancies?is_closed=true")
        self.assertEqual(res_filter.status_code, 200)
        vacancies = res_filter.json()
        self.assertTrue(any(v["id"] == vid for v in vacancies))

        # Cleanup
        client.delete(f"/api/vacancies/{vid}")

    def test_rejection_status_transition(self):
        client = TestClient(app)
        login_res = client.post("/api/auth/dev-login", json={"email": "rejection_test@local.user"})
        token = login_res.json()["token"]
        client = TestClient(app, cookies={"access_token": token})

        # Create vacancy
        res = client.post("/api/vacancies", json={
            "title": "Full Stack Dev",
            "company": "Reject Corp",
            "url": "https://www.linkedin.com/jobs/view/8888888888",
            "status": STATUS_NOT_CONTACTED
        })
        self.assertEqual(res.status_code, 200)
        vid = res.json()["id"]

        # Move to 'Отказ'
        patch_res = client.patch(f"/api/vacancies/{vid}", json={"status": STATUS_REJECTED})
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.json()["status"], STATUS_REJECTED)

        # Filter by 'Отказ'
        filter_res = client.get(f"/api/vacancies?status={STATUS_REJECTED}")
        self.assertEqual(filter_res.status_code, 200)
        self.assertTrue(any(v["id"] == vid for v in filter_res.json()))

        # Restore to STATUS_NOT_CONTACTED
        restore_res = client.patch(f"/api/vacancies/{vid}", json={"status": STATUS_NOT_CONTACTED})
        self.assertEqual(restore_res.status_code, 200)
        self.assertEqual(restore_res.json()["status"], STATUS_NOT_CONTACTED)

        # Cleanup
        client.delete(f"/api/vacancies/{vid}")

    def test_upwork_closed_page_detection_and_non_destructive_update(self):
        import asyncio
        from backend.parsers.upwork import UpworkParser
        from backend.parsers.types import is_closed_bogus_title
        from backend.database import SessionLocal
        from backend.models import Vacancy, User

        # 1. Test parser on Upwork "This job is no longer available." html
        closed_upwork_html = """
        <html>
          <body>
            <header>
              <h4>This job is no longer available.</h4>
            </header>
          </body>
        </html>
        """
        parser = UpworkParser()
        parsed = asyncio.run(parser.parse("https://www.upwork.com/jobs/~0123456789abcdef", closed_upwork_html))
        self.assertTrue(parsed["is_closed"])
        self.assertIsNone(parsed["title"])
        self.assertTrue(is_closed_bogus_title("This job is no longer available."))

        # 2. Test non-destructive update via API/DB
        client = TestClient(app)
        login_res = client.post("/api/auth/dev-login", json={"email": "non_destruct@local.user"})
        token = login_res.json()["token"]
        client = TestClient(app, cookies={"access_token": token})

        # Create original active vacancy
        orig_resp = client.post("/api/vacancies", json={
            "title": "Senior Frontend Developer",
            "company": "Great Client",
            "url": "https://www.upwork.com/jobs/~0123456789abcdef",
            "description": "Original detailed job requirements and tech stack.",
            "location": "United States",
            "salary_min": 60,
            "salary_max": 80,
            "salary_currency": "USD",
            "salary_period": "hour",
            "is_closed": False
        })
        self.assertEqual(orig_resp.status_code, 200)
        vid = orig_resp.json()["id"]

        # Simulate scraper returning a 404/closed result on re-parsing
        # Apply update logic via extension_parse_and_add
        reimport_resp = client.post("/api/extension/parse_and_add", json={
            "url": "https://www.upwork.com/jobs/~0123456789abcdef",
            "source": "Upwork",
            "job_id": "~0123456789abcdef",
            "title": "This job is no longer available.",
            "is_closed": True
        })
        self.assertEqual(reimport_resp.status_code, 200)

        # Fetch vacancy and verify existing data was PRESERVED
        get_resp = client.get(f"/api/vacancies/{vid}")
        self.assertEqual(get_resp.status_code, 200)
        v = get_resp.json()
        self.assertEqual(v["title"], "Senior Frontend Developer") # Title NOT overwritten!
        self.assertEqual(v["description"], "Original detailed job requirements and tech stack.") # Description preserved!
        self.assertEqual(v["location"], "United States") # Location preserved!
        self.assertEqual(v["salary_min"], 60) # Salary preserved!
        self.assertTrue(v["is_closed"]) # is_closed updated to True!

        # Cleanup
        client.delete(f"/api/vacancies/{vid}")

if __name__ == "__main__":
    unittest.main()
