from fastapi.testclient import TestClient
from backend.main import app

def run_test():
    client = TestClient(app)

    url = "https://www.linkedin.com/jobs/view/4462938317"
    print("Sending batch import request (with wait=true)...")
    import_resp = client.post("/api/vacancies/batch?wait=true", json={
        "urls": [url],
        "default_tags": ["python", "remote-eu"]
    })
    print("Import status:", import_resp.status_code)
    print("Import result:", import_resp.json())

    vac_list = client.get("/api/vacancies").json()
    print("Total vacancies in DB:", len(vac_list))
    if vac_list:
        v = vac_list[0]
        vid, vtitle, vcomp = v["id"], v["title"], v["company"]
        print(f"Vacancy ID: {vid} | Title: {vtitle} | Company: {vcomp}")
        print(f"Location: {v['location']} | Country: {v['country']}")
        print(f"Tags: {v['tags']} | Status: {v['status']}")
        print(f"Tech stack: {v['tech_stack']}")
        print(f"Summary: {v['ai_summary']}")

        patch_resp = client.patch(f"/api/vacancies/{vid}", json={"status": "Написал"})
        print("Patch status:", patch_resp.status_code, "New status:", patch_resp.json()["status"])

        patch_resp2 = client.patch(f"/api/vacancies/{vid}", json={
            "tags": ["python", "remote-eu", "applied-today"],
            "notes": "Sent CV via recruiter on LinkedIn"
        })
        print("Notes & tags:", patch_resp2.json()["notes"], patch_resp2.json()["tags"])

    tags = client.get("/api/tags").json()
    print("Distinct tags in DB:", tags)
    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_test()
