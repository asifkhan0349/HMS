import requests
import json

BASE_URL = "http://localhost:8000/api"

def audit_log(msg, success=True):
    prefix = "[PASS]" if success else "[FAIL]"
    print(f"{prefix} {msg}")

def run_audit():
    print("--- Starting HMS Security & API Audit ---\n")
    
    # 1. Auth Boundary Check
    try:
        r = requests.get(f"{BASE_URL}/patients")
        if r.status_code == 401:
            audit_log("Public access to /patients is blocked.")
        else:
            audit_log(f"Public access to /patients allowed (Status: {r.status_code})", False)
    except Exception as e:
        print(f"Error connecting to backend: {e}")
        return

    # 2. Login & Token Retrieval
    login_data = {"username": "audituser", "password": "password123"}
    # Assuming the seed.py created this or we need to sign up
    r_login = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if r_login.status_code != 200:
        print("Login failed. Attempting signup...")
        r_signup = requests.post(f"{BASE_URL}/auth/signup", json={
            "full_name": "Audit User",
            "username": "audituser",
            "email": "audit@example.com",
            "password": "password123",
            "role": "Admin"
        })
        if r_signup.status_code not in [200, 201]:
            print(f"Signup failed: {r_signup.text}")
            return
        r_login = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    token = r_login.json().get("token")
    if not token:
        print(f"Token not found in login response: {r_login.json()}")
        return
    headers = {"Authorization": f"Bearer {token}"}
    audit_log("Authentication flow successful.")

    # 3. Input Validation (Pydantic check)
    bad_patient = {
        "name": "", # Too short
        "age": -5,   # Negative age
        "gender": "NonBinary", # Not in enum? (Depends on schema)
        "blood_group": "Z+", # Not in enum
        "status": "Healthy"
    }
    r_create = requests.post(f"{BASE_URL}/patients", json=bad_patient, headers=headers)
    if r_create.status_code == 422:
        audit_log("Pydantic validation correctly blocked invalid patient data.")
    else:
        audit_log(f"Expected 422, but got {r_create.status_code} (Body: {r_create.text})", False)

    # 4. IDOR Check (Insecure Direct Object Reference)
    # We'll try to find a patient that exists but doesn't belong to us if possible.
    # For now, let's just make sure we can't 'guess' IDs and get data.
    r_get = requests.get(f"{BASE_URL}/patients/99999", headers=headers)
    if r_get.status_code == 404:
        audit_log("Non-existent patient correctly returns 404.")
    
    # 5. Method Audit (Check if sensitive methods are exposed)
    r_options = requests.options(f"{BASE_URL}/auth/login")
    audit_log(f"CORS Options for login: {r_options.headers.get('Access-Control-Allow-Methods')}")

    print("\n--- Audit Complete ---")

if __name__ == "__main__":
    run_audit()
