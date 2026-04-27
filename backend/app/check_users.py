
import sys
import os

# Add the project root to sys.path
sys.path.append(r'c:\Users\asifk\Documents\antigravity\HMS\backend')

from app.core.database import SessionLocal
from app.models import User

db = SessionLocal()
users = db.query(User).all()

print(f"{'Username':<15} | {'Role':<15}")
print("-" * 35)
for user in users:
    print(f"{user.username:<15} | {user.role:<15}")

db.close()
