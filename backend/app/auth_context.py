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


from .core.permissions import get_allowed_roles

def require_role(allowed_roles: list[str] | str):
    """
    Dependency factory to restrict access to specific roles.
    Can take a list of roles or a resource name string for centralized lookup.
    """
    if isinstance(allowed_roles, str):
        roles_list = get_allowed_roles(allowed_roles)
    else:
        roles_list = allowed_roles

    def role_checker(user: User = Depends(get_current_user)):
        if user.role.lower() not in [role.lower() for role in roles_list]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: You do not have the required permissions. Required roles: {', '.join(roles_list)}"
            )
        return user
    return role_checker
