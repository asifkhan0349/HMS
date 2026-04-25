import requests

def debug_login():
    base_url = "http://127.0.0.1:8001/api"
    print("Logging in...")
    resp = requests.post(f"{base_url}/auth/login", json={"username": "nurse_test", "password": "nurse123"})
    print(f"Login Response: {resp.status_code}")
    if resp.status_code != 200:
        print(resp.text)
        return
    
    data = resp.json()
    token = data["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\nChecking /patients (Initial redirect target)...")
    resp = requests.get(f"{base_url}/patients", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 403:
        print(f"FAILED: {resp.text}")

    print("\nChecking /staff (Used in EMR/Lab)...")
    resp = requests.get(f"{base_url}/staff", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 403:
        print(f"FAILED: {resp.text}")

if __name__ == "__main__":
    debug_login()
