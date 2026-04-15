from datetime import date, datetime
from typing import Optional
from pydantic import Field
from .base import AppBaseModel, ORMBase


class MedicalRecordBase(AppBaseModel):
    clinical_id: Optional[str] = None
    record_date: date
    patient_name: str = Field(..., min_length=2, max_length=120)
    doctor_name: str = Field(..., min_length=2, max_length=120)
    diagnosis: str = Field(..., min_length=2)
    prescription: str = Field(..., min_length=2)


class MedicalRecordCreate(MedicalRecordBase):
    record_code: Optional[str] = None


class MedicalRecordUpdate(AppBaseModel):
    record_code: Optional[str] = None
    clinical_id: Optional[str] = None
    record_date: Optional[date] = None
    patient_name: Optional[str] = Field(None, min_length=2, max_length=120)
    doctor_name: Optional[str] = Field(None, min_length=2, max_length=120)
    diagnosis: Optional[str] = Field(None, min_length=2)
    prescription: Optional[str] = Field(None, min_length=2)


class MedicalRecordRead(MedicalRecordBase, ORMBase):
    id: int
    record_code: str
    created_at: datetime
