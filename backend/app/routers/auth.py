from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from .. import auth_context, models, schemas
from ..database import get_db
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def normalize_username(username: str) -> str:
    return username.strip().lower()


def normalize_email(email: str) -> str:
    return email.strip().lower()


@router.post("/signup", response_model=schemas.AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: schemas.SignupRequest, db: Session = Depends(get_db)):
    normalized_username = normalize_username(payload.username)
    normalized_email = normalize_email(payload.email)

    existing_user = (
        db.query(models.User)
        .filter(
            or_(
                func.lower(models.User.username) == normalized_username,
                func.lower(models.User.email) == normalized_email,
            )
        )
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with that username or email already exists.",
        )

    user = models.User(
        full_name=payload.full_name,
        username=normalized_username,
        email=normalized_email,
        role=payload.role,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return schemas.AuthResponse(message="Signup successful.", user=user, token=token)


@router.post("/login", response_model=schemas.AuthResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    normalized_username = normalize_username(payload.username)
    user = db.query(models.User).filter(func.lower(models.User.username) == normalized_username).first()
    
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


@router.patch("/profile", response_model=schemas.AuthResponse)
def update_profile(
    payload: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(auth_context.get_current_user_id),
):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated = False

    if payload.username:
        normalized_username = normalize_username(payload.username)
        if normalized_username != user.username:
            existing = db.query(models.User).filter(func.lower(models.User.username) == normalized_username).first()
            if existing:
                raise HTTPException(status_code=409, detail="Username already taken.")
            user.username = normalized_username
            updated = True

    if payload.email:
        normalized_email = normalize_email(payload.email)
        if normalized_email != user.email:
            existing = db.query(models.User).filter(func.lower(models.User.email) == normalized_email).first()
            if existing:
                raise HTTPException(status_code=409, detail="Email already taken.")
            user.email = normalized_email
            updated = True

    if payload.full_name is not None:
        full_name = payload.full_name.strip()
        if not full_name:
             raise HTTPException(status_code=400, detail="Full name cannot be empty.")
        user.full_name = full_name
        updated = True

    if updated:
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return schemas.AuthResponse(message="Profile updated successfully.", user=user, token=token)


@router.post("/change-password")
def change_password(
    payload: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(auth_context.get_current_user_id),
):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid current password.")

    if payload.new_password == payload.current_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password.")

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully. Please keep your new password safe."}
