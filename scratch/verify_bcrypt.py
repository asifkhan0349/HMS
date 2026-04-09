import sys
import os

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from app.security import hash_password, verify_password
    
    password = "testpassword123"
    hashed = hash_password(password)
    print(f"Hashed: {hashed}")
    
    # Bcrypt hashes usually start with $2b$ or $2a$
    if hashed.startswith("$2"):
        print("Success: Uses Bcrypt format")
    else:
        print("Failure: Does not use Bcrypt format")
        
    is_valid = verify_password(password, hashed)
    print(f"Verification: {'Success' if is_valid else 'Failure'}")
    
    is_invalid = verify_password("wrongpassword", hashed)
    print(f"Negative Verification: {'Success' if not is_invalid else 'Failure'}")

except Exception as e:
    print(f"Error: {e}")
