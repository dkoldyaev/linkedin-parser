from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import Vacancy, User

def test_reparse_all_includes_upwork():
    with TestClient(app) as client:
        login_res = client.post("/api/auth/dev-login", json={"email": "reparse_test@local.user"})
        assert login_res.status_code == 200
        token = login_res.json()["token"]
        client.cookies.set("access_token", token)

        # Get user id
        with SessionLocal() as db:
            user = db.query(User).filter(User.email == "reparse_test@local.user").first()
            assert user is not None

            # Clean existing vacancies for test user
            db.query(Vacancy).filter(Vacancy.user_id == user.id).delete()
            db.commit()

            # Create two vacancies: one upwork, one other
            v_upwork = Vacancy(
                user_id=user.id,
                url="https://www.upwork.com/jobs/~0123456789abcdef",
                title="Upwork Test Job",
                company="Upwork",
                status="Еще не написан"
            )
            v_linkedin = Vacancy(
                user_id=user.id,
                url="https://www.linkedin.com/jobs/view/12345678",
                title="LinkedIn Test Job",
                company="LinkedIn",
                status="Еще не написан"
            )
            db.add(v_upwork)
            db.add(v_linkedin)
            db.commit()

        # Call reparse_all
        res = client.post("/api/vacancies/reparse_all")
        assert res.status_code == 200, res.text
        data = res.json()
        print("reparse_all response:", data)
        assert data["status"] == "queued"
        # Both Upwork and LinkedIn should be enqueued (total = 2)
        assert data["enqueued"] == 2, f"Expected 2 enqueued vacancies, got {data['enqueued']}"
        print("SUCCESS: Upwork is included in reparse_all!")

if __name__ == "__main__":
    test_reparse_all_includes_upwork()
