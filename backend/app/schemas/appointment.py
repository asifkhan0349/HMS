from datetime import date, datetime
from typing import Optional
from pydantic import Field, field_serializer, model_validator
from .base import AppBaseModel, ORMBase


class AppointmentBase(AppBaseModel):
    patient_name: str = Field(..., min_length=2, max_length=120)
    patient_date_of_birth: Optional[date] = None
    patient_age: Optional[int] = Field(None, ge=0, le=130)
    patient_gender: Optional[str] = Field(None, min_length=2, max_length=20)
    patient_address: Optional[str] = Field(None, max_length=255)
    appointment_date: date
    appointment_type: str = Field(..., min_length=2, max_length=100)
    status: str = "Pending"
    telegram_chat_id: Optional[str] = Field(None, max_length=50)
    phone_number: Optional[str] = Field(None, max_length=20)
    time_slot: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = Field(None, max_length=100)

    @model_validator(mode="after")
    def validate_age_or_dob(self):
        if self.patient_date_of_birth is None and self.patient_age is None:
            raise ValueError("Either patient_date_of_birth or patient_age is required.")
        return self


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentPublicCreate(AppBaseModel):
    """Schema for the unauthenticated public booking endpoint.
    The `status` field is intentionally omitted — it is always set to 'pending'.
    """
    patient_name: str = Field(..., min_length=2, max_length=120)
    patient_date_of_birth: Optional[date] = None
    patient_age: Optional[int] = Field(None, ge=0, le=130)
    patient_gender: Optional[str] = Field(None, min_length=2, max_length=20)
    patient_address: Optional[str] = Field(None, max_length=255)
    appointment_date: date
    appointment_type: str = Field(..., min_length=2, max_length=100)
    telegram_chat_id: Optional[str] = Field(None, max_length=50)
    phone_number: Optional[str] = Field(None, max_length=20)
    time_slot: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = Field(None, max_length=100)

    @model_validator(mode="after")
    def validate_age_or_dob(self):
        if self.patient_date_of_birth is None and self.patient_age is None:
            raise ValueError("Either patient_date_of_birth or patient_age is required.")
        return self


class AppointmentUpdate(AppBaseModel):
    patient_name: Optional[str] = Field(None, min_length=2, max_length=120)
    patient_date_of_birth: Optional[date] = None
    patient_age: Optional[int] = Field(None, ge=0, le=130)
    patient_gender: Optional[str] = Field(None, min_length=2, max_length=20)
    patient_address: Optional[str] = Field(None, max_length=255)
    appointment_date: Optional[date] = None
    appointment_type: Optional[str] = Field(None, min_length=2, max_length=100)
    status: Optional[str] = None
    telegram_chat_id: Optional[str] = Field(None, max_length=50)
    phone_number: Optional[str] = Field(None, max_length=20)
    time_slot: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = Field(None, max_length=100)


class AppointmentRead(ORMBase):
    id: int
    patient_name: str = Field(..., min_length=2, max_length=120)
    patient_date_of_birth: Optional[date] = None
    patient_age: Optional[int] = Field(None, ge=0, le=130)
    patient_gender: Optional[str] = Field(None, min_length=2, max_length=20)
    patient_address: Optional[str] = Field(None, max_length=255)
    appointment_date: date
    appointment_type: str = Field(..., min_length=2, max_length=100)
    status: str
    telegram_chat_id: Optional[str] = None
    phone_number: Optional[str] = None
    time_slot: Optional[str] = None
    department: Optional[str] = None
    created_at: datetime
    
    @field_serializer("created_at")
    def serialize_dt(self, dt: datetime, _info):
        return dt.isoformat() if dt.tzinfo else f"{dt.isoformat()}Z"
