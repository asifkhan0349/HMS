
import sys
import os

# Add the project root to sys.path
sys.path.append(r'c:\Users\asifk\Documents\antigravity\HMS\backend')

from app.core.permissions import get_allowed_roles, has_permission, MODULE_PERMISSIONS, RESOURCE_TO_MODULE

def test_permission(role, resource):
    allowed = get_allowed_roles(resource)
    has_perm = has_permission(role, resource)
    print(f"Role: {role:<10} | Resource: {resource:<15} | Allowed: {str(allowed):<40} | Has Permission: {has_perm}")

print("Testing Doctor permissions:")
test_permission("Doctor", "lab")
test_permission("Doctor", "records")
test_permission("Doctor", "blood_bank")
test_permission("Doctor", "pharmacy")

print("\nTesting Nurse permissions:")
test_permission("Nurse", "lab")
test_permission("Nurse", "records")
test_permission("Nurse", "blood_bank")

print("\nTesting Reception permissions:")
test_permission("Reception", "billing")
test_permission("Reception", "inventory")
test_permission("Reception", "lab")

print("\nTesting Patient permissions:")
test_permission("Patient", "appointments")
test_permission("Patient", "records")
test_permission("Patient", "lab")

print("\nChecking RESOURCE_TO_MODULE for 'emr':")
print(f"  'emr' in RESOURCE_TO_MODULE: {'emr' in RESOURCE_TO_MODULE}")
print(f"  get_allowed_roles('emr'): {get_allowed_roles('emr')}")

# Check if there are any duplicate keys in MODULE_PERMISSIONS or if something is overriding them
print("\nMODULE_PERMISSIONS keys:")
for k in MODULE_PERMISSIONS.keys():
    print(f"  {k}: {MODULE_PERMISSIONS[k]}")
