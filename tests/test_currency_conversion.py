import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import Vacancy, ExchangeRate


def test_exchange_rates_endpoint():
    # Insert exchange rate
    db = SessionLocal()
    rate = db.query(ExchangeRate).filter_by(source_currency="USD", target_currency="EUR").first()
    if not rate:
        rate = ExchangeRate(source_currency="USD", target_currency="EUR", rate=0.89)
        db.add(rate)
    else:
        rate.rate = 0.89
    db.commit()

    with TestClient(app) as client:
        res = client.get("/api/exchange-rates")
        assert res.status_code == 200
        data = res.json()
        assert "rates" in data
        assert "USD_EUR" in data["rates"]
        assert data["rates"]["USD_EUR"] == 0.89


def test_vacancies_backend_currency_conversion():
    with TestClient(app) as client:
        login_res = client.post("/api/auth/dev-login", json={"email": "currency_user@local.user"})
        assert login_res.status_code == 200

        # Ensure rate USD -> EUR is 0.9 in DB
        db = SessionLocal()
        rate = db.query(ExchangeRate).filter_by(source_currency="USD", target_currency="EUR").first()
        if not rate:
            rate = ExchangeRate(source_currency="USD", target_currency="EUR", rate=0.9)
            db.add(rate)
        else:
            rate.rate = 0.9
        db.commit()

        # Create a vacancy with USD salary
        v_res = client.post("/api/vacancies", json={
            "url": "https://example.com/test-currency-job",
            "title": "Software Engineer USD",
            "company": "Tech Corp",
            "salary_min": 1000,
            "salary_max": 2000,
            "salary_currency": "USD",
            "salary_period": "month",
        })
        assert v_res.status_code == 200
        v_id = v_res.json()["id"]

        # 1. Without target currency setting ("не конвертировать")
        client.post("/api/settings", json={"salary_target_currency": ""})
        res = client.get("/api/vacancies")
        assert res.status_code == 200
        v_list = [v for v in res.json() if v["id"] == v_id]
        assert len(v_list) == 1
        assert v_list[0]["salary_min"] == 1000
        assert v_list[0]["salary_max"] == 2000
        assert v_list[0]["salary_currency"] == "USD"

        # 2. With target currency = EUR
        client.post("/api/settings", json={"salary_target_currency": "EUR"})
        res = client.get("/api/vacancies")
        assert res.status_code == 200
        v_list = [v for v in res.json() if v["id"] == v_id]
        assert len(v_list) == 1
        assert v_list[0]["salary_min"] == 900.0  # 1000 * 0.9
        assert v_list[0]["salary_max"] == 1800.0  # 2000 * 0.9
        assert v_list[0]["salary_currency"] == "€"
