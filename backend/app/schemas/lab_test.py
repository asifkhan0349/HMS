from datetime import datetime
from typing import Optional
from pydantic import Field
from .base import AppBaseModel, ORMBase


class LabTestBase(AppBaseModel):
    patient_name: str = Field(..., min_length=2, max_length=120)
    test_name: str = Field(..., min_length=2, max_length=150)
    doctor_name: str = Field(..., min_length=2, max_length=120)
    status: str = Field(..., min_length=2, max_length=50)


class LabTestCreate(LabTestBase):
    test_code: Optional[str] = None


class LabTestUpdate(AppBaseModel):
    test_code: Optional[str] = None
    patient_name: Optional[str] = Field(None, min_length=2, max_length=120)
    test_name: Optional[str] = Field(None, min_length=2, max_length=150)
    doctor_name: Optional[str] = Field(None, min_length=2, max_length=120)
    status: Optional[str] = Field(None, min_length=2, max_length=50)


class LabTestRead(LabTestBase, ORMBase):
    id: int
    test_code: str
    created_at: datetime
