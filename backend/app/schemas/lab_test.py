from datetime import datetime
from typing import Optional
from pydantic import Field, ConfigDict
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

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        json_schema_extra={
            "example": {
                "id": 101,
                "test_code": "TST-E5F6G7H8",
                "patient_name": "Jane Smith",
                "test_name": "Complete Blood Count (CBC)",
                "doctor_name": "Dr. Gregory House",
                "status": "Pending",
                "created_at": "2026-06-03T15:44:43Z"
            }
        }
    )
