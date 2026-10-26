"""
Comprehensive integration test for all parsers with the current application code:
1. Registry Auto-Discovery & Matching.
2. Job ID Extraction for all supported platforms.
3. Schema & DB Compatibility:
   - VacancyData typing conformance.
   - SQLAlchemy Vacancy model instantiation, persistence & retrieval.
   - Pydantic VacancyResponse serialization.
4. LLM keyword extraction compatibility.
5. End-to-End FastAPI Endpoint Verification for each parser source:
   - /api/extension/parse_and_add
   - /api/vacancies
   - /api/vacancies/{id}
"""

import os
import sys
import unittest
import asyncio
from typing import Dict, Any

from fastapi.testclient import TestClient

from backend.parsers import registry as parser_registry
from backend.parsers.types import VacancyData
from backend.scraper import extract_job_id
from backend.database import SessionLocal, ensure_db_schema
from backend.models import Vacancy, VacancyStatusHistory, User
from backend.schemas import VacancyResponse
from backend.llm import extract_fallback_tech_stack
from backend.main import app

EXAMPLES_DIR = os.path.join(os.path.dirname(__file__), "../examples")

# Representative files for each parser family
SAMPLE_FILES_BY_PARSER = {
    "avito": ("https://www.avito.ru/arzamas/vakansii/inzhener_programmist_8086146184", "avito.ru-3.html", "8086146184"),
    "habr": ("https://career.habr.com/vacancies/1000168669", "career.habr.com-2.html", "1000168669"),
    "fl_ru": ("https://www.fl.ru/projects/5523901/avtor-kartochek-kotoryie-prodayut--senior.html", "fl.ru.html", "5523901"),
    "geekjob": ("https://geekjob.ru/vacancy/691aef77ce60ad56c3046275", "geekjob.ru.html", "691aef77ce60ad56c3046275"),
    "glassdoor": ("https://www.glassdoor.com/job-listing/senior-backend-engineer-python-gopuff-JV_IC1147401_KO0,23_KE24,30.htm?jl=1009581177659", "glassdoor.com-2.html", "1009581177659"),
    "indeed": ("https://de.indeed.com/viewjob?jk=294318deae1b3655", "indeed.com-2.html", "294318deae1b3655"),
    "layboard": ("https://layboard.com/vakansiya/2392607/menedzer-pekarni", "layboard.com-2.html", "2392607"),
    "rabota_ru": ("https://www.rabota.ru/vacancy/54211993/", "rabota.ru.html", "54211993"),
    "superjob": ("https://www.superjob.ru/vakansii/redaktor-52236624.html", "superjob.ru.html", "52236624"),
    "upwork": ("https://www.upwork.com/jobs/~022104418223352040840", "upwork.com.html", "~022104418223352040840"),
}


class TestParsersCodebaseIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ensure_db_schema()
        parser_registry._auto_discover()
        cls.client = TestClient(app)
        
        # Authenticate test client via dev-login
        login_res = cls.client.post("/api/auth/dev-login", json={"email": "parser_integration_tester@example.com", "name": "Parser Tester"})
        cls.token = login_res.json()["token"]
        cls.user_id = login_res.json()["user"]["id"]
        cls.headers = {"Authorization": f"Bearer {cls.token}"}

    def test_01_all_parsers_registered(self):
        """Verify that all parsers are loaded in the registry with expected names and priorities."""
        names = {p.name for p in parser_registry.all_parsers}
        expected_parsers = {
            "avito", "fl_ru", "geekjob", "glassdoor", "habr",
            "indeed", "layboard", "linkedin", "rabota_ru", "superjob", "upwork", "universal"
        }
        missing = expected_parsers - names
        self.assertEqual(len(missing), 0, f"Missing parsers in registry: {missing}")

    def test_02_url_routing_and_matching(self):
        """Verify that every parser matches its expected URL patterns and doesn't match others."""
        for parser_name, (url, _, _) in SAMPLE_FILES_BY_PARSER.items():
            parser = parser_registry.find(url)
            self.assertIsNotNone(parser, f"Registry failed to find parser for URL: {url}")
            self.assertEqual(parser.name, parser_name, f"Expected {parser_name} for {url}, got {parser.name}")

        # Check universal fallback
        fallback = parser_registry.find("https://some-unknown-startup-jobs.com/job/12345")
        self.assertIsNotNone(fallback)
        self.assertEqual(fallback.name, "universal")

    def test_03_extract_job_id_across_all_platforms(self):
        """Verify extract_job_id works correctly for all supported job boards."""
        for parser_name, (url, _, expected_jid) in SAMPLE_FILES_BY_PARSER.items():
            actual_jid = extract_job_id(url)
            self.assertEqual(actual_jid, expected_jid, f"Failed extracting job_id for {parser_name} from {url}")

    def test_04_parsers_return_valid_vacancy_data(self):
        """Verify that every parser returns a dictionary conforming to VacancyData specification."""
        for parser_name, (url, file_name, _) in SAMPLE_FILES_BY_PARSER.items():
            file_path = os.path.join(EXAMPLES_DIR, file_name)
            if not os.path.exists(file_path):
                continue
            with open(file_path, "r", encoding="utf-8") as f:
                html = f.read()

            result = asyncio.run(parser_registry.parse(url, html=html))

            # Must have required keys
            self.assertIn("url", result, f"{parser_name} missing 'url'")
            self.assertIn("source", result, f"{parser_name} missing 'source'")
            self.assertTrue(bool(result["source"]), f"{parser_name} has empty 'source'")
            self.assertEqual(result["url"], url)

            # Check field types if present
            if result.get("title") is not None:
                self.assertIsInstance(result["title"], str)
            if result.get("company") is not None:
                self.assertIsInstance(result["company"], str)
            if result.get("location") is not None:
                self.assertIsInstance(result["location"], str)
            if result.get("city") is not None:
                self.assertIsInstance(result["city"], str)
            if result.get("country") is not None:
                self.assertIsInstance(result["country"], str)
            if result.get("salary_min") is not None:
                self.assertIsInstance(result["salary_min"], (int, float))
            if result.get("salary_max") is not None:
                self.assertIsInstance(result["salary_max"], (int, float))
            if result.get("salary_currency") is not None:
                self.assertIsInstance(result["salary_currency"], str)
            if result.get("salary_period") is not None:
                self.assertIsInstance(result["salary_period"], str)
            if result.get("workplace_type") is not None:
                self.assertIn(result["workplace_type"], ("remote", "hybrid", "on-site"))
            if result.get("is_closed") is not None:
                self.assertIsInstance(result["is_closed"], bool)

    def test_05_db_model_and_pydantic_schema_compatibility(self):
        """Verify that parsed data from every parser can be saved to DB and validated by VacancyResponse."""
        with SessionLocal() as db:
            for parser_name, (url, file_name, _) in SAMPLE_FILES_BY_PARSER.items():
                file_path = os.path.join(EXAMPLES_DIR, file_name)
                if not os.path.exists(file_path):
                    continue
                with open(file_path, "r", encoding="utf-8") as f:
                    html = f.read()

                scraped = asyncio.run(parser_registry.parse(url, html=html))

                # Instantiate ORM model
                vacancy = Vacancy(
                    user_id=self.user_id,
                    url=scraped["url"],
                    source=scraped.get("source"),
                    job_id=scraped.get("job_id"),
                    title=scraped.get("title") or "Test Title",
                    company=scraped.get("company") or "Test Company",
                    company_url=scraped.get("company_url"),
                    company_info=scraped.get("company_info"),
                    location=scraped.get("location"),
                    city=scraped.get("city"),
                    country=scraped.get("country"),
                    description=scraped.get("description"),
                    workplace_type=scraped.get("workplace_type"),
                    is_closed=scraped.get("is_closed", False),
                    salary_min=scraped.get("salary_min"),
                    salary_max=scraped.get("salary_max"),
                    salary_currency=scraped.get("salary_currency"),
                    salary_period=scraped.get("salary_period"),
                    status="Еще не написан",
                )
                db.add(vacancy)
                db.flush()
                db.add(VacancyStatusHistory(
                    vacancy_id=vacancy.id,
                    from_status=None,
                    to_status=vacancy.status,
                    created_at=vacancy.created_at,
                ))
                db.commit()
                db.refresh(vacancy)

                # Validate Pydantic response schema
                resp = VacancyResponse.model_validate(vacancy).model_dump(mode="json")
                self.assertEqual(resp["source"], scraped["source"])
                self.assertEqual(resp["url"], scraped["url"])
                self.assertIsNotNone(resp["id"])

                # Test LLM keyword fallback on description
                desc = scraped.get("description") or ""
                techs = extract_fallback_tech_stack(desc)
                self.assertIsInstance(techs, list)

                # Cleanup test vacancy
                db.delete(vacancy)
                db.commit()

    def test_06_e2e_api_extension_parse_and_add_for_all_parsers(self):
        """Verify /api/extension/parse_and_add endpoint works for every parser HTML."""
        for parser_name, (url, file_name, _) in SAMPLE_FILES_BY_PARSER.items():
            file_path = os.path.join(EXAMPLES_DIR, file_name)
            if not os.path.exists(file_path):
                continue
            with open(file_path, "r", encoding="utf-8") as f:
                html = f.read()

            # POST /api/extension/parse_and_add
            post_resp = self.client.post(
                "/api/extension/parse_and_add",
                json={"url": url, "html": html},
                headers=self.headers,
            )
            self.assertEqual(post_resp.status_code, 200, f"Failed for {parser_name}: {post_resp.text}")
            data = post_resp.json()
            self.assertEqual(data.get("status"), "queued_for_ai")
            vacancy_id = data.get("vacancy_id")
            self.assertIsNotNone(vacancy_id)

            # GET /api/vacancies/{id}
            get_resp = self.client.get(f"/api/vacancies/{vacancy_id}", headers=self.headers)
            self.assertEqual(get_resp.status_code, 200)
            v_data = get_resp.json()

            # Assert key fields are properly stored and returned
            self.assertEqual(v_data["url"], url)
            self.assertIsNotNone(v_data["source"])
            self.assertTrue(len(v_data["source"]) > 0)
            self.assertIsNotNone(v_data["status"])

            # Clean up created vacancy
            del_resp = self.client.delete(f"/api/vacancies/{vacancy_id}", headers=self.headers)
            self.assertIn(del_resp.status_code, (200, 204))


if __name__ == "__main__":
    unittest.main()
