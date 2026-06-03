import sys
import os

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Login first
login_resp = client.post("/api/auth/login", json={
    "username": "admin_hms",
    "password": "ham33dSh@ika7m1n4m5"  # Let's check seed.py or use dev-insecure password
})

print(f"Login Response Status: {login_resp.status_code}")
if login_resp.status_code != 200:
    print(f"Login failed: {login_resp.text}")
    sys.exit(1)

token = login_resp.json().get("token")
headers = {"Authorization": f"Bearer {token}"}

endpoints = [
    "/api/patients",
    "/api/invoices",
    "/api/appointments",
    "/api/records",
    "/api/staff",
    "/api/beds",
    "/api/cash-receipts",
]

print(f"\n{'Path':<35} | {'Method':<8} | {'Status':<6} | {'Response':<40}")
print("-" * 100)

for path in endpoints:
    for method in ["GET", "POST", "PUT", "DELETE"]:
        try:
            response = client.request(method, path, headers=headers)
            if response.status_code == 405:
                print(f"{path:<35} | {method:<8} | {response.status_code:<6} | {response.text}")
        except Exception as e:
            print(f"Error on {method} {path}: {e}")
