from datetime import datetime
from typing import Optional

from pydantic import Field, model_validator
from pydantic import BaseModel, ConfigDict

# Using AppBaseModel and ORMBase from existing schemas to avoid breaking things,
# but we can explicitly define them here if we want true modularity.
from app.schemas.base import AppBaseModel, ORMBase, MessageResponse

class UserRead(ORMBase):
    id: int
    full_name: str
    username: str
    email: str
    role: str
    staff_id: Optional[str] = None
    created_at: datetime


class SignupRequest(AppBaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(default="Admin", min_length=2, max_length=30)  # Supported roles: Admin, Doctor, Nurse, Reception, Patient
    staff_id: Optional[str] = Field(None, max_length=20)


class LoginRequest(AppBaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)


class AuthResponse(AppBaseModel):
    message: str
    user: UserRead
    token: str


class ProfileUpdate(AppBaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=120)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[str] = Field(None, min_length=5, max_length=120)

    @model_validator(mode="after")
    def validate_any_field_present(self):
        if not any(value is not None for value in (self.full_name, self.username, self.email)):
            raise ValueError("At least one profile field must be provided.")
        return self


class PasswordChange(AppBaseModel):
    current_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)

    @model_validator(mode="after")
    def ensure_new_password_differs(self):
        if self.new_password == self.current_password:
            raise ValueError("New password must be different from current password.")
        return self


class ForgotPasswordRequest(AppBaseModel):
    email: str = Field(..., min_length=5, max_length=120)


class ResetPasswordRequest(AppBaseModel):
    new_password: str = Field(..., min_length=8, max_length=128)
