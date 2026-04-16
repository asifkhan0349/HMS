import requests

BASE_URL = "http://localhost:8000/api"

def test_booking():
    # 1. Login to get token
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "hrmsadmin123"})
    if login_resp.status_code != 200:
        print(f"Login failed: {login_resp.text}")
        return
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Book appointment with MINIMALIST payload
    payload = {
        "patient_name": "Backend Verification Test",
        "patient_age": 35,
        "patient_gender": "Male",
        "patient_address": "Test Address",
        "appointment_type": "New Consultation"
    }
    
    print(f"Sending booking request: {payload}")
    resp = requests.post(f"{BASE_URL}/appointments", json=payload, headers=headers)
    
    if resp.status_code == 201:
        print("Success! Appointment booked.")
        print(resp.json())
    else:
        print(f"Failed with status {resp.status_code}: {resp.text}")

if __name__ == "__main__":
    test_booking()
