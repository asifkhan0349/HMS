from datetime import datetime
from typing import Optional
from pydantic import Field, field_serializer
from .base import AppBaseModel, ORMBase


class AppointmentBase(AppBaseModel):
    patient_name: str = Field(..., min_length=2, max_length=120)
    doctor_name: str = Field(..., min_length=2, max_length=120)
    scheduled_time: datetime
    appointment_type: str = Field(..., min_length=2, max_length=100)
    status: str = Field(..., min_length=2, max_length=50)


class AppointmentCreate(AppointmentBase):
    appointment_code: Optional[str] = None


class AppointmentUpdate(AppBaseModel):
    appointment_code: Optional[str] = None
    patient_name: Optional[str] = Field(None, min_length=2, max_length=120)
    doctor_name: Optional[str] = Field(None, min_length=2, max_length=120)
    scheduled_time: Optional[datetime] = None
    appointment_type: Optional[str] = Field(None, min_length=2, max_length=100)
    status: Optional[str] = Field(None, min_length=2, max_length=50)


class AppointmentRead(AppointmentBase, ORMBase):
    id: int
    appointment_code: str
    created_at: datetime
    
    @field_serializer("scheduled_time", "created_at")
    def serialize_dt(self, dt: datetime, _info):
        return dt.isoformat() if dt.tzinfo else f"{dt.isoformat()}Z"
