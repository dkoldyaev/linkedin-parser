import uuid
from fastapi.testclient import TestClient
from backend.main import app
from backend.queue_manager import queue_manager

def test_extension_ping_and_status():
    with TestClient(app) as client:
        unique_email = f"ext_test_{uuid.uuid4().hex[:6]}@local.user"
        login_res = client.post("/api/auth/dev-login", json={"email": unique_email})
        assert login_res.status_code == 200
        token = login_res.json()["token"]
        user_id = login_res.json()["user"]["id"]
        client.cookies.set("access_token", token)

        # Initially, extension is not active for this brand new user
        res_initial = client.get("/api/extension/status")
        assert res_initial.status_code == 200
        assert res_initial.json()["active"] is False

        # Extension sends ping
        res_ping = client.post("/api/extension/ping")
        assert res_ping.status_code == 200
        assert res_ping.json()["status"] == "ok"

        # Now status should be active
        res_after = client.get("/api/extension/status")
        assert res_after.status_code == 200
        assert res_after.json()["active"] is True
        print("✓ Extension ping and status API verified successfully!")

if __name__ == "__main__":
    test_extension_ping_and_status()
