import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import NamedTuple

from jose import JWTError, jwt

# ---------------------------------------------------------------------------
# Secret key — read from environment in production, use a safe dev default.
# ---------------------------------------------------------------------------
from .config import settings

SECRET_KEY = settings.HMS_SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES


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

class TokenData(NamedTuple):
    """Decoded token payload."""
    user_id: int
    jti: str
    exp: int


def create_access_token(user_id: int) -> str:
    """Create a signed JWT with a unique JTI claim for per-token revocation."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    jti = uuid.uuid4().hex
    payload = {"sub": str(user_id), "exp": expire, "jti": jti}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> TokenData:
    """Decode a JWT and return TokenData. Raises JWTError on failure."""
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id_str: str | None = payload.get("sub")
    jti: str | None = payload.get("jti")
    if user_id_str is None or jti is None:
        raise JWTError("Token payload missing required claims.")
    return TokenData(user_id=int(user_id_str), jti=jti, exp=int(payload["exp"]))


def create_reset_token(email: str) -> str:
    """Create a short-lived token for password reset."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    payload = {"sub": email, "exp": expire, "type": "reset_password"}
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
