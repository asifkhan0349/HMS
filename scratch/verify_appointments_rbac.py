import requests

BASE_URL = "http://localhost:8000/api"

def get_token(username, password):
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    if resp.status_code == 200:
        return resp.json()["token"]
    print(f"Login failed for {username}: {resp.status_code}")
    print(resp.text)
    return None

def test_appointments(token, label):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/appointments", headers=headers)
    print(f"[{label}] GET /appointments -> {resp.status_code}")
    if resp.status_code == 200:
        print(f"  Received {len(resp.json())} appointments.")
    else:
        print(f"  Error: {resp.text}")

def main():
    print("Testing RBAC on /api/appointments...")
    
    admin_token = get_token("testuser0349", "7357U536@349")
    if admin_token:
        test_appointments(admin_token, "ADMIN")
    
    doctor_token = get_token("drtest", "doctorpassword")
    if doctor_token:
        test_appointments(doctor_token, "DOCTOR")

if __name__ == "__main__":
    main()
