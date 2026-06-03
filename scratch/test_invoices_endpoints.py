import sys
import os

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Login
login_resp = client.post("/api/auth/login", json={
    "username": "admin_hms",
    "password": "ham33dSh@ika7m1n4m5"
})

token = login_resp.json().get("token")
headers = {"Authorization": f"Bearer {token}"}

endpoints = [
    "/api/invoices",
    "/api/invoices/1",
]

for path in endpoints:
    print(f"\nTesting path: {path}")
    for method in ["GET", "POST", "PUT", "DELETE"]:
        resp = client.request(method, path, headers=headers)
        print(f"  {method:<6} -> status: {resp.status_code}, response: {resp.text[:100]}")
