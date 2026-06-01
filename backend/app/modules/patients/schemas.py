from datetime import date, datetime
from typing import Optional
from pydantic import Field
from enum import Enum
from app.schemas.base import AppBaseModel, ORMBase, MessageResponse

class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"

class BloodGroup(str, Enum):
    A_PLUS = "A+"
    A_MINUS = "A-"
    B_PLUS = "B+"
    B_MINUS = "B-"
    AB_PLUS = "AB+"
    AB_MINUS = "AB-"
    O_PLUS = "O+"
    O_MINUS = "O-"

class PatientBase(AppBaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    age: int = Field(..., ge=0, le=130)
    gender: Gender
    blood_group: BloodGroup
    last_visit: Optional[date] = None
    status: str = Field(..., min_length=2, max_length=50)

class PatientCreate(PatientBase):
    patient_code: Optional[str] = None
    phone_number: str = Field(..., min_length=7, max_length=20)
    email: Optional[str] = Field(None, max_length=120)
    emergency_contact_1: Optional[str] = Field(None, min_length=7, max_length=20)
    emergency_contact_2: Optional[str] = Field(None, min_length=7, max_length=20)
    booking_id: Optional[str] = None
    address: Optional[str] = Field(None, max_length=255)
    doctor_name: Optional[str] = Field(None, max_length=120)
    appointment_date: Optional[date] = None

class PatientUpdate(AppBaseModel):
    patient_code: Optional[str] = None
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[Gender] = None
    blood_group: Optional[BloodGroup] = None
    phone_number: Optional[str] = Field(None, min_length=7, max_length=20)
    email: Optional[str] = Field(None, max_length=120)
    emergency_contact_1: Optional[str] = Field(None, min_length=7, max_length=20)
    emergency_contact_2: Optional[str] = Field(None, min_length=7, max_length=20)
    last_visit: Optional[date] = None
    status: Optional[str] = Field(None, min_length=2, max_length=50)
    booking_id: Optional[str] = None
    address: Optional[str] = Field(None, max_length=255)
    doctor_name: Optional[str] = Field(None, max_length=120)
    appointment_date: Optional[date] = None

class PatientRead(ORMBase):
    id: int
    patient_code: str
    name: str
    age: int
    gender: Gender
    blood_group: BloodGroup
    phone_number: Optional[str] = None
    email: Optional[str] = None
    emergency_contact_1: Optional[str] = None
    emergency_contact_2: Optional[str] = None
    last_visit: Optional[date] = None
    status: str
    created_at: datetime
    booking_id: Optional[str] = None
    address: Optional[str] = None
    doctor_name: Optional[str] = None
    appointment_date: Optional[date] = None
