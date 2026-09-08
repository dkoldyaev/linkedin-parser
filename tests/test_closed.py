import unittest
from bs4 import BeautifulSoup
from backend.scraper import extract_is_closed_from_soup
from backend.database import ensure_db_schema, SessionLocal
from backend.models import Vacancy
from backend.main import app
from fastapi.testclient import TestClient

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

    def test_database_and_api(self):
        ensure_db_schema()
        client = TestClient(app)

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

if __name__ == "__main__":
    unittest.main()
