import sys
import os
import json

sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.main import app

def check_openapi():
    # Force openapi regeneration for our test by clearing the cache
    app.openapi_schema = None
    openapi = app.openapi()
    
    patients = openapi['paths'].get('/api/patients', {}).get('post', {})
    auth = openapi['paths'].get('/api/auth/login', {}).get('post', {})
    
    print("--- /api/patients (POST) ---")
    print(json.dumps(patients.get('parameters', []), indent=2))
    
    print("\n--- /api/auth/login (POST) ---")
    print(json.dumps(auth.get('parameters', []), indent=2))

if __name__ == "__main__":
    check_openapi()
