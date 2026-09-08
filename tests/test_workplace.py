import sys
from bs4 import BeautifulSoup
from backend.scraper import normalize_workplace_type, extract_workplace_type_from_soup
from backend.schemas import VacancyBase, VacancyUpdate, VacancyResponse
from backend.database import SessionLocal, ensure_db_schema
from backend.models import Vacancy
from backend.main import app, backfill_missing_workplace_types
from fastapi.testclient import TestClient

def test_normalize_workplace_type():
    print("\n--- Testing normalize_workplace_type ---")
    test_cases = [
        ("Remote", "remote"),
        ("100% remote", "remote"),
        ("Удаленно", "remote"),
        ("Удаленка", "remote"),
        ("WFH", "remote"),
        ("Hybrid", "hybrid"),
        ("Гибрид", "hybrid"),
        ("London, UK (Hybrid)", "hybrid"),
        ("On-site", "on-site"),
        ("Onsite", "on-site"),
        ("В офисе", "on-site"),
        ("Full-time", None),
        ("", None),
        (None, None),
    ]

    for val, expected in test_cases:
        res = normalize_workplace_type(val)
        assert res == expected, f"Failed for '{val}': got {res}, expected {expected}"
        print(f"'{val}' -> {res} ✅")

def test_soup_extraction():
    print("\n--- Testing extract_workplace_type_from_soup ---")
    # Test criteria
    soup = BeautifulSoup("<html><body></body></html>", "html.parser")
    res = extract_workplace_type_from_soup(soup, "Berlin, Germany", {"Workplace type": "Hybrid"})
    assert res == "hybrid", f"Expected hybrid, got {res}"
    print("Criteria test passed ✅")

    # Test location string
    res = extract_workplace_type_from_soup(soup, "Warsaw, Poland (Remote)", {})
    assert res == "remote", f"Expected remote, got {res}"
    print("Location string test passed ✅")

    # Test topcard flavor
    html = '<div class="topcard__flavor topcard__flavor--bullet">On-site</div>'
    soup_flavor = BeautifulSoup(html, "html.parser")
    res = extract_workplace_type_from_soup(soup_flavor, "Madrid, Spain", {})
    assert res == "on-site", f"Expected on-site, got {res}"
    print("Topcard flavor test passed ✅")

def test_api_filtering():
    print("\n--- Testing API filtering by workplace_type ---")
    ensure_db_schema()
    backfill_missing_workplace_types()

    client = TestClient(app)
    res = client.get("/api/vacancies")
    assert res.status_code == 200
    all_vacs = res.json()
    print(f"Total vacancies: {len(all_vacs)}")

    for wt in ["remote", "hybrid", "on-site"]:
        res = client.get(f"/api/vacancies?workplace_type={wt}")
        assert res.status_code == 200
        filtered = res.json()
        print(f"Vacancies for workplace_type={wt}: {len(filtered)}")
        for v in filtered:
            assert v.get("workplace_type") == wt, f"Vacancy {v['id']} has wrong workplace_type {v.get('workplace_type')}"

    print("API filtering test passed ✅")

def test_crud_workplace():
    print("\n--- Testing CRUD with workplace_type ---")
    client = TestClient(app)
    # Create test vacancy
    create_payload = {
        "title": "Remote Python Engineer",
        "company": "Test Workplace Corp",
        "url": "https://linkedin.com/jobs/view/test-workplace-123",
        "workplace_type": "remote",
        "tags": ["test-workplace"]
    }
    create_res = client.post("/api/vacancies", json=create_payload)
    assert create_res.status_code == 200, f"Create failed: {create_res.text}"
    created = create_res.json()
    v_id = created["id"]
    assert created.get("workplace_type") == "remote", f"Expected 'remote', got {created.get('workplace_type')}"
    print(f"Created vacancy #{v_id} with workplace_type='remote' ✅")

    try:
        # Check filter remote
        res_remote = client.get("/api/vacancies?workplace_type=remote")
        assert res_remote.status_code == 200
        found = [v for v in res_remote.json() if v["id"] == v_id]
        assert len(found) == 1, f"Expected 1 vacancy in remote filter, got {len(found)}"

        # Check filter hybrid (should not include this vacancy)
        res_hybrid = client.get("/api/vacancies?workplace_type=hybrid")
        assert res_hybrid.status_code == 200
        found_h = [v for v in res_hybrid.json() if v["id"] == v_id]
        assert len(found_h) == 0, f"Expected 0 vacancy in hybrid filter, got {len(found_h)}"

        # Patch to hybrid
        patch_res = client.patch(f"/api/vacancies/{v_id}", json={"workplace_type": "hybrid"})
        assert patch_res.status_code == 200
        assert patch_res.json().get("workplace_type") == "hybrid"
        print(f"Updated vacancy #{v_id} to workplace_type='hybrid' ✅")

        # Check filter hybrid again (should now include this vacancy)
        res_hybrid2 = client.get("/api/vacancies?workplace_type=hybrid")
        assert res_hybrid2.status_code == 200
        found_h2 = [v for v in res_hybrid2.json() if v["id"] == v_id]
        assert len(found_h2) == 1, f"Expected 1 vacancy in hybrid filter after update, got {len(found_h2)}"
    finally:
        # Delete test vacancy
        del_res = client.delete(f"/api/vacancies/{v_id}")
        assert del_res.status_code in (200, 204)
        print(f"Deleted test vacancy #{v_id} ✅")

if __name__ == "__main__":
    test_normalize_workplace_type()
    test_soup_extraction()
    test_api_filtering()
    test_crud_workplace()
    print("\n🎉 All workplace type tests passed successfully!")
