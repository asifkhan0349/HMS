from typing import Any, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user_service import user_service
from app.services.auth_service import get_current_user
from app.utils.exceptions import BadRequestException, NotFoundException

router = APIRouter()

@router.post("/", response_model=UserResponse)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user.
    """
    user = user_service.get_user_by_email(db, email=user_in.email)
    if user:
        raise BadRequestException(
            "The user with this email already exists in the system."
        )
    user = user_service.create_user(db, user_in=user_in)
    return user

@router.get("/me", response_model=UserResponse)
def read_user_me(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.get("/", response_model=List[UserResponse])
def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Retrieve users.
    """
    users = user_service.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=UserResponse)
def read_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get a specific user by id.
    """
    user = user_service.get_user_by_id(db, user_id=user_id)
    if not user:
        raise NotFoundException("User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a user.
    """
    user = user_service.get_user_by_id(db, user_id=user_id)
    if not user:
        raise NotFoundException("User not found")
    user = user_service.update_user(db, db_user=user, user_in=user_in)
    return user

@router.delete("/{user_id}", response_model=UserResponse)
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a user.
    """
    user = user_service.get_user_by_id(db, user_id=user_id)
    if not user:
        raise NotFoundException("User not found")
    user = user_service.remove_user(db, id=user_id)
    return user
