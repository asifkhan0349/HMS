import httpx

url = "http://localhost:8000/api/records"
# Use doctor01 credentials to get a token first
auth_url = "http://localhost:8000/api/auth/login"
try:
    login_resp = httpx.post(auth_url, json={"username": "admin_hms", "password": "ham33dSh@ika7m1n4m5"})
    print(f"Login Status: {login_resp.status_code}")
    print(f"Login Response: {login_resp.text}")
    token = login_resp.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
    resp = httpx.get(url, headers=headers)
    print(f"Status: {resp.status_code}")
    print(resp.text)
except Exception as e:
    print(f"Error: {e}")
