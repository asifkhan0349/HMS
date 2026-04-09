import requests
import json
import time

BASE_URL = "http://127.0.0.1:8001/api"

def test_signup():
    print("Testing Signup...")
    payload = {
        "full_name": "Test User",
        "username": "testuser_" + str(int(time.time())),
        "email": "test_" + str(int(time.time())) + "@example.com",
        "password": "password123",
        "role": "Admin"
    }
    response = requests.post(f"{BASE_URL}/auth/signup", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print("Signup Success!")
        return data['token'], payload['username']
    else:
        print(f"Signup Failed: {response.text}")
        return None, None

def test_login(username, password="password123"):
    print(f"\nTesting Login with {username}...")
    payload = {"username": username, "password": password}
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Login Success!")
        return data['token']
    else:
        print(f"Login Failed: {response.text}")
        return None

def test_profile_update(token):
    print("\nTesting Profile Update (PATCH)...")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"full_name": "Updated Admin Name"}
    response = requests.patch(f"{BASE_URL}/auth/profile", json=payload, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

def test_password_change(token):
    print("\nTesting Password Change (POST)...")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "current_password": "password123",
        "new_password": "newpassword123"
    }
    response = requests.post(f"{BASE_URL}/auth/change-password", json=payload, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

if __name__ == "__main__":
    token, username = test_signup()
    if token:
        test_profile_update(token)
        test_password_change(token)
        # Verify new password
        login_token = test_login(username, "newpassword123")
        if login_token:
            print("Login with NEW password Success!")
        else:
             print("Login with NEW password Failed!")
