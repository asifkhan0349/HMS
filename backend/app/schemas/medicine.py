from datetime import date, datetime
from typing import Optional
from pydantic import Field
from .base import AppBaseModel, ORMBase


class MedicineBase(AppBaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    batch: str = Field(..., min_length=1, max_length=50)
    stock: int = Field(..., ge=0)
    expiry_date: date
    status: str = Field(..., min_length=2, max_length=50)


class MedicineCreate(MedicineBase):
    medicine_code: Optional[str] = None


class MedicineUpdate(AppBaseModel):
    medicine_code: Optional[str] = None
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    batch: Optional[str] = Field(None, min_length=1, max_length=50)
    stock: Optional[int] = Field(None, ge=0)
    expiry_date: Optional[date] = None
    status: Optional[str] = Field(None, min_length=2, max_length=50)


class MedicineRead(MedicineBase, ORMBase):
    id: int
    medicine_code: str
    created_at: datetime
