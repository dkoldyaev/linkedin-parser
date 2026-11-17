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
            '<div><h2>Unable to load the page</h2><p>Job id provided may not be valid or the job posting has been removed.</p></div>',
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
        login_res = client.post("/api/v2/auth/dev-login", json={"email": "closed_test@local.user"})
        token = login_res.json()["token"]
        client = TestClient(app, cookies={"access_token": token})

        # Create a vacancy with is_closed=False
        res = client.post("/api/v2/vacancies", json={
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
        res_patch = client.patch(f"/api/v2/vacancies/{vid}", json={"is_closed": True})
        self.assertEqual(res_patch.status_code, 200)
        self.assertTrue(res_patch.json()["is_closed"])

        # Filter API by is_closed
        res_filter = client.get("/api/v2/vacancies?is_closed=true")
        self.assertEqual(res_filter.status_code, 200)
        vacancies = res_filter.json()
        self.assertTrue(any(v["id"] == vid for v in vacancies))

        # Cleanup
        client.delete(f"/api/v2/vacancies/{vid}")

    def test_linkedin_closed_on_removed_page(self):
        import asyncio
        from backend.parsers.linkedin import LinkedInParser

        parser = LinkedInParser()
        html = """
        <html>
          <body>
            <h2>Unable to load the page</h2>
            <p>Job id provided may not be valid or the job posting has been removed.</p>
          </body>
        </html>
        """
        data = asyncio.run(parser.parse("https://www.linkedin.com/jobs/view/1234567890/", html))
        self.assertTrue(data["is_closed"])
        self.assertIsNone(data["title"])
        self.assertIsNone(data["description"])

    def test_upwork_closed_on_category_redirect(self):
        import asyncio
        from backend.parsers.upwork import UpworkParser

        parser = UpworkParser()
        # 1. URL redirected to a category without ~cipher ID
        html_category = """
        <html>
          <head><link rel="canonical" href="https://www.upwork.com/freelance-jobs/full-stack-development/" /></head>
          <body><h1>Freelance Full Stack Development Jobs</h1></body>
        </html>
        """
        data = asyncio.run(parser.parse("https://www.upwork.com/freelance-jobs/full-stack-development/", html_category))
        self.assertTrue(data["is_closed"])

        # 2. Normal Upwork vacancy with cipher ID and 302 apply redirect
        html_normal = """
        <html>
          <head><link rel="canonical" href="https://www.upwork.com/freelance-jobs/apply/Full-Stack-Developer_~022109565404398276670" /></head>
          <body><h4>Full Stack Developer</h4><div class="job-description">Looking for Python dev</div></body>
        </html>
        """
        data_normal = asyncio.run(parser.parse("https://www.upwork.com/jobs/Full-Stack-Developer_~022109565404398276670/?referrer_url_path=find_work_home", html_normal))
        self.assertFalse(data_normal["is_closed"])
        self.assertEqual(data_normal["title"], "Full Stack Developer")

    def test_queue_preserves_data_when_marked_closed(self):
        import asyncio
        from backend.models import Vacancy
        from backend.database import SessionLocal
        from backend.queue_manager import queue_manager, JobTask, TASK_KEY_PREFIX
        import fakeredis.aioredis

        # Setup fakeredis if not set
        fake_r = fakeredis.aioredis.FakeRedis(decode_responses=True)
        old_redis = queue_manager.redis
        queue_manager.redis = fake_r

        with SessionLocal() as db:
            v = Vacancy(
                user_id=1,
                url="https://www.upwork.com/jobs/~022109565404398276670/",
                job_id="~022109565404398276670",
                title="Original Important Title",
                description="Original Description Content",
                company="Original Client",
                is_closed=False,
            )
            db.add(v)
            db.commit()
            db.refresh(v)
            vid = v.id

        try:
            # Simulate extension result reporting job is closed
            task = JobTask(
                task_id="test_task_closed",
                url="https://www.upwork.com/jobs/~022109565404398276670/",
                default_tags=[],
                batch_id="test_batch",
                user_id=1,
                vacancy_id=vid,
                status="pending_extension",
            )
            # Store in redis mock/queue
            async def run():
                import json
                await queue_manager.redis.set(f"{TASK_KEY_PREFIX}test_task_closed", json.dumps(task.to_dict()))
                await queue_manager.process_extension_result(
                    "test_task_closed",
                    {
                        "is_closed": True,
                        "title": None,
                        "description": None,
                        "source": "Upwork",
                    }
                )
            asyncio.run(run())

            with SessionLocal() as db:
                updated = db.query(Vacancy).filter(Vacancy.id == vid).first()
                self.assertTrue(updated.is_closed)
                self.assertEqual(updated.title, "Original Important Title")
                self.assertEqual(updated.description, "Original Description Content")
                self.assertEqual(updated.company, "Original Client")
        finally:
            queue_manager.redis = old_redis
            with SessionLocal() as db:
                db.query(Vacancy).filter(Vacancy.id == vid).delete()
                db.commit()

    def test_rejection_status_transition(self):
        client = TestClient(app)
        login_res = client.post("/api/v2/auth/dev-login", json={"email": "rejection_test@local.user"})
        token = login_res.json()["token"]
        client = TestClient(app, cookies={"access_token": token})

        # Create vacancy
        res = client.post("/api/v2/vacancies", json={
            "title": "Full Stack Dev",
            "company": "Reject Corp",
            "url": "https://www.linkedin.com/jobs/view/8888888888",
            "status": STATUS_NOT_CONTACTED
        })
        self.assertEqual(res.status_code, 200)
        vid = res.json()["id"]

        # Move to 'Отказ'
        patch_res = client.patch(f"/api/v2/vacancies/{vid}", json={"status": STATUS_REJECTED})
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.json()["status"], STATUS_REJECTED)

        # Filter by 'Отказ'
        filter_res = client.get(f"/api/v2/vacancies?status={STATUS_REJECTED}")
        self.assertEqual(filter_res.status_code, 200)
        self.assertTrue(any(v["id"] == vid for v in filter_res.json()))

        # Restore to STATUS_NOT_CONTACTED
        restore_res = client.patch(f"/api/v2/vacancies/{vid}", json={"status": STATUS_NOT_CONTACTED})
        self.assertEqual(restore_res.status_code, 200)
        self.assertEqual(restore_res.json()["status"], STATUS_NOT_CONTACTED)

        # Cleanup
        client.delete(f"/api/v2/vacancies/{vid}")

if __name__ == "__main__":
    unittest.main()
