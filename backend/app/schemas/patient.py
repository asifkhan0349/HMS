from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum
from .base import ORMBase


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


class PatientBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    age: int = Field(..., ge=0, le=130)
    gender: Gender
    blood_group: BloodGroup
    last_visit: Optional[date] = None
    status: str = Field(..., min_length=2, max_length=50)


class PatientCreate(PatientBase):
    patient_code: Optional[str] = None


class PatientUpdate(BaseModel):
    patient_code: Optional[str] = None
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[Gender] = None
    blood_group: Optional[BloodGroup] = None
    last_visit: Optional[date] = None
    status: Optional[str] = Field(None, min_length=2, max_length=50)


class PatientRead(PatientBase, ORMBase):
    id: int
    patient_code: str
    created_at: datetime
