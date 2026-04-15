from datetime import datetime
from typing import Optional
from pydantic import Field
from .base import AppBaseModel, ORMBase


class StaffBase(AppBaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    role: str = Field(..., min_length=2, max_length=100)
    department: str = Field(..., min_length=2, max_length=100)
    shift: str = Field(..., min_length=2, max_length=50)
    status: str = Field(..., min_length=2, max_length=50)


class StaffCreate(StaffBase):
    staff_code: Optional[str] = None


class StaffUpdate(AppBaseModel):
    staff_code: Optional[str] = None
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    role: Optional[str] = Field(None, min_length=2, max_length=100)
    department: Optional[str] = Field(None, min_length=2, max_length=100)
    shift: Optional[str] = Field(None, min_length=2, max_length=50)
    status: Optional[str] = Field(None, min_length=2, max_length=50)


class StaffRead(StaffBase, ORMBase):
    id: int
    staff_code: str
    created_at: datetime
