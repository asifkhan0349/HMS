from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.config import settings
from app.database.connection import get_db
from app.models.user import User
from app.schemas.user import TokenPayload
from app.utils.exceptions import UnauthorizedException
from app.services.user_service import user_service

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except JWTError:
        raise UnauthorizedException("Could not validate credentials")
    
    user = user_service.get_user_by_id(db, user_id=int(token_data.sub))
    if not user:
        raise UnauthorizedException("User not found")
    if not user.is_active:
        raise UnauthorizedException("Inactive user")
    return user
