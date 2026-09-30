#!/usr/bin/env python3
"""
E2E Verification of Extension Parse and Add flow:
1. Verifies Docker Compose is up & running.
2. Emulates browser extension: sends example HTML pages to /api/extension/parse_and_add.
3. Verifies vacancy tasks are properly added to /api/queue/tasks with proper status in /api/queue/status.
4. Verifies vacancies appear in /api/vacancies and are accessible via /api/vacancies/{vacancy_id}.
5. Verifies all parsed fields match the expected table data from results/parsed_examples.json.
"""

import sys
import os
import json
import time
import httpx

BASE_URL = os.getenv("APP_URL", "http://localhost:8000")
DEV_LOGIN_URL = f"{BASE_URL}/api/auth/dev-login"
PARSE_AND_ADD_URL = f"{BASE_URL}/api/extension/parse_and_add"
QUEUE_TASKS_URL = f"{BASE_URL}/api/queue/tasks"
QUEUE_STATUS_URL = f"{BASE_URL}/api/queue/status"
VACANCIES_URL = f"{BASE_URL}/api/vacancies"

EXAMPLES_DIR = os.path.join(os.path.dirname(__file__), "../examples")
PARSED_JSON_PATH = os.path.join(os.path.dirname(__file__), "../results/parsed_examples.json")

DEFAULT_TEST_EXAMPLES = [
    "career.habr.com-2.html",
    "avito.ru-3.html",
    "superjob.ru.html",
]

def verify_single_example(client, example_file, all_parsed):
    print("\n" + "=" * 70)
    print(f"TESTING EXAMPLE: {example_file}")
    print("=" * 70)

    target_data = next((item for item in all_parsed if item.get("_file") == example_file), None)
    if not target_data:
        print(f"[FAIL] Example {example_file} not found in {PARSED_JSON_PATH}")
        return False

    print(f"Target URL: {target_data['url']}")
    print(f"Expected Title: {target_data.get('title')}")
    print(f"Expected Company: {target_data.get('company')}")
    print(f"Expected Source: {target_data.get('source')}")
    print(f"Expected Workplace: {target_data.get('workplace_type')}")
    print(f"Expected Salary: {target_data.get('salary_min')} - {target_data.get('salary_max')} {target_data.get('salary_currency')}/{target_data.get('salary_period')}")
    print(f"Expected Closed: {target_data.get('is_closed')}")

    # Read raw HTML
    html_file_path = os.path.join(EXAMPLES_DIR, example_file)
    with open(html_file_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Step 2: POST /api/extension/parse_and_add
    print(f"\n--- Step 2: POST /api/extension/parse_and_add ---")
    t0 = time.time()
    add_resp = client.post(
        PARSE_AND_ADD_URL,
        json={
            "url": target_data["url"],
            "html": html_content
        }
    )
    elapsed = time.time() - t0
    if add_resp.status_code != 200:
        print(f"[FAIL] parse_and_add failed with status {add_resp.status_code}: {add_resp.text}")
        return False

    add_result = add_resp.json()
    print(f"[PASS] Response ({elapsed:.2f}s): {add_result}")
    vacancy_id = add_result.get("vacancy_id")
    task_id = add_result.get("task_id")
    if not vacancy_id or not task_id:
        print(f"[FAIL] Missing vacancy_id or task_id in response: {add_result}")
        return False
    print(f"Created Vacancy ID: {vacancy_id}, Task ID: {task_id}")

    # Step 3: Check queue tasks and status
    print(f"\n--- Step 3: Checking /api/queue/tasks and /api/queue/status ---")
    tasks_resp = client.get(QUEUE_TASKS_URL)
    status_resp = client.get(QUEUE_STATUS_URL)

    if tasks_resp.status_code != 200:
        print(f"[FAIL] /api/queue/tasks returned {tasks_resp.status_code}: {tasks_resp.text}")
        return False
    if status_resp.status_code != 200:
        print(f"[FAIL] /api/queue/status returned {status_resp.status_code}: {status_resp.text}")
        return False

    tasks = tasks_resp.json()
    q_status = status_resp.json()

    print(f"Queue Status: pending={q_status.get('pending')}, processing={q_status.get('processing')}, total_remaining={q_status.get('total_remaining')}")
    
    matching_active = [t for t in tasks if t.get("task_id") == task_id or t.get("vacancy_id") == vacancy_id]
    recent_tasks = q_status.get("recent_tasks", [])
    matching_recent = [t for t in recent_tasks if t.get("task_id") == task_id or t.get("vacancy_id") == vacancy_id]

    if matching_active:
        task_info = matching_active[0]
        print(f"[PASS] Task in active queue: ID={task_info.get('task_id')}, stage={task_info.get('stage')}, status={task_info.get('status')}")
    elif matching_recent:
        task_info = matching_recent[0]
        print(f"[PASS] Task in recent_tasks: ID={task_info.get('task_id')}, stage={task_info.get('stage')}, status={task_info.get('status')}")
    else:
        print(f"[INFO] Task completed fast. Active={len(tasks)}, Recent={len(recent_tasks)}")

    # Step 4: Verify vacancy appears in /api/vacancies and /api/vacancies/{id}
    print(f"\n--- Step 4: Checking /api/vacancies and /api/vacancies/{vacancy_id} ---")
    time.sleep(0.5)
    vacancies_resp = client.get(VACANCIES_URL)
    if vacancies_resp.status_code != 200:
        print(f"[FAIL] /api/vacancies returned {vacancies_resp.status_code}: {vacancies_resp.text}")
        return False

    vacancies = vacancies_resp.json()
    matching_vacancies = [v for v in vacancies if v.get("id") == vacancy_id]
    if not matching_vacancies:
        print(f"[FAIL] Vacancy #{vacancy_id} not found in /api/vacancies!")
        return False
    print(f"[PASS] Vacancy #{vacancy_id} found in /api/vacancies list (user has {len(vacancies)} vacancies)")

    detail_resp = client.get(f"{VACANCIES_URL}/{vacancy_id}")
    if detail_resp.status_code != 200:
        print(f"[FAIL] /api/vacancies/{vacancy_id} returned {detail_resp.status_code}: {detail_resp.text}")
        return False

    vacancy = detail_resp.json()
    print(f"[PASS] Vacancy #{vacancy_id} fetched successfully!")

    # Step 5: Verify all fields from table are present and match!
    print(f"\n--- Step 5: Verifying all fields match parsed table data ---")
    fields_to_check = [
        ("title", target_data.get("title")),
        ("company", target_data.get("company")),
        ("source", target_data.get("source")),
        ("company_url", target_data.get("company_url")),
        ("location", target_data.get("location")),
        ("city", target_data.get("city")),
        ("country", target_data.get("country")),
        ("workplace_type", target_data.get("workplace_type")),
        ("salary_min", target_data.get("salary_min")),
        ("salary_max", target_data.get("salary_max")),
        ("salary_currency", target_data.get("salary_currency")),
        ("salary_period", target_data.get("salary_period")),
        ("is_closed", target_data.get("is_closed")),
        ("job_id", target_data.get("job_id")),
    ]

    all_matched = True
    for field_name, expected_val in fields_to_check:
        actual_val = vacancy.get(field_name)
        status_sym = "MATCH" if actual_val == expected_val else "DIFF"
        if status_sym == "DIFF":
            if isinstance(expected_val, (int, float)) and isinstance(actual_val, (int, float)):
                if abs(expected_val - actual_val) < 0.01:
                    status_sym = "MATCH"
        
        print(f"  [{status_sym}] {field_name:16}: actual={repr(actual_val)} | expected={repr(expected_val)}")
        if status_sym == "DIFF":
            all_matched = False

    expected_desc = target_data.get("description")
    actual_desc = vacancy.get("description")
    if expected_desc and actual_desc:
        desc_match = expected_desc[:40] == actual_desc[:40]
        print(f"  [{'MATCH' if desc_match else 'DIFF'}] {'description':16}: length {len(actual_desc)} chars (starts with: {repr(actual_desc[:40])})")
        if not desc_match:
            all_matched = False
    else:
        print(f"  [MATCH] description: both null/empty")

    if not all_matched:
        print(f"[FAIL] Some fields did not match expected values for {example_file}!")
        return False

    print(f"\n[SUCCESS] Example {example_file} verified completely!")
    return True


def main():
    print("=" * 70)
    print("STARTING E2E VERIFICATION OF EXTENSION PARSE_AND_ADD FLOW")
    print("=" * 70)

    with open(PARSED_JSON_PATH, "r", encoding="utf-8") as f:
        all_parsed = json.load(f)

    test_examples = sys.argv[1:] if len(sys.argv) > 1 else DEFAULT_TEST_EXAMPLES

    client = httpx.Client(timeout=30.0)

    # Step 1: Healthcheck
    print("\n--- Step 1: Check Docker Container API Health ---")
    try:
        health_resp = client.get(f"{BASE_URL}/api/health")
        if health_resp.status_code != 200:
            print(f"[FAIL] /api/health returned {health_resp.status_code}")
            sys.exit(1)
        print(f"[PASS] /api/health returned 200 OK: {health_resp.json()}")
    except Exception as e:
        print(f"[FAIL] Could not connect to {BASE_URL}: {e}")
        sys.exit(1)

    # Authenticate
    print("\n--- Authenticating as Test Extension User ---")
    login_resp = client.post(
        DEV_LOGIN_URL,
        json={"email": "e2e_extension_user@example.com", "name": "Extension User"}
    )
    if login_resp.status_code != 200:
        print(f"[FAIL] Dev login failed: {login_resp.text}")
        sys.exit(1)

    auth_data = login_resp.json()
    token = auth_data["token"]
    user_id = auth_data["user"]["id"]
    client.headers.update({
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    })
    print(f"[PASS] Authenticated as user #{user_id} ({auth_data['user']['email']})")

    # Run tests on all specified examples
    successes = 0
    for ex in test_examples:
        if verify_single_example(client, ex, all_parsed):
            successes += 1
        else:
            print(f"[FAIL] Verification failed for {ex}")
            sys.exit(1)

    print("\n" + "=" * 70)
    print(f"ALL {successes}/{len(test_examples)} EXAMPLES VERIFIED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    main()
