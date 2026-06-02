from datetime import date, datetime
from typing import Optional
from pydantic import Field
from .base import AppBaseModel, ORMBase


class DischargeSummaryBase(AppBaseModel):
    patient_name: str = Field(..., min_length=2, max_length=120)
    admission_date: Optional[date] = None
    discharge_date: Optional[date] = None
    attending_doctor: Optional[str] = Field(None, max_length=120)
    diagnosis: Optional[str] = Field(None, max_length=255)
    hospital_course: Optional[str] = Field(None, max_length=1000)
    discharge_medications: Optional[str] = Field(None, max_length=1000)
    discharge_condition: Optional[str] = Field(None, max_length=120)
    follow_up_instructions: Optional[str] = Field(None, max_length=1000)


class DischargeSummaryCreate(DischargeSummaryBase):
    discharge_code: Optional[str] = None


class DischargeSummaryUpdate(AppBaseModel):
    discharge_code: Optional[str] = None
    patient_name: Optional[str] = Field(None, min_length=2, max_length=120)
    admission_date: Optional[date] = None
    discharge_date: Optional[date] = None
    attending_doctor: Optional[str] = Field(None, max_length=120)
    diagnosis: Optional[str] = Field(None, max_length=255)
    hospital_course: Optional[str] = Field(None, max_length=1000)
    discharge_medications: Optional[str] = Field(None, max_length=1000)
    discharge_condition: Optional[str] = Field(None, max_length=120)
    follow_up_instructions: Optional[str] = Field(None, max_length=1000)


class DischargeSummaryRead(DischargeSummaryBase, ORMBase):
    id: int
    discharge_code: str
    created_at: datetime
