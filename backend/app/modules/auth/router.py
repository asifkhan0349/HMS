from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from fastapi_mail import FastMail, ConnectionConfig, MessageSchema, MessageType
from sqlalchemy import func
import os

from app.core.database import get_db
from app.core.config import settings
from app.auth_context import get_raw_token_data
from app.token_blocklist import revoke_token
from app.routers.common import ResetToken
from app.core.limiter import limiter
from app.core.security import hash_password, create_access_token, create_reset_token, verify_reset_token
from app.auth_context import get_current_user_id

from . import schemas, services, crud

router = APIRouter(prefix="/auth", tags=["auth"])

# SMTP Configuration (kept in router for now, though better in config/core)
conf = ConnectionConfig(
    MAIL_USERNAME=os.environ.get("MAIL_USERNAME") or "",
    MAIL_PASSWORD=os.environ.get("MAIL_PASSWORD") or "",
    MAIL_FROM=os.environ.get("MAIL_FROM") or "hms@example.com",
    MAIL_PORT=int(os.environ.get("MAIL_PORT") or 587),
    MAIL_SERVER=os.environ.get("MAIL_SERVER") or "",
    MAIL_STARTTLS=os.environ.get("MAIL_STARTTLS", "True") == "True",
    MAIL_SSL_TLS=os.environ.get("MAIL_SSL_TLS", "False") == "True",
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

@router.post("/signup", response_model=schemas.AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def signup(request: Request, payload: schemas.SignupRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Delegated business logic to service layer
    return services.register_user(db=db, payload=payload, background_tasks=background_tasks)

@router.post("/login", response_model=schemas.AuthResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Delegated business logic to service layer
    return services.authenticate_user(db=db, payload=payload)

@router.post("/logout", response_model=schemas.MessageResponse)
def logout(token_info: tuple = Depends(get_raw_token_data)):
    """Revoke the current JWT so it cannot be reused, even before natural expiry."""
    jti, exp = token_info
    revoke_token(jti, exp)
    return schemas.MessageResponse(message="Logged out successfully.")

@router.patch("/profile", response_model=schemas.AuthResponse)
def update_profile(
    payload: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    user = crud.get_user_by_id(db, current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated = False

    if payload.username:
        normalized_username = services.normalize_username(payload.username)
        if normalized_username != user.username:
            existing = crud.get_user_by_username(db, normalized_username)
            if existing:
                raise HTTPException(status_code=409, detail="Username already taken.")
            user.username = normalized_username
            updated = True

    if payload.email:
        normalized_email = services.normalize_email(payload.email)
        if normalized_email != user.email:
            existing = crud.get_user_by_email(db, normalized_email)
            if existing:
                raise HTTPException(status_code=409, detail="Email already taken.")
            user.email = normalized_email
            updated = True

    if payload.full_name is not None:
        user.full_name = payload.full_name
        updated = True

    if updated:
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return schemas.AuthResponse(message="Profile updated successfully.", user=user, token=token)

@router.post("/change-password", response_model=schemas.MessageResponse)
def change_password(
    payload: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    from app.core.security import verify_password
    user = crud.get_user_by_id(db, current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid current password.")

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return schemas.MessageResponse(message="Password changed successfully. Please keep your new password safe.")

@router.post("/forgot-password", response_model=schemas.MessageResponse)
def forgot_password(
    payload: schemas.ForgotPasswordRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    normalized_email = services.normalize_email(payload.email)
    user = crud.get_user_by_email(db, normalized_email)
    
    if user:
        token = create_reset_token(email=user.email)
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        
        print(f"\n--- PASSWORD RESET LINK FOR {user.email} ---")
        print(reset_link)
        print("---------------------------------------------\n")
        
        try:
            if conf.MAIL_USERNAME and conf.MAIL_PASSWORD and conf.MAIL_SERVER:
                message = MessageSchema(
                    subject="Password Reset",
                    recipients=[user.email],
                    body=f"Click the link to reset your password: {reset_link}",
                    subtype=MessageType.plain
                )
                fm = FastMail(conf)
                background_tasks.add_task(fm.send_message, message)
        except Exception as e:
            print(f"WARNING: FastMail failed to schedule/send email: {e}")
            
    return schemas.MessageResponse(message="If an account with that email exists, a password reset link has been sent.")

@router.post("/reset-password/{token}", response_model=schemas.MessageResponse)
def reset_password(token: ResetToken, payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    email = verify_reset_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
        
    user = crud.get_user_by_email(db, services.normalize_email(email))
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return schemas.MessageResponse(message="Password has been successfully reset.")
