import sys
from backend.location_parser import parse_location
from backend.database import SessionLocal, ensure_db_schema
from backend.models import Vacancy
from backend.main import app, backfill_missing_locations
from fastapi.testclient import TestClient

def test_location_parser():
    test_cases = [
        ("Barcelona, Catalonia, Spain", ("Barcelona", "Spain")),
        ("Greater Madrid Metropolitan Area", ("Madrid", "Spain")),
        ("Greater Barcelona Metropolitan Area", ("Barcelona", "Spain")),
        ("Spain", ("", "Spain")),
        ("Berlin, Germany", ("Berlin", "Germany")),
        ("London, England, United Kingdom", ("London", "United Kingdom")),
        ("Austin, TX", ("Austin", "United States")),
        ("San Francisco Bay Area", ("San Francisco", "United States")),
        ("Warsaw, Mazowieckie, Poland (Hybrid)", ("Warsaw", "Poland")),
        ("Remote", ("", "")),
        ("Paris Area", ("Paris", "France")),
        ("Limassol, Cyprus", ("Limassol", "Cyprus")),
        ("Amsterdam, North Holland, Netherlands", ("Amsterdam", "Netherlands")),
    ]

    print("\n--- Running location_parser unit tests ---")
    all_passed = True
    for raw, expected in test_cases:
        res = parse_location(raw)
        status = "✅ PASS" if res == expected else f"❌ FAIL (got {res}, expected {expected})"
        print(f"'{raw}' -> {res} {status}")
        if res != expected:
            all_passed = False

    assert all_passed, "Some location_parser test cases failed!"
    print("All location_parser unit tests PASSED successfully!\n")


def test_db_backfill_and_api():
    print("--- Running DB Schema check & Backfill ---")
    ensure_db_schema()
    backfill_missing_locations()

    db = SessionLocal()
    try:
        vacancies = db.query(Vacancy).all()
        print(f"Total vacancies in DB: {len(vacancies)}")
        for v in vacancies:
            print(f"ID {v.id}: Location='{v.location}' | City='{v.city}' | Country='{v.country}'")
    finally:
        db.close()

    print("\n--- Testing API endpoints ---")
    client = TestClient(app)
    login_res = client.post("/api/auth/dev-login", json={"email": "location_test@local.user"})
    token = login_res.json()["token"]
    client = TestClient(app, cookies={"access_token": token})

    # Test /api/countries
    countries_res = client.get("/api/countries")
    assert countries_res.status_code == 200
    countries = countries_res.json()
    print("Distinct countries:", countries)

    # Test /api/cities
    cities_res = client.get("/api/cities")
    assert cities_res.status_code == 200
    cities = cities_res.json()
    print("Distinct cities:", cities)

    # Test /api/vacancies?country=Spain
    vac_res = client.get("/api/vacancies?country=Spain")
    assert vac_res.status_code == 200
    spain_vacs = vac_res.json()
    print(f"Vacancies in Spain: {len(spain_vacs)}")

    # Test /api/vacancies?city=Barcelona
    barca_res = client.get("/api/vacancies?city=Barcelona")
    assert barca_res.status_code == 200
    barca_vacs = barca_res.json()
    print(f"Vacancies in Barcelona: {len(barca_vacs)}")

    print("\n✅ ALL TESTS PASSED!")


if __name__ == "__main__":
    test_location_parser()
    test_db_backfill_and_api()
