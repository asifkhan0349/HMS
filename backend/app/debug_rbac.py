import sys
import os

# Add the project root to sys.path
sys.path.append(r'c:\Users\asifk\Documents\antigravity\HMS\backend')

from app.core.permissions import get_allowed_roles, RESOURCE_TO_MODULE

print("RESOURCE_TO_MODULE mapping:")
for res, mod in RESOURCE_TO_MODULE.items():
    print(f"  {res} -> {mod}")

print("\nAllowed roles per resource:")
resources = [
    "dashboard", "patients", "appointments", "records", "billing", 
    "pharmacy", "lab", "beds", "staff", "reports", "inventory", "blood_bank"
]

for res in resources:
    roles = get_allowed_roles(res)
    print(f"  {res}: {roles}")
