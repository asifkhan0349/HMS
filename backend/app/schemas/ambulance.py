from datetime import datetime
from typing import Optional
from pydantic import Field
from .base import AppBaseModel, ORMBase


class AmbulanceBase(AppBaseModel):
    vehicle_number: str = Field(..., min_length=2, max_length=20)
    type: str = Field(..., min_length=2, max_length=50)
    status: str = Field("Available", min_length=2, max_length=30)
    driver_name: Optional[str] = Field(None, max_length=120)
    driver_contact: Optional[str] = Field(None, max_length=20)
    paramedic_name: Optional[str] = Field(None, max_length=120)
    equipment_checklist: Optional[str] = Field(None, max_length=255)
    current_trip_patient: Optional[str] = Field(None, max_length=120)
    current_trip_destination: Optional[str] = Field(None, max_length=255)


class AmbulanceCreate(AmbulanceBase):
    pass


class AmbulanceUpdate(AppBaseModel):
    vehicle_number: Optional[str] = Field(None, min_length=2, max_length=20)
    type: Optional[str] = Field(None, min_length=2, max_length=50)
    status: Optional[str] = Field(None, min_length=2, max_length=30)
    driver_name: Optional[str] = Field(None, max_length=120)
    driver_contact: Optional[str] = Field(None, max_length=20)
    paramedic_name: Optional[str] = Field(None, max_length=120)
    equipment_checklist: Optional[str] = Field(None, max_length=255)
    current_trip_patient: Optional[str] = Field(None, max_length=120)
    current_trip_destination: Optional[str] = Field(None, max_length=255)


class AmbulanceRead(AmbulanceBase, ORMBase):
    id: int
    ambulance_code: str
    created_at: datetime


class AmbulanceTripBase(AppBaseModel):
    ambulance_id: int
    ambulance_code: str
    vehicle_number: str
    patient_name: str
    destination: str
    driver_name: Optional[str] = None
    paramedic_name: Optional[str] = None


class AmbulanceTripCreate(AmbulanceTripBase):
    pass


class AmbulanceTripRead(AmbulanceTripBase, ORMBase):
    id: int
    completed_at: datetime

