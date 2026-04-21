from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional

from . import models

def get_user_by_username_or_email(
    db: Session, 
    normalized_username: str, 
    normalized_email: str
) -> Optional[models.User]:
    return (
        db.query(models.User)
        .filter(
            or_(
                func.lower(models.User.username) == normalized_username,
                func.lower(models.User.email) == normalized_email,
            )
        )
        .first()
    )

def get_user_by_username(db: Session, normalized_username: str) -> Optional[models.User]:
    return db.query(models.User).filter(func.lower(models.User.username) == normalized_username).first()

def get_user_by_email(db: Session, normalized_email: str) -> Optional[models.User]:
    return db.query(models.User).filter(func.lower(models.User.email) == normalized_email).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(
    db: Session, 
    full_name: str, 
    normalized_username: str, 
    normalized_email: str, 
    role: str, 
    password_hash: str
) -> models.User:
    user = models.User(
        full_name=full_name,
        username=normalized_username,
        email=normalized_email,
        role=role,
        password_hash=password_hash,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
