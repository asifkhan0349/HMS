import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.security import hash_password, verify_password

def test_bcrypt():
    password = "testpassword123"
    hashed = hash_password(password)
    print(f"Bcrypt Hash: {hashed}")
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
    assert verify_password(password, hashed) == True
    assert verify_password("wrongpassword", hashed) == False
    print("Bcrypt Test Passed!")

def test_legacy_fallback():
    # Manual PBKDF2 hash (salt$hash)
    # salt: test_salt, password: legacy_pass
    # Using the same logic as the old security.py:
    import hashlib
    password = "legacy_pass"
    salt = "test_salt"
    hashed_legacy = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    ).hex()
    legacy_format = f"{salt}${hashed_legacy}"
    print(f"Legacy Hash: {legacy_format}")
    
    assert verify_password(password, legacy_format) == True
    assert verify_password("wrong_pass", legacy_format) == False
    print("Legacy Fallback Test Passed!")

if __name__ == "__main__":
    try:
        test_bcrypt()
        test_legacy_fallback()
        print("ALL SECURITY TESTS PASSED!")
    except Exception as e:
        print(f"TEST FAILED: {e}")
        sys.exit(1)
