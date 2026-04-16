from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .security import decode_access_token

security = HTTPBearer(auto_error=False)

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db)
) -> int:
    """Extract and validate the JWT from the Authorization header, and verify user exists."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed authorization header. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        user_id = decode_access_token(token)
        # Verify user still exists in the database
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account not found. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )


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
