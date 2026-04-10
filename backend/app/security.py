import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

# ---------------------------------------------------------------------------
# Secret key — read from environment in production, use a safe dev default.
# ---------------------------------------------------------------------------
SECRET_KEY = os.environ.get(
    "HMS_SECRET_KEY",
    "dev-insecure-secret-change-me-in-production-please",
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 h


from passlib.context import CryptContext

# ---------------------------------------------------------------------------
# Password hashing context (using bcrypt with support for legacy PBKDF2)
# ---------------------------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """
    Verify a password. Supports bcrypt and legacy PBKDF2.
    Legacy format: salt$hashed (PBKDF2-HMAC-SHA256)
    """
    # Detect legacy PBKDF2 format (salt$hash)
    if "$" in password_hash and not password_hash.startswith("$"):
        try:
            salt, stored_hash = password_hash.split("$", 1)
            computed_hash = hashlib.pbkdf2_hmac(
                "sha256",
                password.encode("utf-8"),
                salt.encode("utf-8"),
                100000,
            ).hex()
            return hmac.compare_digest(stored_hash, computed_hash)
        except Exception:
            return False

    # Otherwise use passlib (bcrypt)
    try:
        return pwd_context.verify(password, password_hash)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def create_access_token(user_id: int) -> str:
    """Create a signed JWT containing the user ID as subject and a unique JTI."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "jti": str(uuid.uuid4())
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> int:
    """Decode a JWT and return the user ID.  Raises JWTError on failure."""
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id_str: str | None = payload.get("sub")
    if user_id_str is None:
        raise JWTError("Token payload missing 'sub'.")
    return int(user_id_str)


def create_reset_token(email: str) -> str:
    """Create a short-lived unique token for password reset."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    payload = {
        "sub": email,
        "exp": expire,
        "type": "reset_password",
        "jti": str(uuid.uuid4())
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_reset_token(token: str) -> str | None:
    """Verify reset token and return email if valid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "reset_password":
            return None
        return payload.get("sub")
    except JWTError:
        return None
