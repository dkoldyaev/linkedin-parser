import os
import unittest
import tempfile
import json
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

# Configure test environment
os.environ["DATA_DIR"] = tempfile.mkdtemp()
os.environ["DEV_AUTH"] = "true"
os.environ["LLM_SERVICE_URL"] = "http://localhost:5001"

from backend.main import app
from backend.database import ensure_db_schema, Base, engine, SessionLocal
from backend.models import User, Vacancy, ApprovedCV, VacancyCVAnalysis

class TestCVAndMatchingWorkflows(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        ensure_db_schema()

    def setUp(self):
        self.client = TestClient(app)
        # Login dev user A
        res_a = self.client.post("/api/auth/dev-login", json={"email": "alice@local.test", "name": "Alice"})
        self.assertEqual(res_a.status_code, 200)
        self.cookies_alice = res_a.cookies

        # Login dev user B
        res_b = self.client.post("/api/auth/dev-login", json={"email": "bob@local.test", "name": "Bob"})
        self.assertEqual(res_b.status_code, 200)
        self.cookies_bob = res_b.cookies

    def test_company_anonymization_privacy_boundary(self):
        """Scenario 4: Only company names are sent to the backend endpoint."""
        from unittest.mock import patch, AsyncMock
        mock_replacements = [
            {"original": "Acme Bank", "replacement": "Digital bank"},
            {"original": "Beta Insurance", "replacement": "Insurance company"},
        ]

        with patch("backend.main.anonymize_companies_with_llm", new_callable=AsyncMock) as mock_anon:
            mock_anon.return_value = mock_replacements
            resp = self.client.post(
                "/api/cv/anonymize-companies",
                json={"companies": ["Acme Bank", "Beta Insurance"]},
                cookies=self.cookies_alice,
            )
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertEqual(len(data["replacements"]), 2)
            self.assertEqual(data["replacements"][0]["replacement"], "Digital bank")

            # Verify the forwarded payload contains ONLY companies
            called_args, called_kwargs = mock_anon.call_args
            sent_companies = called_kwargs.get("companies")
            self.assertEqual(sent_companies, ["Acme Bank", "Beta Insurance"])

    def test_approved_cv_lifecycle_and_user_isolation(self):
        """Scenario 5 & User Isolation: Alice's approved CV cannot be accessed by Bob."""
        # Alice saves approved CV
        payload = {"content": "Senior React Engineer at [COMPANY].", "revision": 1}
        resp = self.client.post("/api/cv/approved", json=payload, cookies=self.cookies_alice)
        self.assertEqual(resp.status_code, 200)
        alice_cv = resp.json()
        self.assertEqual(alice_cv["content"], payload["content"])
        self.assertEqual(alice_cv["revision"], 1)

        # Alice gets her approved CV
        get_res = self.client.get("/api/cv/approved", cookies=self.cookies_alice)
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["content"], payload["content"])

        # Bob gets his approved CV -> should be null
        bob_res = self.client.get("/api/cv/approved", cookies=self.cookies_bob)
        self.assertEqual(bob_res.status_code, 200)
        self.assertIsNone(bob_res.json())

    def test_vacancy_compatibility_and_invalidation(self):
        """Scenarios 7, 8, 12: Compatibility evaluation and cache invalidation on CV change."""
        # 1. Create a vacancy for Alice
        vac_resp = self.client.post(
            "/api/vacancies",
            json={
                "title": "Senior Frontend Developer",
                "company": "Tech Corp",
                "url": "https://example.com/job/1",
                "description": "Looking for React, TypeScript, and Kubernetes.",
                "tech_stack": ["React", "TypeScript", "Kubernetes"],
            },
            cookies=self.cookies_alice,
        )
        self.assertEqual(vac_resp.status_code, 200)
        vac_id = vac_resp.json()["id"]

        # 2. Save approved CV (Rev 1)
        self.client.post(
            "/api/cv/approved",
            json={"content": "React and TypeScript specialist.", "revision": 1},
            cookies=self.cookies_alice,
        )

        # 3. Mock local LLM service response for evaluation
        mock_eval = {
            "summary": "Strong match on React and TypeScript. Kubernetes missing.",
            "matchedRequirements": [
                {"requirement": "React", "evidence": "React specialist"},
                {"requirement": "TypeScript", "evidence": "TypeScript specialist"},
            ],
            "missingRequirements": [
                {"requirement": "Kubernetes", "severity": "medium", "reason": "Not mentioned in CV"},
            ],
            "criticalGaps": [],
            "seniorityAssessment": {
                "status": "matched",
                "comment": "Experience matches senior role",
            },
            "recommendations": ["Highlight any Docker/k8s experience"],
            "dimensionScores": {
                "requiredTechnicalSkills": 75,
                "relevantProfessionalExperience": 85,
                "seniorityAlignment": 90,
                "optionalTechnicalSkills": 60,
                "domainExperience": 70,
            },
            "overallScore": 78,
            "scoringPolicyVersion": "v1.0",
            "model": "mistral-small-latest",
        }

        with patch("backend.main.evaluate_vacancy_compatibility_with_llm", new_callable=AsyncMock) as mock_eval_fn:
            mock_eval_fn.return_value = mock_eval
            eval_res = self.client.post(f"/api/vacancies/{vac_id}/compatibility", cookies=self.cookies_alice)
            self.assertEqual(eval_res.status_code, 200)
            data = eval_res.json()
            self.assertEqual(data["overall_score"], 78)
            self.assertEqual(data["cv_revision"], 1)
            self.assertFalse(data["is_outdated"])
            self.assertEqual(len(data["matched_requirements"]), 2)
            self.assertEqual(data["missing_requirements"][0]["requirement"], "Kubernetes")

        # 4. Scenario 12: Invalidation when approved CV revision changes
        self.client.post(
            "/api/cv/approved",
            json={"content": "React, TypeScript and AWS developer.", "revision": 2},
            cookies=self.cookies_alice,
        )

        # Cached analysis should now be marked outdated
        cached_res = self.client.get(f"/api/vacancies/{vac_id}/compatibility", cookies=self.cookies_alice)
        self.assertEqual(cached_res.status_code, 200)
        self.assertTrue(cached_res.json()["is_outdated"])

if __name__ == "__main__":
    unittest.main()
