import asyncio
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, MessageType

from . import crud, schemas, models
from app.core.security import hash_password, verify_password, create_access_token

logger = logging.getLogger(__name__)

def normalize_username(username: str) -> str:
    return username.strip().lower()

def normalize_email(email: str) -> str:
    return email.strip().lower()

async def send_welcome_email(email: str, full_name: str):
    """
    Example of an asynchronous background task.
    In a real scenario, this could use FastMail or external APIs like SendGrid.
    """
    logger.info(f"Simulating welcome email generation for {email}...")
    await asyncio.sleep(2) # Simulate network delay
    logger.info(f"Successfully simulated welcome email to {full_name} at {email}")


def register_user(
    db: Session, 
    payload: schemas.SignupRequest, 
    background_tasks: BackgroundTasks
) -> schemas.AuthResponse:
    normalized_username = normalize_username(payload.username)
    normalized_email = normalize_email(payload.email)

    existing_user = crud.get_user_by_username_or_email(
        db, normalized_username, normalized_email
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with that username or email already exists.",
        )

    user = crud.create_user(
        db=db,
        full_name=payload.full_name,
        normalized_username=normalized_username,
        normalized_email=normalized_email,
        role=payload.role,
        password_hash=hash_password(payload.password)
    )
    
    # Trigger modular async background task
    background_tasks.add_task(send_welcome_email, user.email, user.full_name)

    token = create_access_token(user.id)
    return schemas.AuthResponse(message="Signup successful.", user=user, token=token)


def authenticate_user(db: Session, payload: schemas.LoginRequest) -> schemas.AuthResponse:
    normalized_username = normalize_username(payload.username)
    user = crud.get_user_by_username(db, normalized_username)
    
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )
    
    # Transparent Migration: If the password was verified using legacy PBKDF2, re-hash it with bcrypt
    if "$" in user.password_hash and not user.password_hash.startswith("$"):
        user.password_hash = hash_password(payload.password)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return schemas.AuthResponse(message="Login successful.", user=user, token=token)
