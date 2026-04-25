import sys
import os
import httpx
import json

sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.database import SessionLocal
from app.models import User
from app.core.security import create_access_token

db = SessionLocal()
users_map = {u.role: u for u in db.query(User).all()}
db.close()

def get_token(role):
    user = users_map.get(role)
    if not user:
        return None
    return create_access_token(user_id=user.id)

# Test cases: (Role, Endpoint, Expected Status)
tests = [
    ("Doctor", "/api/patients", 200),
    ("Doctor", "/api/dashboard/stats", 403),
    ("Nurse", "/api/beds", 200),
    ("Nurse", "/api/staff", 403),
    ("Reception", "/api/invoices", 200),
    ("Reception", "/api/patients", 403),
    ("Patient", "/api/patients", 200),
    ("Patient", "/api/staff", 403),
    ("Admin", "/api/dashboard/stats", 200),
]

BASE_URL = "http://127.0.0.1:8000"

async def run_tests():
    async with httpx.AsyncClient() as client:
        for role, endpoint, expected in tests:
            token = get_token(role)
            if not token:
                print(f"Role: {role:10} | Skipping (User not found)")
                continue
            headers = {"Authorization": f"Bearer {token}"}
            try:
                response = await client.get(f"{BASE_URL}{endpoint}", headers=headers)
                status = response.status_code
                result = "PASS" if status == expected else f"FAIL (Got {status})"
                print(f"Role: {role:10} | Endpoint: {endpoint:20} | Expected: {expected} | Result: {result}")
            except Exception as e:
                print(f"Role: {role:10} | Endpoint: {endpoint:20} | Error: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_tests())
