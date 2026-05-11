from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session

from .core.database import get_db
from .models import User
from .core.security import decode_access_token
from .token_blocklist import is_token_revoked

security = HTTPBearer(auto_error=False)

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db)
) -> int:
    """Extract and validate the JWT from the Authorization header, verify user exists,
    and check against the revocation blocklist."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed authorization header. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        token_data = decode_access_token(token)

        # Check if this specific token has been revoked (e.g., via logout)
        if is_token_revoked(token_data.jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verify user still exists in the database
        user = db.query(User).filter(User.id == token_data.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account not found. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return token_data.user_id
    except HTTPException:
        raise
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_raw_token_data(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> tuple[str, int]:
    """Return (jti, exp) from a valid JWT — used by the logout endpoint."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    try:
        token_data = decode_access_token(credentials.credentials)
        return token_data.jti, token_data.exp
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")


def get_current_user(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
) -> User:
    """Retrieve the full user object from the database."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure the current user has the 'Admin' role."""
    # Check disabled per user request
    return user


def require_roles(allowed: list[str]):
    """
    Factory that returns a FastAPI dependency enforcing a role whitelist.

    Usage::

        @router.get("/", dependencies=[Depends(require_roles(['Admin', 'Doctor']))])
        def my_endpoint(): ...

    Or as a router-level dependency::

        router = APIRouter(dependencies=[Depends(require_roles(['Admin', 'Nurse']))])
    """
    def _check(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Allowed roles: {', '.join(allowed)}.",
            )
        return user
    return _check


def exclude_roles(excluded: list[str]):
    """
    Factory that returns a FastAPI dependency enforcing a role blocklist.
    """
    def _check(user: User = Depends(get_current_user)) -> User:
        if user.role in excluded:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Role '{user.role}' is not permitted to perform this action.",
            )
        return user
    return _check


def get_patient_name_filter(
    user: User = Depends(get_current_user),
) -> str | None:
    """Return the current user's full_name when they are a Patient, else None.

    Endpoints that list records shared across all staff use this to restrict
    Patient accounts to rows that belong to them only (matched by patient_name
    or equivalent name column).  Non-patient callers receive None, meaning no
    extra name-based filter is applied.
    """
    if user.role == "Patient":
        return user.full_name
    return None

def get_owner_id_for_filtering(
    user: User = Depends(get_current_user),
) -> int | None:
    """Return None if user is an Admin (sees all data), else return user's ID."""
    if user.role == "Admin":
        return None
    return user.id

def get_pharmacy_owner_id_filter(
    user: User = Depends(get_current_user),
) -> int | None:
    """Return None for pharmacy roles that share inventory data."""
    if user.role in ["Admin", "Nurse", "Reception"]:
        return None
    return user.id

def get_shared_staff_owner_id_filter(
    user: User = Depends(get_current_user),
) -> int | None:
    """Return None for staff roles that share operational data."""
    if user.role in ["Admin", "Doctor", "Nurse", "Reception"]:
        return None
    return user.id

def get_blood_bank_owner_id_filter(
    user: User = Depends(get_current_user),
) -> int | None:
    """Return None if user is Admin, Doctor, Nurse, or Reception (shared access), else return user's ID."""
    if user.role in ["Admin", "Doctor", "Nurse", "Reception"]:
        return None
    return user.id

def get_facility_logistics_owner_id_filter(
    user: User = Depends(get_current_user),
) -> int | None:
    """Return None for roles that share facility and logistics data."""
    if user.role in ["Admin", "Nurse", "Reception"]:
        return None
    return user.id
