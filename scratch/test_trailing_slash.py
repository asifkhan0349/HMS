import sys
import os

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

endpoints = [
    "/api/patients/",
    "/api/patients/1/",
    "/api/invoices/",
    "/api/invoices/1/",
    "/api/appointments/",
    "/api/appointments/1/",
]

print(f"{'Path':<30} | {'Method':<8} | {'Status':<6}")
print("-" * 50)

for path in endpoints:
    for method in ["GET", "POST", "PUT", "DELETE"]:
        try:
            response = client.request(method, path, follow_redirects=False)
            if response.status_code in [307, 308]:
                print(f"{path:<30} | {method:<8} | {response.status_code:<6} (Redirect to {response.headers.get('location')})")
            else:
                print(f"{path:<30} | {method:<8} | {response.status_code:<6}")
        except Exception as e:
            print(f"Error {path} {method}: {e}")
