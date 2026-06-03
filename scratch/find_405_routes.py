import sys
import os

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

endpoints = [
    "/api/patients",
    "/api/patients/1",
    "/api/invoices",
    "/api/invoices/1",
    "/api/appointments",
    "/api/appointments/1",
    "/api/records",
    "/api/records/1",
    "/api/staff",
    "/api/staff/1",
    "/api/beds",
    "/api/beds/1",
    "/api/cash-receipts",
    "/api/cash-receipts/1",
]

print(f"{'Path':<30} | {'Method':<8} | {'Status':<6}")
print("-" * 50)

for path in endpoints:
    for method in ["GET", "POST", "PUT", "DELETE"]:
        try:
            # We don't care about authentication (401/403) or 404 (Not Found).
            # We specifically want to check for 405 Method Not Allowed.
            response = client.request(method, path)
            if response.status_code == 405:
                print(f"{path:<30} | {method:<8} | {response.status_code:<6} (405 Method Not Allowed!)")
        except Exception as e:
            pass
