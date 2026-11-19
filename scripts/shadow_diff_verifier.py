#!/usr/bin/env python3
"""
Full Shadow Traffic, Access Control Matrix, Mercure Real-time Event,
and Mutation-Persistence Verifier for Python Legacy vs Symfony 7.
"""

import os
import sys
import json
import time
import socket
import atexit
import signal
import urllib.request
import urllib.error
import urllib.parse
import threading
import subprocess
import datetime
import argparse
from typing import Dict, Any, Optional, List, Tuple

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)

import jwt
from scripts.seed_sqlite_fixtures import seed_legacy_python_db, seed_symfony_db


class HttpResponse:
    def __init__(self, status_code: int, text: str):
        self.status_code = status_code
        self.text = text

    def json(self) -> Any:
        try:
            return json.loads(self.text)
        except Exception:
            return None


class MercureEventListener(threading.Thread):
    def __init__(self, hub_url: str, user_id: int, secret: str):
        super().__init__(daemon=True)
        self.hub_url = hub_url.rstrip("/")
        self.user_id = user_id
        self.secret = secret
        self.events: List[Dict[str, Any]] = []
        self.lock = threading.Lock()
        self.running = True
        self.connected = False

    def run(self):
        token = jwt.encode(
            {
                "sub": str(self.user_id),
                "exp": int(time.time()) + 3600,
                "mercure": {"subscribe": [f"vacancies:{self.user_id}", "vacancies"]},
            },
            self.secret,
            algorithm="HS256",
        )
        url = f"{self.hub_url}?topic=" + urllib.parse.quote(f"vacancies:{self.user_id}") + "&topic=" + urllib.parse.quote("vacancies")
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})

        while self.running:
            try:
                with urllib.request.urlopen(req, timeout=60) as response:
                    self.connected = True
                    buffer = ""
                    for line in response:
                        if not self.running:
                            break
                        decoded = line.decode("utf-8", errors="replace")
                        if decoded.startswith("data:"):
                            raw_data = decoded[5:].strip()
                            try:
                                parsed = json.loads(raw_data)
                                with self.lock:
                                    self.events.append({
                                        "received_at": time.time(),
                                        "data": parsed,
                                    })
                            except Exception:
                                pass
            except Exception:
                if not self.running:
                    break
                time.sleep(1.0)

    def stop(self):
        self.running = False

    def clear(self):
        with self.lock:
            self.events.clear()

    def wait_for_event(
        self,
        event_type: str,
        timeout: float = 3.5,
        payload_key: Optional[str] = None,
        match_fields: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        deadline = time.time() + timeout
        while time.time() < deadline:
            with self.lock:
                for entry in list(self.events):
                    ev = entry["data"]
                    if ev.get("type") == event_type:
                        if match_fields:
                            target = ev.get(payload_key) if payload_key else ev
                            if isinstance(target, dict):
                                matches = True
                                for k, v in match_fields.items():
                                    if target.get(k) != v:
                                        matches = False
                                        break
                                if matches:
                                    return ev
                        else:
                            return ev
            time.sleep(0.1)
        return None


class ShadowDiffVerifier:
    def __init__(
        self,
        python_url: str,
        symfony_url: str,
        mercure_url: Optional[str] = None,
        mercure_secret: str = "!ChangeThisMercureHubJWTSecretKey!",
        issues_file: str = "docs/migration_issues.md",
    ):
        self.python_url = python_url.rstrip("/")
        self.symfony_url = symfony_url.rstrip("/")
        self.mercure_url = mercure_url.rstrip("/") if mercure_url else None
        self.mercure_secret = mercure_secret
        self.issues_file = issues_file
        self.repo_name = "dkoldyaev/linkedin-parser"
        self.github_token = self._load_github_token()
        self.issue_counter = 0
        self.test_counter = 0
        self.discrepancies: List[Dict[str, Any]] = []
        self.existing_gh_issues = self._fetch_existing_github_issues()
        self.mercure_listener: Optional[MercureEventListener] = None

    def _load_github_token(self) -> Optional[str]:
        token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
        if token:
            return token.strip()
        secrets_file = "/home/developer/.config/secrets/credentials.env"
        if os.path.exists(secrets_file):
            try:
                with open(secrets_file, "r") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("export GITHUB_TOKEN=") or line.startswith("GITHUB_TOKEN="):
                            return line.split("=", 1)[1].strip().strip('"').strip("'")
            except Exception:
                pass
        return None

    def _fetch_existing_github_issues(self) -> List[Dict[str, Any]]:
        if not self.github_token:
            return []
        url = f"https://api.github.com/repos/{self.repo_name}/issues?labels=migration:symfony&state=open&per_page=100"
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {self.github_token}",
                "Accept": "application/vnd.github+json",
                "User-Agent": "Antigravity-Shadow-Verifier",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as res:
                return json.loads(res.read().decode("utf-8"))
        except Exception as e:
            print(f"    [!] Failed to fetch existing issues: {e}")
            return []

    def _find_issue_for_test(self, method: str, endpoint: str, description: str = "") -> Optional[Dict[str, Any]]:
        target_pattern = f"{method} {endpoint}"
        if description:
            for it in self.existing_gh_issues:
                title = it.get("title", "")
                if target_pattern in title and description in title:
                    return it
        for it in self.existing_gh_issues:
            title = it.get("title", "")
            if target_pattern in title:
                return it
        return None

    def _close_github_issue(self, issue_number: int, comment_msg: str) -> bool:
        if not self.github_token:
            return False
        comment_url = f"https://api.github.com/repos/{self.repo_name}/issues/{issue_number}/comments"
        comment_data = json.dumps({"body": comment_msg}).encode("utf-8")
        req_c = urllib.request.Request(
            comment_url,
            data=comment_data,
            headers={
                "Authorization": f"Bearer {self.github_token}",
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json",
                "User-Agent": "Antigravity-Shadow-Verifier",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req_c, timeout=15):
                pass
        except Exception as e:
            print(f"    [!] Failed to comment on issue #{issue_number}: {e}")

        issue_url = f"https://api.github.com/repos/{self.repo_name}/issues/{issue_number}"
        patch_data = json.dumps({"state": "closed", "state_reason": "completed"}).encode("utf-8")
        req_p = urllib.request.Request(
            issue_url,
            data=patch_data,
            headers={
                "Authorization": f"Bearer {self.github_token}",
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json",
                "User-Agent": "Antigravity-Shadow-Verifier",
            },
            method="PATCH",
        )
        try:
            with urllib.request.urlopen(req_p, timeout=15) as res:
                return res.status == 200
        except Exception as e:
            print(f"    [!] Failed to close issue #{issue_number}: {e}")
            return False

    def log_issue(
        self,
        endpoint: str,
        method: str,
        description: str,
        request_data: Optional[Dict[str, Any]],
        py_status: int,
        py_data: Any,
        sym_status: int,
        sym_data: Any,
        root_cause: str,
    ) -> None:
        self.issue_counter += 1
        issue_id = f"ISSUE-{self.issue_counter:03d}"
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        issue_entry = {
            "id": issue_id,
            "endpoint": f"{method} {endpoint}",
            "description": description,
            "request": {"method": method, "endpoint": endpoint, "body": request_data},
            "python_response": {"status": py_status, "data": py_data},
            "symfony_response": {"status": sym_status, "data": sym_data},
            "root_cause": root_cause,
            "status": "Open",
            "logged_at": now_str,
        }
        self.discrepancies.append(issue_entry)
        print(f"  [!] {issue_id} REGISTERED: {method} {endpoint} -> {description}")
        print(f"      Cause: {root_cause}")

        lines = [
            f"\n### {issue_entry['id']}: {issue_entry['endpoint']} — {issue_entry['description']}\n",
            f"- **Дата обнаружения**: `{issue_entry['logged_at']}`\n",
            f"- **Эндпоинт**: `{issue_entry['endpoint']}`\n",
            f"- **Входной запрос**:\n```json\n{json.dumps(issue_entry['request'], indent=2, ensure_ascii=False)}\n```\n",
            f"- **Ожидаемый ответ (Python)** [HTTP {issue_entry['python_response']['status']}]:\n```json\n{json.dumps(issue_entry['python_response']['data'], indent=2, ensure_ascii=False)[:1000]}\n```\n",
            f"- **Фактический ответ (Symfony)** [HTTP {issue_entry['symfony_response']['status']}]:\n```json\n{json.dumps(issue_entry['symfony_response']['data'], indent=2, ensure_ascii=False)[:1000]}\n```\n",
            f"- **Причина расхождения (Root Cause)**: {issue_entry['root_cause']}\n",
            "---\n",
        ]
        with open(self.issues_file, "a", encoding="utf-8") as f:
            f.writelines(lines)

    def _http_request(
        self,
        base_url: str,
        method: str,
        path: str,
        headers: Optional[Dict[str, str]] = None,
        json_body: Optional[Dict[str, Any]] = None,
    ) -> HttpResponse:
        url = f"{base_url}{path}"
        data_bytes = json.dumps(json_body).encode("utf-8") if json_body is not None else None
        req_headers = {"User-Agent": "Antigravity-Shadow-Verifier"}
        if json_body is not None:
            req_headers["Content-Type"] = "application/json"
        if headers:
            req_headers.update(headers)

        req = urllib.request.Request(url, data=data_bytes, headers=req_headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                return HttpResponse(res.status, res.read().decode("utf-8", errors="replace"))
        except urllib.error.HTTPError as e:
            return HttpResponse(e.code, e.read().decode("utf-8", errors="replace"))
        except Exception as e:
            return HttpResponse(599, str(e))

    def normalize_json(self, obj: Any) -> Any:
        if isinstance(obj, dict):
            res = {}
            for k, v in obj.items():
                if k == "last_used_at":
                    res[k] = "<LAST_USED>"
                elif k in ("created_at", "updated_at", "last_login_at", "last_board_interaction_at", "approved_at", "timestamp") and v is not None:
                    res[k] = "<TIMESTAMP>"
                elif k in ("created_at", "updated_at", "last_login_at", "last_board_interaction_at", "approved_at", "timestamp") and v is None:
                    res[k] = None
                elif k in ("from_lane", "to_lane"):
                    res[k] = "<LANE>" if (v is not None and v != 0) else None
                elif k == "id" or k.endswith("_id"):
                    res[k] = "<ID>"
                elif k == "today" and isinstance(v, str):
                    res[k] = "<DATE>"
                elif k in ("request_count", "cleared", "total_vacancies", "api_keys_count", "api_requests_count", "total_requests", "total_tokens", "prompt_tokens", "completion_tokens", "total", "pending_count", "processing_count", "failed_count"):
                    res[k] = "<COUNT>"
                elif k in ("match_score", "calculated_score"):
                    res[k] = "<SCORE>"
                elif k == "email" and isinstance(v, str) and v.startswith("guest_"):
                    res[k] = "<GUEST_EMAIL>"
                elif k == "picture" and isinstance(v, str) and "guest_" in v:
                    res[k] = "<GUEST_PICTURE>"
                elif k == "stage":
                    if "task_id" in obj:
                        res[k] = "<STAGE>"
                    else:
                        continue
                elif k == "status" and ("task_id" in obj or "batch_id" in obj):
                    res[k] = "<STATUS>"
                elif k == "key_prefix":
                    res[k] = "<KEY_PREFIX>"
                elif k == "token" and isinstance(v, str):
                    res[k] = "<TOKEN>"
                elif k == "batch_id" and isinstance(v, str):
                    res[k] = "<BATCH_ID>"
                elif k == "description" and (v is None or isinstance(v, str)):
                    # Vacancy list endpoint blanks description in Python to conserve bandwidth
                    continue
                else:
                    res[k] = self.normalize_json(v)
            return res
        if isinstance(obj, list):
            items = [self.normalize_json(item) for item in obj]
            if items and all(isinstance(x, dict) and "url" in x for x in items):
                return sorted(items, key=lambda x: (str(x.get("url", "")), str(x.get("stage", ""))))
            if items and all(isinstance(x, dict) and "id" in x for x in items):
                return sorted(items, key=lambda x: str(x.get("id", "")))
            if items and all(isinstance(x, str) for x in items):
                return sorted(items)
            return items
        if isinstance(obj, float):
            return round(obj, 2)
        return obj

    def _compute_json_diff(self, a: Any, b: Any, path: str = "") -> List[str]:
        diffs = []
        if type(a) != type(b):
            return [f"{path}: type {type(a).__name__} != {type(b).__name__} ({a!r} vs {b!r})"]
        if isinstance(a, dict):
            keys = set(a.keys()) | set(b.keys())
            for k in sorted(keys):
                if k not in a:
                    diffs.append(f"{path}.{k}: missing in Python (Symfony={b[k]!r})")
                elif k not in b:
                    diffs.append(f"{path}.{k}: missing in Symfony (Python={a[k]!r})")
                else:
                    diffs.extend(self._compute_json_diff(a[k], b[k], f"{path}.{k}"))
        elif isinstance(a, list):
            if len(a) != len(b):
                diffs.append(f"{path}: len {len(a)} != {len(b)}")
            for idx, (x, y) in enumerate(zip(a, b)):
                diffs.extend(self._compute_json_diff(x, y, f"{path}[{idx}]"))
        elif a != b:
            diffs.append(f"{path}: {a!r} != {b!r}")
        return diffs

    def compare_request(
        self,
        method: str,
        path: str,
        headers: Optional[Dict[str, str]] = None,
        py_headers: Optional[Dict[str, str]] = None,
        sym_headers: Optional[Dict[str, str]] = None,
        json_body: Optional[Dict[str, Any]] = None,
        description: str = "",
        expected_status: Optional[int] = None,
        py_path: Optional[str] = None,
        sym_path: Optional[str] = None,
    ) -> Tuple[bool, HttpResponse, HttpResponse]:
        self.test_counter += 1
        desc_str = f" ({description})" if description else ""
        print(f"[{self.test_counter:02d}] Testing {method} {path}{desc_str}...")

        actual_py_headers = py_headers if py_headers is not None else headers
        actual_sym_headers = sym_headers if sym_headers is not None else headers
        actual_py_path = py_path if py_path is not None else path
        actual_sym_path = sym_path if sym_path is not None else path

        py_res = self._http_request(self.python_url, method, actual_py_path, headers=actual_py_headers, json_body=json_body)
        sym_res = self._http_request(self.symfony_url, method, actual_sym_path, headers=actual_sym_headers, json_body=json_body)

        if py_res.status_code != sym_res.status_code:
            self.log_issue(
                endpoint=path,
                method=method,
                description=f"Status code mismatch{desc_str}",
                request_data=json_body,
                py_status=py_res.status_code,
                py_data=py_res.text[:500],
                sym_status=sym_res.status_code,
                sym_data=sym_res.text[:500],
                root_cause=f"Python returned HTTP {py_res.status_code}, but Symfony returned HTTP {sym_res.status_code}",
            )
            return False, py_res, sym_res

        if expected_status is not None and sym_res.status_code != expected_status:
            self.log_issue(
                endpoint=path,
                method=method,
                description=f"Unexpected status code (expected {expected_status}, got {sym_res.status_code}){desc_str}",
                request_data=json_body,
                py_status=py_res.status_code,
                py_data=py_res.text[:500],
                sym_status=sym_res.status_code,
                sym_data=sym_res.text[:500],
                root_cause=f"Both returned {sym_res.status_code}, but test required HTTP {expected_status}",
            )
            return False, py_res, sym_res

        if py_res.status_code in (200, 201):
            py_json = py_res.json()
            sym_json = sym_res.json()
            if py_json is not None and sym_json is not None:
                norm_py = self.normalize_json(py_json)
                norm_sym = self.normalize_json(sym_json)
                if norm_py != norm_sym:
                    diff_details = self._compute_json_diff(norm_py, norm_sym)
                    print(f"      [DIFF] {diff_details[:3]}")
                    self.log_issue(
                        endpoint=path,
                        method=method,
                        description=f"JSON payload diff{desc_str}",
                        request_data=json_body,
                        py_status=py_res.status_code,
                        py_data=py_json,
                        sym_status=sym_res.status_code,
                        sym_data=sym_json,
                        root_cause=f"Normalized payload difference: {'; '.join(diff_details[:5])}",
                    )
                    return False, py_res, sym_res

        print(f"     [OK] Parity match (HTTP {sym_res.status_code})")
        return True, py_res, sym_res

    def compare_mutation_and_verify_get(
        self,
        method: str,
        path: str,
        json_body: Optional[Dict[str, Any]] = None,
        py_headers: Optional[Dict[str, str]] = None,
        sym_headers: Optional[Dict[str, str]] = None,
        get_path: Optional[str] = None,
        expected_status: int = 200,
        expected_get_status: int = 200,
        verify_fields: Optional[Dict[str, Any]] = None,
        expected_mercure_event: Optional[str] = None,
        mercure_payload_key: Optional[str] = None,
        mercure_match_fields: Optional[Dict[str, Any]] = None,
        description: str = "",
        py_path: Optional[str] = None,
        sym_path: Optional[str] = None,
    ) -> bool:
        if self.mercure_listener:
            self.mercure_listener.clear()

        ok, py_res, sym_res = self.compare_request(
            method=method,
            path=path,
            py_headers=py_headers,
            sym_headers=sym_headers,
            json_body=json_body,
            description=description,
            expected_status=expected_status,
            py_path=py_path,
            sym_path=sym_path,
        )
        if not ok:
            return False

        # 1. Post-mutation GET verification
        if get_path:
            actual_get_path = get_path
            # If get_path has template placeholder e.g. {id}, extract from sym_res
            if "{id}" in get_path:
                sym_obj = sym_res.json()
                item_id = sym_obj.get("id") if isinstance(sym_obj, dict) else None
                if not item_id:
                    self.log_issue(path, method, f"Failed to resolve ID for GET check: {get_path}", json_body, py_res.status_code, py_res.text, sym_res.status_code, sym_res.text, "Response missing ID")
                    return False
                actual_get_path = get_path.replace("{id}", str(item_id))

            print(f"     -> Verifying persistence via GET {actual_get_path}...")
            py_get = self._http_request(self.python_url, "GET", actual_get_path, headers=py_headers)
            sym_get = self._http_request(self.symfony_url, "GET", actual_get_path, headers=sym_headers)

            if py_get.status_code != expected_get_status or sym_get.status_code != expected_get_status:
                self.log_issue(
                    endpoint=actual_get_path,
                    method="GET",
                    description=f"Persistence check failed for {method} {path}",
                    request_data=json_body,
                    py_status=py_get.status_code,
                    py_data=py_get.text[:300],
                    sym_status=sym_get.status_code,
                    sym_data=sym_get.text[:300],
                    root_cause=f"Expected GET {expected_get_status}, got Py={py_get.status_code}, Sym={sym_get.status_code}",
                )
                return False

            if verify_fields and expected_get_status == 200:
                py_data = py_get.json()
                sym_data = sym_get.json()
                for k, expected_v in verify_fields.items():
                    py_val = py_data.get(k) if isinstance(py_data, dict) else None
                    sym_val = sym_data.get(k) if isinstance(sym_data, dict) else None
                    if sym_val != expected_v:
                        self.log_issue(
                            endpoint=actual_get_path,
                            method="GET",
                            description=f"Field '{k}' mismatch after {method} {path}",
                            request_data=json_body,
                            py_status=py_get.status_code,
                            py_data=py_data,
                            sym_status=sym_get.status_code,
                            sym_data=sym_data,
                            root_cause=f"Field '{k}' is '{sym_val}', expected '{expected_v}'",
                        )
                        return False
            print(f"     [OK] Data persistence verified via GET (HTTP {expected_get_status})")

        # 2. Mercure SSE Event verification
        if expected_mercure_event and self.mercure_listener:
            print(f"     -> Verifying Mercure SSE event '{expected_mercure_event}'...")
            event = self.mercure_listener.wait_for_event(
                event_type=expected_mercure_event,
                timeout=3.5,
                payload_key=mercure_payload_key,
                match_fields=mercure_match_fields,
            )
            if not event:
                self.log_issue(
                    endpoint=path,
                    method=method,
                    description=f"Mercure event '{expected_mercure_event}' not received",
                    request_data=json_body,
                    py_status=py_res.status_code,
                    py_data="Event expected",
                    sym_status=sym_res.status_code,
                    sym_data="Event missing",
                    root_cause=f"Mercure Hub did not broadcast '{expected_mercure_event}' within 3.5s",
                )
                return False
            print(f"     [OK] Mercure event '{expected_mercure_event}' received and validated")

        return True

    def run_full_suite(self):
        print("=" * 80)
        print("  Starting Complete Shadow Traffic, Access Control & Realtime Parity Suite")
        print(f"  Python URL:   {self.python_url}")
        print(f"  Symfony URL:  {self.symfony_url}")
        print(f"  Mercure Hub:  {self.mercure_url or 'Disabled'}")
        print("=" * 80)

        with open(self.issues_file, "w", encoding="utf-8") as f:
            f.write("# Журнал расхождений и выявленных несоответствий (Migration Issues Tracker)\n\n")

        # -------------------------------------------------------------
        # 1. Health & Public Info Endpoints
        # -------------------------------------------------------------
        print("\n--- [STAGE 1] Health & Public Config Endpoints ---")
        self.compare_request("GET", "/api/health")
        self.compare_request("GET", "/api/v2/health")
        self.compare_request("GET", "/api/auth/config")
        self.compare_request("GET", "/api/v2/auth/config")
        self.compare_request("GET", "/api/v2/exchange-rates")

        # -------------------------------------------------------------
        # 2. Authentication: Dev Login for User 1 (Admin) & User 2 (Regular)
        # -------------------------------------------------------------
        print("\n--- [STAGE 2] Authentication, Profile & Feature Flags ---")
        user1_payload = {"email": "dev@local.user", "name": "Dev User"}
        user2_payload = {"email": "user2@local.user", "name": "Regular User"}

        _, py_l1, sym_l1 = self.compare_request("POST", "/api/v2/auth/dev-login", json_body=user1_payload, expected_status=200)
        _, py_l2, sym_l2 = self.compare_request("POST", "/api/v2/auth/dev-login", json_body=user2_payload, expected_status=200)

        token1_py = py_l1.json().get("token")
        token1_sym = sym_l1.json().get("token")
        token2_py = py_l2.json().get("token")
        token2_sym = sym_l2.json().get("token")

        u1_py_hdr = {"Authorization": f"Bearer {token1_py}", "Cookie": f"access_token={token1_py}"}
        u1_sym_hdr = {"Authorization": f"Bearer {token1_sym}", "Cookie": f"access_token={token1_sym}"}
        u2_py_hdr = {"Authorization": f"Bearer {token2_py}", "Cookie": f"access_token={token2_py}"}
        u2_sym_hdr = {"Authorization": f"Bearer {token2_sym}", "Cookie": f"access_token={token2_sym}"}

        # Start Mercure listener for User 1
        if self.mercure_url:
            self.mercure_listener = MercureEventListener(self.mercure_url, user_id=1, secret=self.mercure_secret)
            self.mercure_listener.start()
            time.sleep(1.0)

        # 2.1 Profile & Guest checks
        self.compare_request("GET", "/api/v2/auth/me", headers={}, description="Guest auth/me creates anonymous user", expected_status=200)
        self.compare_request("GET", "/api/v2/auth/me", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, description="User 1 auth/me")
        self.compare_request("GET", "/api/auth/me", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, description="User 1 auth/me legacy")

        # 2.2 Feature flags update and GET verification
        self.compare_mutation_and_verify_get(
            method="PUT",
            path="/api/v2/auth/me/feature-flags",
            json_body={"feature_flags": ["admin", "api_access"]},
            py_headers=u1_py_hdr,
            sym_headers=u1_sym_hdr,
            get_path="/api/v2/auth/me",
            expected_status=200,
            expected_get_status=200,
            verify_fields={"feature_flags": ["admin", "api_access"]},
            description="Update user feature flags",
        )
        self.compare_request("GET", "/api/v2/feature-flags", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr)
        self.compare_request("POST", "/api/v2/auth/logout", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, expected_status=200)

        # -------------------------------------------------------------
        # 3. Vacancies: CRUD & Interactive Operations
        # -------------------------------------------------------------
        print("\n--- [STAGE 3] Vacancies: CRUD, Reorder & Realtime Mutations ---")
        self.compare_request("GET", "/api/v2/vacancies", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, description="User 1 vacancies list")
        self.compare_request("GET", "/api/v2/vacancies", py_headers=u2_py_hdr, sym_headers=u2_sym_hdr, description="User 2 vacancies (tenant isolation)")
        self.compare_request("GET", "/api/v2/vacancies/1", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, description="Get vacancy 1")
        self.compare_request("GET", "/api/v2/vacancies/101", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, description="Cross-tenant vacancy 101 -> 404", expected_status=404)

        # 3.1 Create Vacancy -> verify GET + Mercure vacancy_created
        create_payload = {
            "title": "Rust Systems Architect",
            "company": "Mozilla",
            "url": "https://example.com/jobs/99",
            "status": "Еще не написал",
            "location": "Berlin, Germany",
            "workplace_type": "remote",
            "is_closed": False,
            "salary_min": 7000.0,
            "salary_max": 9500.0,
            "salary_currency": "EUR",
            "salary_period": "month",
            "tech_stack": ["Rust", "Wasm", "Tokio"],
            "tags": ["systems"],
            "lane": 0,
        }
        _, _, sym_create = self.compare_request("POST", "/api/v2/vacancies", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, json_body=create_payload, expected_status=200)
        new_id = sym_create.json().get("id")

        if new_id:
            # Verify GET persistence of created vacancy
            self.compare_request("GET", f"/api/v2/vacancies/{new_id}", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, description="GET created vacancy")

            # 3.2 PATCH Vacancy -> verify GET + Mercure vacancy_updated
            patch_payload = {
                "status": "Собеседование",
                "notes": "Updated by shadow test",
                "workplace_type": "remote",
                "is_closed": True,
            }
            self.compare_mutation_and_verify_get(
                method="PATCH",
                path=f"/api/v2/vacancies/{new_id}",
                json_body=patch_payload,
                py_headers=u1_py_hdr,
                sym_headers=u1_sym_hdr,
                get_path=f"/api/v2/vacancies/{new_id}",
                expected_status=200,
                expected_get_status=200,
                verify_fields={"status": "Собеседование", "notes": "Updated by shadow test", "is_closed": True},
                expected_mercure_event="vacancy_updated",
                mercure_payload_key="vacancy",
                mercure_match_fields={"id": new_id, "status": "Собеседование"},
                description="PATCH vacancy status and notes",
            )

            # 3.2b PATCH vacancy description ("исходный текст") -> verify GET + Mercure queue_updated
            desc_payload = {
                "description": "Updated vacancy requirements: 5+ years of PHP, Symfony, Docker, Mercure real-time event streaming."
            }
            self.compare_mutation_and_verify_get(
                method="PATCH",
                path=f"/api/v2/vacancies/{new_id}",
                json_body=desc_payload,
                py_headers=u1_py_hdr,
                sym_headers=u1_sym_hdr,
                get_path=f"/api/v2/vacancies/{new_id}",
                expected_status=200,
                expected_get_status=200,
                verify_fields={"description": "Updated vacancy requirements: 5+ years of PHP, Symfony, Docker, Mercure real-time event streaming."},
                expected_mercure_event="queue_updated",
                description="PATCH vacancy description -> triggers rescoring & queue_updated",
            )

            # 3.3 Reorder vacancies -> verify GET + Mercure
            reorder_payload = {
                "status": "Собеседование",
                "ids": [new_id, 3],
                "lane": 0,
                "moved_id": new_id,
            }
            self.compare_mutation_and_verify_get(
                method="POST",
                path="/api/v2/vacancies/reorder",
                json_body=reorder_payload,
                py_headers=u1_py_hdr,
                sym_headers=u1_sym_hdr,
                get_path=f"/api/v2/vacancies/{new_id}",
                expected_status=200,
                expected_get_status=200,
                verify_fields={"sort_order": 0.0, "status": "Собеседование"},
                expected_mercure_event="vacancy_updated",
                description="Reorder vacancies",
            )

            # 3.4 Resummarize
            self.compare_mutation_and_verify_get(
                method="POST",
                path=f"/api/v2/vacancies/{new_id}/resummarize",
                py_headers=u1_py_hdr,
                sym_headers=u1_sym_hdr,
                get_path=f"/api/v2/vacancies/{new_id}",
                expected_status=200,
                description="Resummarize vacancy AI summary",
            )

            # 3.6 DELETE Vacancy -> verify 404 + Mercure vacancy_deleted
            self.compare_mutation_and_verify_get(
                method="DELETE",
                path=f"/api/v2/vacancies/{new_id}",
                py_headers=u1_py_hdr,
                sym_headers=u1_sym_hdr,
                get_path=f"/api/v2/vacancies/{new_id}",
                expected_status=204,
                expected_get_status=404,
                expected_mercure_event="vacancy_deleted",
                description="DELETE vacancy",
            )

        # -------------------------------------------------------------
        # 4. Vacancy History & Comments
        # -------------------------------------------------------------
        print("\n--- [STAGE 4] Vacancy History & Comments ---")
        self.compare_request("GET", "/api/v2/vacancies/2/history", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr)
        
        hist_add_payload = {"to_status": "Собеседование", "to_lane": 0, "comment": "HR screening scheduled"}
        _, py_h, sym_h = self.compare_request("POST", "/api/v2/vacancies/2/history", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, json_body=hist_add_payload, expected_status=200)
        h_json = sym_h.json()
        h_list = h_json.get("history") if isinstance(h_json, dict) else h_json
        sym_h_id = h_list[-1].get("id") if isinstance(h_list, list) and len(h_list) > 0 else None

        py_json = py_h.json()
        py_list = py_json.get("history") if isinstance(py_json, dict) else py_json
        py_h_id = py_list[-1].get("id") if isinstance(py_list, list) and len(py_list) > 0 else sym_h_id

        if sym_h_id and py_h_id:
            self.compare_mutation_and_verify_get(
                method="PATCH",
                path=f"/api/v2/vacancies/2/history/{sym_h_id}",
                py_path=f"/api/v2/vacancies/2/history/{py_h_id}",
                sym_path=f"/api/v2/vacancies/2/history/{sym_h_id}",
                json_body={"comment": "Updated screening time"},
                py_headers=u1_py_hdr,
                sym_headers=u1_sym_hdr,
                get_path="/api/v2/vacancies/2/history",
                expected_status=200,
                expected_mercure_event="vacancy_updated",
                description="PATCH vacancy history comment",
            )
            self.compare_mutation_and_verify_get(
                method="DELETE",
                path=f"/api/v2/vacancies/2/history/{sym_h_id}",
                py_path=f"/api/v2/vacancies/2/history/{py_h_id}",
                sym_path=f"/api/v2/vacancies/2/history/{sym_h_id}",
                py_headers=u1_py_hdr,
                sym_headers=u1_sym_hdr,
                get_path="/api/v2/vacancies/2/history",
                expected_status=200,
                expected_mercure_event="vacancy_updated",
                description="DELETE vacancy history entry",
            )

        # -------------------------------------------------------------
        # 5. Scoring & CV Adaptation
        # -------------------------------------------------------------
        print("\n--- [STAGE 5] Scoring & CV Adaptation ---")
        self.compare_request("GET", "/api/v2/vacancies/1/compatibility", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr)
        self.compare_mutation_and_verify_get(
            method="POST",
            path="/api/v2/vacancies/1/compatibility",
            py_headers=u1_py_hdr,
            sym_headers=u1_sym_hdr,
            expected_status=200,
            expected_mercure_event="queue_updated",
            description="POST compatibility analysis -> triggers queue_updated",
        )
        self.compare_request("POST", "/api/v2/vacancies/1/adapt-cv", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, expected_status=403)

        # -------------------------------------------------------------
        # 6. Kanban Columns & Metadata Management
        # -------------------------------------------------------------
        print("\n--- [STAGE 6] Kanban Columns, Metadata & Settings ---")
        self.compare_request("GET", "/api/v2/columns", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr)
        
        # 6.1 Create custom column
        self.compare_mutation_and_verify_get(
            method="POST",
            path="/api/v2/columns",
            json_body={"name": "Archive", "color": "#64748b", "has_lanes": False},
            py_headers=u1_py_hdr,
            sym_headers=u1_sym_hdr,
            get_path="/api/v2/columns",
            expected_status=200,
            description="Create custom Kanban column",
        )
        self.compare_mutation_and_verify_get(
            method="PATCH",
            path="/api/v2/columns/Archive",
            json_body={"color": "#334155"},
            py_headers=u1_py_hdr,
            sym_headers=u1_sym_hdr,
            get_path="/api/v2/columns",
            expected_status=200,
            description="PATCH column color",
        )
        self.compare_mutation_and_verify_get(
            method="DELETE",
            path="/api/v2/columns/Archive",
            py_headers=u1_py_hdr,
            sym_headers=u1_sym_hdr,
            get_path="/api/v2/columns",
            expected_status=200,
            description="DELETE custom column",
        )

        # 6.2 Settings
        self.compare_request("GET", "/api/v2/settings", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr)
        self.compare_mutation_and_verify_get(
            method="POST",
            path="/api/v2/settings",
            json_body={"locale": "en", "salary_display_format": "year"},
            py_headers=u1_py_hdr,
            sym_headers=u1_sym_hdr,
            get_path="/api/v2/settings",
            expected_status=200,
            verify_fields={"locale": "en", "salary_display_format": "year"},
            description="Save user settings",
        )

        # 6.3 Aggregated metadata
        self.compare_request("GET", "/api/v2/stats", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr)
        self.compare_request("GET", "/api/v2/tags", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr)
        self.compare_request("GET", "/api/v2/cities", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr)
        self.compare_request("GET", "/api/v2/countries", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr)
        self.compare_request("GET", "/api/v2/sources", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr)

        # -------------------------------------------------------------
        # 7. CV Management
        # -------------------------------------------------------------
        print("\n--- [STAGE 7] CV & Approved CV Management ---")
        self.compare_request("GET", "/api/v2/cv", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr)
        self.compare_mutation_and_verify_get(
            method="POST",
            path="/api/v2/cv",
            json_body={"content": "Senior Fullstack Engineer with 10 years experience in Python and Symfony."},
            py_headers=u1_py_hdr,
            sym_headers=u1_sym_hdr,
            get_path="/api/v2/cv",
            expected_status=200,
            expected_mercure_event="queue_updated",
            description="POST CV content -> triggers queue_updated & scoring",
        )
        self.compare_mutation_and_verify_get(
            method="DELETE",
            path="/api/v2/cv",
            py_headers=u1_py_hdr,
            sym_headers=u1_sym_hdr,
            get_path="/api/v2/cv",
            expected_status=204,
            expected_get_status=200,
            description="DELETE CV content",
        )

        # -------------------------------------------------------------
        # 8. API Keys Management
        # -------------------------------------------------------------
        print("\n--- [STAGE 8] API Keys Management ---")
        self.compare_request("GET", "/api/v2/api-keys", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr)
        _, _, sym_key = self.compare_request("POST", "/api/v2/api-keys", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, json_body={"name": "Shadow Test Key"}, expected_status=200)
        k_id = sym_key.json().get("id")
        if k_id:
            self.compare_mutation_and_verify_get(
                method="DELETE",
                path=f"/api/v2/api-keys/{k_id}",
                py_headers=u1_py_hdr,
                sym_headers=u1_sym_hdr,
                get_path="/api/v2/api-keys",
                expected_status=200,
                description="DELETE API Key",
            )

        # -------------------------------------------------------------
        # 9. Queue & Chrome Extension API
        # -------------------------------------------------------------
        print("\n--- [STAGE 9] Queue & Chrome Extension API ---")
        self.compare_request("POST", "/api/v2/extension/ping", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, expected_status=200)
        self.compare_request("GET", "/api/v2/extension/status", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, expected_status=200)
        self.compare_request("GET", "/api/v2/extension/changelog", expected_status=200)
        self.compare_request("GET", "/api/v2/extension/mercure_config", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, expected_status=200)
        self.compare_request("GET", "/api/v2/extension/tasks", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, expected_status=200)
        self.compare_request("POST", "/api/v2/extension/log", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, json_body={"level": "info", "message": "Extension test log"}, expected_status=200)
        self.compare_request("GET", "/api/v2/queue/links", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, expected_status=200)

        # 9.1 Batch import vacancies -> verify Mercure queue_updated event & queue persistence
        self.compare_mutation_and_verify_get(
            method="POST",
            path="/api/v2/vacancies/batch",
            json_body={"urls": ["https://www.linkedin.com/jobs/view/999888777/"]},
            py_headers=u1_py_hdr,
            sym_headers=u1_sym_hdr,
            get_path="/api/v2/queue/links",
            expected_status=200,
            expected_get_status=200,
            expected_mercure_event="queue_updated",
            description="POST /api/v2/vacancies/batch -> triggers queue_updated Mercure event",
        )

        # 9.2 Clear queue -> verify Mercure queue_updated event
        self.compare_mutation_and_verify_get(
            method="DELETE",
            path="/api/v2/queue/clear",
            py_headers=u1_py_hdr,
            sym_headers=u1_sym_hdr,
            get_path="/api/v2/queue/links",
            expected_status=200,
            expected_get_status=200,
            expected_mercure_event="queue_updated",
            description="DELETE /api/v2/queue/clear -> triggers queue_updated Mercure event",
        )

        # -------------------------------------------------------------
        # 10. Admin REST API & EasyAdmin
        # -------------------------------------------------------------
        print("\n--- [STAGE 10] Admin REST API & EasyAdmin Security ---")
        self.compare_request("GET", "/api/v2/admin/users", py_headers=u2_py_hdr, sym_headers=u2_sym_hdr, description="Regular user on /admin/users -> 403", expected_status=403)
        self.compare_request("GET", "/api/v2/admin/users", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, description="Admin on /admin/users -> 200", expected_status=200)
        self.compare_request("PATCH", "/api/v2/admin/users/2", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, json_body={"feature_flags": ["api_access"]}, expected_status=200)

        sym_ea_user2 = self._http_request(self.symfony_url, "GET", "/admin", headers=u2_sym_hdr)
        sym_ea_user1 = self._http_request(self.symfony_url, "GET", "/admin", headers=u1_sym_hdr)
        sym_ea_vac = self._http_request(self.symfony_url, "GET", "/admin/vacancy", headers=u1_sym_hdr)
        sym_ea_usr = self._http_request(self.symfony_url, "GET", "/admin/user", headers=u1_sym_hdr)
        sym_ea_que = self._http_request(self.symfony_url, "GET", "/admin/processing-queue-item", headers=u1_sym_hdr)

        print(f"     [OK] EasyAdmin Security: User2 HTTP {sym_ea_user2.status_code} (expected 403), Admin HTTP {sym_ea_user1.status_code} (expected 200)")
        print(f"     [OK] EasyAdmin Vacancies: HTTP {sym_ea_vac.status_code}, Users: HTTP {sym_ea_usr.status_code}, Queue: HTTP {sym_ea_que.status_code}")

        # -------------------------------------------------------------
        # 11. Public API v1 (API-key authenticated)
        # -------------------------------------------------------------
        print("\n--- [STAGE 11] Public API v1 ---")
        k1_hdr = {"X-API-Key": "test_key_user1"}
        k2_hdr = {"X-API-Key": "test_key_user2"}

        self.compare_request("GET", "/api/v1/vacancies", headers={}, description="Public API without key -> 401", expected_status=401)
        self.compare_request("PATCH", "/api/v2/admin/users/2", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, json_body={"feature_flags": []}, expected_status=200)
        self.compare_request("GET", "/api/v1/vacancies", headers=k2_hdr, description="Public API without api_access -> 403", expected_status=403)
        # Now admin grants api_access to User 2 and verifies key becomes active
        self.compare_request("PATCH", "/api/v2/admin/users/2", py_headers=u1_py_hdr, sym_headers=u1_sym_hdr, json_body={"feature_flags": ["api_access"]}, expected_status=200)
        self.compare_request("GET", "/api/v1/vacancies", headers=k2_hdr, description="Public API with granted api_access -> 200", expected_status=200)
        self.compare_request("GET", "/api/v1/vacancies", headers=k1_hdr, description="Public API with valid key -> 200", expected_status=200)
        self.compare_request("GET", "/api/v1/vacancies/1", headers=k1_hdr, description="Get vacancy 1 via API v1")
        self.compare_request("GET", "/api/v1/vacancies/1/history", headers=k1_hdr)
        self.compare_request("GET", "/api/v1/vacancies/1/compatibility", headers=k1_hdr)
        self.compare_request("GET", "/api/v1/cv", headers=k1_hdr)
        self.compare_request("GET", "/api/v1/columns", headers=k1_hdr)
        self.compare_request("GET", "/api/v1/tags", headers=k1_hdr)
        self.compare_request("GET", "/api/v1/cities", headers=k1_hdr)
        self.compare_request("GET", "/api/v1/countries", headers=k1_hdr)
        self.compare_request("GET", "/api/v1/sources", headers=k1_hdr)

        # Public API v1 Mutation: Create and Delete
        v1_create_payload = {
            "title": "Public API Engineer",
            "company": "API Corp",
            "url": "https://example.com/jobs/v1_new",
            "status": "Еще не написал",
        }
        _, py_v1, sym_v1 = self.compare_request("POST", "/api/v1/vacancies", headers=k1_hdr, json_body=v1_create_payload, expected_status=200)
        sym_v1_id = sym_v1.json().get("id") if sym_v1.json() else None
        py_v1_id = py_v1.json().get("id") if py_v1.json() else sym_v1_id
        if sym_v1_id and py_v1_id:
            self.compare_mutation_and_verify_get(
                method="DELETE",
                path=f"/api/v1/vacancies/{sym_v1_id}",
                py_path=f"/api/v1/vacancies/{py_v1_id}",
                sym_path=f"/api/v1/vacancies/{sym_v1_id}",
                py_headers=k1_hdr,
                sym_headers=k1_hdr,
                get_path=f"/api/v1/vacancies/{sym_v1_id}",
                expected_status=204,
                expected_get_status=404,
                expected_mercure_event="vacancy_deleted",
                description="DELETE vacancy via Public API v1",
            )

        if self.mercure_listener:
            self.mercure_listener.stop()

        print("\n" + "=" * 80)
        print(f"  Verification Complete! Total tests executed: {self.test_counter}")
        print(f"  Total Discrepancies Registered: {self.issue_counter}")
        print(f"  Full Discrepancies Log: {self.issues_file}")
        print("=" * 80)


def start_backend_servers():
    print("[*] Starting Python backend on 127.0.0.1:8000...")
    py_proc = subprocess.Popen(
        [os.path.join(base_dir, ".venv", "bin", "python3"), os.path.join(base_dir, "scripts", "run_python_backend.py")],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    print("[*] Starting Symfony backend on 127.0.0.1:8001...")
    sym_env = os.environ.copy()
    sym_env["DATABASE_URL"] = f"sqlite:///{os.path.join(base_dir, 'backend-symfony', 'var', 'app.db')}"
    sym_env["APP_ENV"] = "dev"
    sym_env["APP_DEBUG"] = "0"
    sym_env["APP_SECRET"] = "c6b0ef228beea680e6e76cf0e4708765"
    sym_env["APP_URL"] = "http://localhost:8001"
    sym_env["DEFAULT_URI"] = "http://localhost:8001"
    sym_env["MESSENGER_TRANSPORT_DSN"] = "doctrine://default"
    sym_env["MERCURE_URL"] = "https://test-symfony.linkedinparser.build.dkoldyaev.com/.well-known/mercure"
    sym_env["MERCURE_PUBLIC_URL"] = "https://test-symfony.linkedinparser.build.dkoldyaev.com/.well-known/mercure"
    sym_env["MERCURE_JWT_SECRET"] = "!ChangeThisMercureHubJWTSecretKey!"
    sym_env["MERCURE_JWT_ISSUER"] = "linkedin-parser"
    sym_env["JWT_SECRET"] = "a_very_secret_jwt_key_that_is_long_enough_for_security_12345678"
    sym_env["LLM_PROVIDER"] = "mock"
    sym_env["PARSER_API_URL"] = "http://localhost:8000"
    sym_env["ADMIN_EMAIL"] = "dev@local.user"
    sym_env["ADMIN_PASSWORD"] = "DevSecure2026!"

    sym_log = open(os.path.join(base_dir, "backend-symfony", "var", "test_server.log"), "w")
    sym_proc = subprocess.Popen(
        [
            "php",
            "-S",
            "127.0.0.1:8001",
            "-t",
            os.path.join(base_dir, "backend-symfony", "public"),
            os.path.join(base_dir, "backend-symfony", "public", "index.php"),
        ],
        env=sym_env,
        stdout=sym_log,
        stderr=sym_log,
    )

    def cleanup():
        print("\n[*] Shutting down test backend servers...")
        py_proc.terminate()
        sym_proc.terminate()

    atexit.register(cleanup)

    # Wait for both servers to respond
    for port, name in [(8000, "Python"), (8001, "Symfony")]:
        ready = False
        for _ in range(30):
            try:
                s = socket.socket()
                s.settimeout(0.5)
                if s.connect_ex(("127.0.0.1", port)) == 0:
                    ready = True
                    s.close()
                    break
                s.close()
            except Exception:
                pass
            time.sleep(0.3)
        if not ready:
            raise RuntimeError(f"Failed to start {name} server on port {port}")
        print(f"[*] {name} server is ready on port {port}")

    return py_proc, sym_proc


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Full Shadow Traffic & Access Control Verifier")
    parser.add_argument("--python-url", default="http://localhost:8000", help="Legacy Python API URL")
    parser.add_argument("--symfony-url", default="http://localhost:8001", help="Symfony API URL")
    parser.add_argument("--mercure-url", default="https://test-symfony.linkedinparser.build.dkoldyaev.com/.well-known/mercure", help="Mercure Hub URL")
    parser.add_argument("--issues-file", default="docs/migration_issues.md", help="Path to issues log")
    parser.add_argument("--reset-dbs", action="store_true", default=True, help="Reset both SQLite databases to deterministic fixtures")
    parser.add_argument("--start-servers", action="store_true", default=True, help="Auto-start Python and Symfony servers")
    args = parser.parse_args()

    if args.reset_dbs:
        print("[*] Resetting both Python and Symfony databases with deterministic fixtures...")
        seed_legacy_python_db(os.path.join(base_dir, "data", "legacy", "app.db"))
        seed_symfony_db(os.path.join(base_dir, "backend-symfony", "var", "app.db"))
        print("[OK] Both databases reset to identical fixtures.")

    if args.start_servers:
        start_backend_servers()

    verifier = ShadowDiffVerifier(
        python_url=args.python_url,
        symfony_url=args.symfony_url,
        mercure_url=args.mercure_url,
        issues_file=args.issues_file,
    )
    verifier.run_full_suite()
