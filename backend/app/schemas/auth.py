from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from .base import ORMBase


class UserRead(ORMBase):
    id: int
    full_name: str
    username: str
    email: str
    role: str
    created_at: datetime


class SignupRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(default="Admin", min_length=2, max_length=30)

    @field_validator("full_name", "username", "email", "role")
    @classmethod
    def strip_text_fields(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def strip_username(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value


class AuthResponse(BaseModel):
    message: str
    user: UserRead
    token: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=120)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[str] = Field(None, min_length=5, max_length=120)


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)
