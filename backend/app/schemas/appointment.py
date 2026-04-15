from datetime import date, datetime
from typing import Optional
from pydantic import Field, field_serializer, model_validator
from .base import AppBaseModel, ORMBase


class AppointmentBase(AppBaseModel):
    patient_name: str = Field(..., min_length=2, max_length=120)
    patient_date_of_birth: Optional[date] = None
    patient_age: Optional[int] = Field(None, ge=0, le=130)
    patient_gender: str = Field(..., min_length=2, max_length=20)
    patient_mobile: Optional[str] = Field(None, max_length=20)
    patient_email: Optional[str] = Field(None, max_length=120)
    patient_address: Optional[str] = Field(None, max_length=255)
    department: str = Field(..., min_length=2, max_length=100)
    doctor_name: str = Field("", max_length=120)
    scheduled_time: datetime
    appointment_type: str = Field(..., min_length=2, max_length=100)
    status: str = Field(..., min_length=2, max_length=50)

    @model_validator(mode="after")
    def validate_age_or_dob(self):
        if self.patient_date_of_birth is None and self.patient_age is None:
            raise ValueError("Either patient_date_of_birth or patient_age is required.")
        return self


class AppointmentCreate(AppointmentBase):
    appointment_code: Optional[str] = None


class AppointmentUpdate(AppBaseModel):
    appointment_code: Optional[str] = None
    patient_name: Optional[str] = Field(None, min_length=2, max_length=120)
    patient_date_of_birth: Optional[date] = None
    patient_age: Optional[int] = Field(None, ge=0, le=130)
    patient_gender: Optional[str] = Field(None, min_length=2, max_length=20)
    patient_mobile: Optional[str] = Field(None, min_length=10, max_length=20)
    patient_email: Optional[str] = Field(None, max_length=120)
    patient_address: Optional[str] = Field(None, max_length=255)
    department: Optional[str] = Field(None, min_length=2, max_length=100)
    doctor_name: Optional[str] = Field(None, max_length=120)
    scheduled_time: Optional[datetime] = None
    appointment_type: Optional[str] = Field(None, min_length=2, max_length=100)
    status: Optional[str] = Field(None, min_length=2, max_length=50)


class AppointmentRead(ORMBase):
    id: int
    appointment_code: str
    patient_name: str = Field(..., min_length=2, max_length=120)
    patient_date_of_birth: Optional[date] = None
    patient_age: Optional[int] = Field(None, ge=0, le=130)
    patient_gender: Optional[str] = Field(None, min_length=2, max_length=20)
    patient_mobile: Optional[str] = Field(None, min_length=10, max_length=20)
    patient_email: Optional[str] = Field(None, max_length=120)
    patient_address: Optional[str] = Field(None, max_length=255)
    department: Optional[str] = Field(None, min_length=2, max_length=100)
    doctor_name: Optional[str] = Field(None, max_length=120)
    scheduled_time: datetime
    appointment_type: str = Field(..., min_length=2, max_length=100)
    status: str = Field(..., min_length=2, max_length=50)
    created_at: datetime
    
    @field_serializer("scheduled_time", "created_at")
    def serialize_dt(self, dt: datetime, _info):
        return dt.isoformat() if dt.tzinfo else f"{dt.isoformat()}Z"
