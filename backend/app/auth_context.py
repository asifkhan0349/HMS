from fastapi import Depends, HTTPException, status, Header
from jose import JWTError
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .security import decode_access_token

def get_current_user_id(
    authorization: str | None = Header(default=None, description="Format: Bearer <token>"),
    db: Session = Depends(get_db)
) -> int:
    """Extract and validate the JWT from the Authorization header, and verify user exists."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed authorization header. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ")[1]

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
