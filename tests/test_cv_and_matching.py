import os
import unittest
import tempfile
import json
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

# Configure test environment
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
        res_a = self.client.post("/api/v2/auth/dev-login", json={"email": "alice@local.test", "name": "Alice"})
        self.assertEqual(res_a.status_code, 200)
        self.cookies_alice = res_a.cookies
        self.user_alice_id = res_a.json()["user"]["id"]
        # Enable cv_edit feature flag for Alice
        self.client.put("/api/v2/auth/me/feature-flags", json={"feature_flags": ["cv_edit"]}, cookies=self.cookies_alice)

        # Login dev user B
        res_b = self.client.post("/api/v2/auth/dev-login", json={"email": "bob@local.test", "name": "Bob"})
        self.assertEqual(res_b.status_code, 200)
        self.cookies_bob = res_b.cookies
        # Enable cv_edit feature flag for Bob
        self.client.put("/api/v2/auth/me/feature-flags", json={"feature_flags": ["cv_edit"]}, cookies=self.cookies_bob)

    def test_company_anonymization_privacy_boundary(self):
        """Scenario 4: Anonymization endpoint /api/v2/cv/anonymize-companies removed (client-side/obsolete)."""
        resp = self.client.post(
            "/api/v2/cv/anonymize-companies",
            json={"companies": ["Acme Bank", "Beta Insurance"]},
            cookies=self.cookies_alice,
        )
        self.assertEqual(resp.status_code, 404)

    def test_approved_cv_lifecycle_and_user_isolation(self):
        """Scenario 5 & User Isolation: Alice's approved CV cannot be accessed by Bob."""
        # Alice saves approved CV
        payload = {"content": "Senior React Engineer at [COMPANY].", "revision": 1}
        resp = self.client.post("/api/v2/cv", json=payload, cookies=self.cookies_alice)
        self.assertEqual(resp.status_code, 200)
        alice_cv = resp.json()
        self.assertEqual(alice_cv["content"], payload["content"])
        self.assertEqual(alice_cv["revision"], 1)

        # Alice gets her approved CV
        get_res = self.client.get("/api/v2/cv", cookies=self.cookies_alice)
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["content"], payload["content"])

        # Bob gets his approved CV -> should be null
        bob_res = self.client.get("/api/v2/cv", cookies=self.cookies_bob)
        self.assertEqual(bob_res.status_code, 200)
        self.assertIsNone(bob_res.json())

    def test_vacancy_compatibility_and_invalidation(self):
        """Scenarios 7, 8, 12: Compatibility evaluation and cache invalidation on CV change."""
        # 1. Create a vacancy for Alice
        vac_resp = self.client.post(
            "/api/v2/vacancies",
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
            "/api/v2/cv",
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

        # 3. Requesting compatibility enqueues async scoring task
        eval_res = self.client.post(f"/api/v2/vacancies/{vac_id}/compatibility", cookies=self.cookies_alice)
        self.assertEqual(eval_res.status_code, 200)
        data = eval_res.json()
        self.assertEqual(data["status"], "queued")
        self.assertEqual(data["vacancy_id"], vac_id)
        self.assertIn("batch_id", data)

        # 3b. Simulate completed analysis in DB
        with SessionLocal() as db:
            from backend.models import VacancyCVAnalysis
            analysis = VacancyCVAnalysis(
                user_id=self.user_alice_id,
                vacancy_id=vac_id,
                cv_revision=1,
                scoring_policy_version="v1.0",
                model_id="mistral-small-latest",
                overall_score=78.0,
                result=mock_eval,
                is_outdated=False,
            )
            db.add(analysis)
            db.commit()

        cached_res = self.client.get(f"/api/v2/vacancies/{vac_id}/compatibility", cookies=self.cookies_alice)
        self.assertEqual(cached_res.status_code, 200)
        cached_data = cached_res.json()
        self.assertEqual(cached_data["overall_score"], 78)
        self.assertEqual(cached_data["cv_revision"], 1)
        self.assertFalse(cached_data["is_outdated"])

        # 4. Scenario 12: Invalidation when approved CV revision changes
        self.client.post(
            "/api/v2/cv",
            json={"content": "React, TypeScript and AWS developer.", "revision": 2},
            cookies=self.cookies_alice,
        )

        # Cached analysis should now be marked outdated
        cached_res = self.client.get(f"/api/v2/vacancies/{vac_id}/compatibility", cookies=self.cookies_alice)
        self.assertEqual(cached_res.status_code, 200)
        self.assertTrue(cached_res.json()["is_outdated"])

    def test_compatibility_scoring_skipped_when_no_description(self):
        """Scoring should not run if vacancy description is empty or whitespace."""
        # Vacancy without description
        vac_resp = self.client.post(
            "/api/v2/vacancies",
            json={
                "title": "Backend Engineer",
                "company": "Tech Corp",
                "url": "https://example.com/job/2",
                "description": "",
            },
            cookies=self.cookies_alice,
        )
        self.assertEqual(vac_resp.status_code, 200)
        vac_id = vac_resp.json()["id"]

        self.client.post(
            "/api/v2/cv",
            json={"content": "Python and FastAPI specialist.", "revision": 1},
            cookies=self.cookies_alice,
        )

        with patch("backend.main.evaluate_vacancy_compatibility_with_llm", new_callable=AsyncMock) as mock_eval_fn:
            eval_res = self.client.post(f"/api/v2/vacancies/{vac_id}/compatibility", cookies=self.cookies_alice)
            self.assertEqual(eval_res.status_code, 400)
            mock_eval_fn.assert_not_called()

    def test_auto_trigger_cv_scoring_on_vacancy_creation_and_update(self):
        """When vacancy with description is created or updated, auto-enqueue for AI scoring if approved CV exists."""
        # 1. User Alice has approved CV
        self.client.post(
            "/api/v2/cv",
            json={"content": "Senior Python developer with FastAPI.", "revision": 1},
            cookies=self.cookies_alice,
        )

        with patch("backend.main.queue_manager.enqueue_ai", new_callable=AsyncMock) as mock_enqueue_ai:
            mock_enqueue_ai.return_value = None

            # Creating vacancy with description -> should trigger enqueue_ai
            create_resp = self.client.post(
                "/api/v2/vacancies",
                json={
                    "title": "Python Lead",
                    "company": "FastAPI Inc",
                    "url": "https://example.com/job/auto-1",
                    "description": "Looking for a seasoned Python engineer with FastAPI and Docker.",
                },
                cookies=self.cookies_alice,
            )
            self.assertEqual(create_resp.status_code, 200)
            vac_id = create_resp.json()["id"]
            self.assertEqual(mock_enqueue_ai.call_count, 1)
            _, kwargs = mock_enqueue_ai.call_args
            self.assertEqual(kwargs["vacancy_id"], vac_id)

            # Updating vacancy description -> should trigger enqueue_ai
            update_resp = self.client.patch(
                f"/api/v2/vacancies/{vac_id}",
                json={"description": "Updated description with Kubernetes and Python."},
                cookies=self.cookies_alice,
            )
            self.assertEqual(update_resp.status_code, 200)
            self.assertEqual(mock_enqueue_ai.call_count, 2)

            # Updating other fields without description (e.g. notes) -> should NOT trigger enqueue_ai
            patch_resp = self.client.patch(
                f"/api/v2/vacancies/{vac_id}",
                json={"notes": "Called HR today"},
                cookies=self.cookies_alice,
            )
            self.assertEqual(patch_resp.status_code, 200)
            self.assertEqual(mock_enqueue_ai.call_count, 2)

        # 2. User Bob has NO approved CV -> should NOT trigger enqueue_ai even if description provided
        with patch("backend.main.queue_manager.enqueue_ai", new_callable=AsyncMock) as mock_enqueue_ai_bob:
            bob_create_resp = self.client.post(
                "/api/v2/vacancies",
                json={
                    "title": "Go Developer",
                    "company": "Golang Corp",
                    "url": "https://example.com/job/auto-2",
                    "description": "Go microservices experience required.",
                },
                cookies=self.cookies_bob,
            )
            self.assertEqual(bob_create_resp.status_code, 200)
            mock_enqueue_ai_bob.assert_not_called()

    def test_save_approved_cv_enqueues_scoring_tasks_for_all_vacancies(self):
        """Saving approved CV enqueues CV scoring tasks ONLY for vacancies in 'Еще не написал'."""
        v_not_contacted = self.client.post(
            "/api/v2/vacancies",
            json={
                "title": "Engineer Not Contacted",
                "company": "Acme",
                "url": "https://example.com/job/cv-queue-0",
                "description": "Python FastAPI developer",
                "status": "Еще не написал",
            },
            cookies=self.cookies_alice,
        ).json()
        self.client.post(
            "/api/v2/vacancies",
            json={
                "title": "Engineer Contacted",
                "company": "Acme",
                "url": "https://example.com/job/cv-queue-1",
                "description": "Python FastAPI developer",
                "status": "Написал",
            },
            cookies=self.cookies_alice,
        )
        self.client.post(
            "/api/v2/vacancies",
            json={
                "title": "Engineer Rejected",
                "company": "Acme",
                "url": "https://example.com/job/cv-queue-2",
                "description": "Python FastAPI developer",
                "status": "Отказ",
            },
            cookies=self.cookies_alice,
        )

        with patch("backend.main.queue_manager.enqueue_cv_scoring", new_callable=AsyncMock) as mock_enqueue:
            save_res = self.client.post(
                "/api/v2/cv",
                json={"content": "Senior Python Engineer", "revision": 3},
                cookies=self.cookies_alice,
            )
            self.assertEqual(save_res.status_code, 200)
            mock_enqueue.assert_awaited_once()
            enqueued_vacancies, user_id = mock_enqueue.call_args.args
            self.assertEqual(len(enqueued_vacancies), 1)
            self.assertEqual(enqueued_vacancies[0].id, v_not_contacted["id"])
            self.assertEqual(user_id, save_res.json()["user_id"])

    def test_reparse_all_and_selected_vacancies_scoring_rules(self):
        """
        - Reparse all (without selected ids) skips 'Отказ' and sets force_cv_scoring=False.
        - Reparse with selected ids updates only selected cards (even in 'Отказ'/'Написал') and sets force_cv_scoring=True.
        """
        v1 = self.client.post(
            "/api/v2/vacancies",
            json={"title": "V1", "company": "C1", "url": "https://example.com/job/rep-1", "status": "Еще не написал"},
            cookies=self.cookies_alice,
        ).json()
        v2 = self.client.post(
            "/api/v2/vacancies",
            json={"title": "V2", "company": "C2", "url": "https://example.com/job/rep-2", "status": "Написал"},
            cookies=self.cookies_alice,
        ).json()
        v3_rej = self.client.post(
            "/api/v2/vacancies",
            json={"title": "V3", "company": "C3", "url": "https://example.com/job/rep-3", "status": "Отказ"},
            cookies=self.cookies_alice,
        ).json()

        with patch("backend.main.queue_manager.enqueue", new_callable=AsyncMock) as mock_enqueue:
            mock_enqueue.return_value = ("batch1", [])
            # 1. Refresh without selection -> skips 'Отказ', force_cv_scoring=False
            res_all = self.client.post("/api/v2/vacancies/reparse_all", cookies=self.cookies_alice)
            self.assertEqual(res_all.status_code, 200)
            mock_enqueue.assert_awaited_once()
            kwargs_all = mock_enqueue.call_args.kwargs
            self.assertEqual(set(kwargs_all["vacancy_ids"]), {v1["id"], v2["id"]})
            self.assertFalse(kwargs_all["force_cv_scoring"])

            mock_enqueue.reset_mock()
            # 2. Refresh WITH selected checkboxes (including 'Написал' and 'Отказ') -> only selected, force_cv_scoring=True
            res_sel = self.client.post(
                "/api/v2/vacancies/reparse_all",
                json={"ids": [v2["id"], v3_rej["id"]]},
                cookies=self.cookies_alice,
            )
            self.assertEqual(res_sel.status_code, 200)
            mock_enqueue.assert_awaited_once()
            kwargs_sel = mock_enqueue.call_args.kwargs
            self.assertEqual(set(kwargs_sel["vacancy_ids"]), {v2["id"], v3_rej["id"]})
            self.assertTrue(kwargs_sel["force_cv_scoring"])

if __name__ == "__main__":
    unittest.main()
