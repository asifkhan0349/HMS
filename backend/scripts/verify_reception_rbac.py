import requests

def verify_reception_rbac():
    base_url = "http://127.0.0.1:8001/api"
    print("Logging in as Reception...")
    resp = requests.post(f"{base_url}/auth/login", json={"username": "reception_test", "password": "reception123"})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
    
    token = resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Allowed endpoints (using actual API paths)
    allowed = ["/invoices", "/medicines", "/inventory", "/blood_inventory"]
    # Denied endpoints
    denied = ["/dashboard/stats", "/appointments", "/patients", "/records", "/tests", "/beds", "/staff"]

    print("\n--- Testing Allowed Endpoints ---")
    for ep in allowed:
        resp = requests.get(f"{base_url}{ep}", headers=headers)
        print(f"GET {ep}: {resp.status_code} {'(PASS)' if resp.status_code == 200 else '(FAIL)'}")

    print("\n--- Testing Denied Endpoints ---")
    for ep in denied:
        resp = requests.get(f"{base_url}{ep}", headers=headers)
        print(f"GET {ep}: {resp.status_code} {'(PASS)' if resp.status_code == 403 else '(FAIL)'}")

if __name__ == "__main__":
    verify_reception_rbac()
