from datetime import date, datetime
from typing import Optional
from pydantic import Field
from enum import Enum
from .base import AppBaseModel, ORMBase


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


class PatientUpdate(AppBaseModel):
    patient_code: Optional[str] = None
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[Gender] = None
    blood_group: Optional[BloodGroup] = None
    phone_number: Optional[str] = Field(None, min_length=7, max_length=20)
    email: Optional[str] = Field(None, max_length=120)
    last_visit: Optional[date] = None
    status: Optional[str] = Field(None, min_length=2, max_length=50)


class PatientRead(ORMBase):
    id: int
    patient_code: str
    name: str
    age: int
    gender: Gender
    blood_group: BloodGroup
    phone_number: Optional[str] = None
    email: Optional[str] = None
    last_visit: Optional[date] = None
    status: str
    created_at: datetime
