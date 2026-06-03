import sys
import os
from fastapi.testclient import TestClient

# Add backend directory to sys.path to import app correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "Documents", "antigravity", "HMS", "backend")))

try:
    from app.main import app
    from app.core.config import API_PREFIX
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

client = TestClient(app)

def test_endpoints():
    print("Testing GET /invoices (public)...")
    resp_invoices = client.get(f"{API_PREFIX}/invoices")
    print(f"Status Code: {resp_invoices.status_code}")
    assert resp_invoices.status_code == 200, f"Expected 200, got {resp_invoices.status_code}"
    invoices = resp_invoices.json()
    print(f"Found {len(invoices)} invoices.")

    print("\nTesting GET /tests (public)...")
    resp_tests = client.get(f"{API_PREFIX}/tests")
    print(f"Status Code: {resp_tests.status_code}")
    assert resp_tests.status_code == 200, f"Expected 200, got {resp_tests.status_code}"
    tests = resp_tests.json()
    print(f"Found {len(tests)} tests.")

    if len(invoices) > 0:
        inv_id = invoices[0]["id"]
        print(f"\nTesting GET /invoices/{inv_id} (public)...")
        resp_single_inv = client.get(f"{API_PREFIX}/invoices/{inv_id}")
        assert resp_single_inv.status_code == 200
        print(f"Successfully retrieved invoice ID {inv_id}")

    if len(tests) > 0:
        test_id = tests[0]["id"]
        print(f"\nTesting GET /tests/{test_id} (public)...")
        resp_single_test = client.get(f"{API_PREFIX}/tests/{test_id}")
        assert resp_single_test.status_code == 200
        print(f"Successfully retrieved test ID {test_id}")

    print("\nTesting GET /invoices/999999 (404 expected)...")
    resp_missing_inv = client.get(f"{API_PREFIX}/invoices/999999")
    print(f"Status Code: {resp_missing_inv.status_code}")
    assert resp_missing_inv.status_code == 404
    print("Missing invoice returned 404 as expected.")

    print("\nTesting GET /tests/999999 (404 expected)...")
    resp_missing_test = client.get(f"{API_PREFIX}/tests/999999")
    print(f"Status Code: {resp_missing_test.status_code}")
    assert resp_missing_test.status_code == 404
    print("Missing test returned 404 as expected.")

    print("\nAll endpoints verified successfully!")

if __name__ == "__main__":
    test_endpoints()
