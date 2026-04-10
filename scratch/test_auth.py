
import requests
import json

base_url = "http://localhost:8001" # Auth/Proxy server

def test_login_and_patients():
    print(f"Testing login at {base_url}/api/auth/login...")
    login_payload = {
        "username": "admin",
        "password": "hrmsadmin123"
    }
    try:
        response = requests.post(f"{base_url}/api/auth/login", json=login_payload)
        print(f"Login Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Login failed: {response.text}")
            return

        data = response.json()
        token = data.get("token")
        print(f"Token received: {token[:20]}...")

        # Test 1: Call with Bearer prefix (Standard)
        print("\nTest 1: Calling /api/patients with 'Bearer <token>'")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{base_url}/api/patients", headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")

        # Test 2: Call without Bearer prefix
        print("\nTest 2: Calling /api/patients with raw token")
        headers = {"Authorization": token}
        resp = requests.get(f"{base_url}/api/patients", headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login_and_patients()
