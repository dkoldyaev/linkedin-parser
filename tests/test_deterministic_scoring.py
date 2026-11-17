import unittest
import asyncio
from unittest.mock import patch, AsyncMock
import json
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal, Base, engine
from backend.models import User, Vacancy, ApprovedCV, VacancyCVAnalysis
from backend.llm import (
    extract_vacancy_requirements_with_llm,
    parse_cv_qualifications_with_llm,
    match_structured_profiles_with_llm,
    calculate_deterministic_dimensions,
    calculate_compatibility_score,
)
from backend.queue_manager import queue_manager, JobTask


class TestDeterministicScoringAndPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    def setUp(self):
        resp = self.client.post("/api/v2/auth/dev-login", json={"email": "tester_scoring@local.test", "name": "Tester"})
        self.assertEqual(resp.status_code, 200)
        self.cookies = resp.cookies
        self.user_id = resp.json()["user"]["id"]

        with SessionLocal() as db:
            db.query(VacancyCVAnalysis).filter(VacancyCVAnalysis.user_id == self.user_id).delete()
            db.query(Vacancy).filter(Vacancy.user_id == self.user_id).delete()
            db.query(ApprovedCV).filter(ApprovedCV.user_id == self.user_id).delete()
            db.commit()

    def test_deterministic_formula_identical_outputs(self):
        """calculate_compatibility_score must return 100% identical outputs for identical inputs."""
        dim_scores = {
            "requiredTechnicalSkills": 80.0,
            "relevantProfessionalExperience": 75.0,
            "seniorityAlignment": 100.0,
            "optionalTechnicalSkills": 70.0,
            "domainExperience": 60.0,
        }
        res1 = calculate_compatibility_score(dim_scores, critical_gaps_count=0)
        res2 = calculate_compatibility_score(dim_scores, critical_gaps_count=0)
        res3 = calculate_compatibility_score(dim_scores, critical_gaps_count=0)

        self.assertEqual(res1, res2)
        self.assertEqual(res2, res3)
        self.assertAlmostEqual(res1, 78.8, places=1)

    def test_deterministic_dimensions_calculation(self):
        """Verify deterministic calculation of dimensions from structured matching facts."""
        vac_profile = {
            "required_technical_skills": ["Python", "FastAPI", "PostgreSQL"],
            "optional_technical_skills": ["Docker", "Kubernetes"],
            "required_experience_years": 3.0,
            "domain_keywords": ["Fintech"],
        }
        cv_profile = {
            "technical_skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
            "total_experience_years": 4.0,
            "domain_experience": ["Fintech", "Banking"],
        }
        match_data = {
            "matchedRequirements": [
                {"requirement": "Python", "evidence": "5 years Python"},
                {"requirement": "FastAPI", "evidence": "Built FastAPI apps"},
                {"requirement": "PostgreSQL", "evidence": "Optimized Postgres"},
                {"requirement": "Docker", "evidence": "Containerized services"},
            ],
            "missingRequirements": [],
            "seniorityAssessment": {"status": "matched", "comment": "Matches requirements"},
        }
        dims = calculate_deterministic_dimensions(match_data, vac_profile, cv_profile)
        self.assertEqual(dims["requiredTechnicalSkills"], 100.0)
        self.assertEqual(dims["seniorityAlignment"], 100.0)
        self.assertEqual(dims["relevantProfessionalExperience"], 100.0)
        self.assertEqual(dims["domainExperience"], 100.0)

    def test_mock_llm_structured_matching_reproducibility(self):
        """Match structured profiles multiple times via mock provider to verify deterministic scores."""
        vac_profile = {
            "required_technical_skills": ["Python", "FastAPI"],
            "optional_technical_skills": ["Docker"],
            "required_experience_years": 2.0,
            "domain_keywords": ["Backend"],
        }
        cv_profile = {
            "technical_skills": ["Python", "FastAPI", "PostgreSQL"],
            "total_experience_years": 3.0,
            "domain_experience": ["Backend"],
        }
        
        async def run_multiple():
            res1 = await match_structured_profiles_with_llm(vac_profile, cv_profile, provider="mock", language="en")
            res2 = await match_structured_profiles_with_llm(vac_profile, cv_profile, provider="mock", language="en")
            return res1, res2

        res1, res2 = asyncio.run(run_multiple())
        self.assertEqual(res1["overallScore"], res2["overallScore"])
        self.assertEqual(res1["dimensionScores"], res2["dimensionScores"])

    def test_isolated_cv_parsing_and_scoring_task_lifecycle(self):
        """Verify that cv_parsing and cv_scoring run as isolated tasks in the queue manager."""
        with SessionLocal() as db:
            vac = Vacancy(
                user_id=self.user_id,
                title="Python Backend Engineer",
                company="Acme",
                url="https://example.com/test-pipeline-1",
                description="We need Python, FastAPI and Postgres developer.",
                status="Еще не написал",
            )
            db.add(vac)
            approved = ApprovedCV(
                user_id=self.user_id,
                content="Experienced Python developer with FastAPI and PostgreSQL background.",
                revision=1,
            )
            db.add(approved)
            db.commit()
            db.refresh(vac)
            db.refresh(approved)
            vac_id = vac.id

        # 1. Simulate CV parsing task
        cv_task = JobTask(
            task_id="t_cv_parse_1",
            url=f"cv://user/{self.user_id}",
            default_tags=[],
            batch_id="b1",
            status="pending",
            stage="cv_parsing",
            user_id=self.user_id,
        )

        class FakePipeline:
            def __init__(self):
                pass
            def __enter__(self):
                return self
            def __exit__(self, exc_type, exc_val, exc_tb):
                pass
            async def __aenter__(self):
                return self
            async def __aexit__(self, exc_type, exc_val, exc_tb):
                pass
            def set(self, *args, **kwargs):
                return self
            def rpush(self, *args, **kwargs):
                return self
            def sadd(self, *args, **kwargs):
                return self
            def expire(self, *args, **kwargs):
                return self
            def lpush(self, *args, **kwargs):
                return self
            def ltrim(self, *args, **kwargs):
                return self
            def hincrby(self, *args, **kwargs):
                return self
            def srem(self, *args, **kwargs):
                return self
            async def execute(self):
                return []

        mock_redis = AsyncMock()
        mock_redis.pipeline = lambda transaction=True: FakePipeline()

        with patch.object(queue_manager, "redis", new=mock_redis), \
             patch("backend.queue_manager.os.getenv", side_effect=lambda k, d=None: "mock" if k == "LLM_PROVIDER" else d):
            mock_redis.get.return_value = json.dumps(cv_task.to_dict())
            asyncio.run(queue_manager._process_ai_task(cv_task.task_id))

        with SessionLocal() as db:
            updated_cv = db.query(ApprovedCV).filter(ApprovedCV.user_id == self.user_id).first()
            self.assertIsNotNone(updated_cv.parsed_profile)
            self.assertIn("technical_skills", updated_cv.parsed_profile)

        # 2. Simulate CV scoring task
        score_task = JobTask(
            task_id="t_cv_score_1",
            url=f"vacancy://{vac_id}",
            default_tags=[],
            batch_id="b2",
            status="pending",
            stage="cv_scoring",
            vacancy_id=vac_id,
            user_id=self.user_id,
        )

        with patch.object(queue_manager, "redis", new=mock_redis), \
             patch("backend.queue_manager.os.getenv", side_effect=lambda k, d=None: "mock" if k == "LLM_PROVIDER" else d):
            mock_redis.get.return_value = json.dumps(score_task.to_dict())
            asyncio.run(queue_manager._process_ai_task(score_task.task_id))

        with SessionLocal() as db:
            updated_vac = db.query(Vacancy).filter(Vacancy.id == vac_id).first()
            self.assertIsNotNone(updated_vac.match_score)
            self.assertGreater(updated_vac.match_score, 0.0)
            self.assertIsNotNone(updated_vac.extracted_requirements)
