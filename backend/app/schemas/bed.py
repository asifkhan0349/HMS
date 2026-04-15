from datetime import datetime
from typing import Optional
from pydantic import Field
from .base import AppBaseModel, ORMBase


class BedBase(AppBaseModel):
    bed_number: str = Field(..., min_length=1, max_length=20)
    ward_name: str = Field(..., min_length=2, max_length=100)
    type: str = Field(..., min_length=2, max_length=50)
    status: str = Field(..., min_length=2, max_length=50)


class BedCreate(BedBase):
    pass


class BedUpdate(AppBaseModel):
    bed_number: Optional[str] = Field(None, min_length=1, max_length=20)
    ward_name: Optional[str] = Field(None, min_length=2, max_length=100)
    type: Optional[str] = Field(None, min_length=2, max_length=50)
    status: Optional[str] = Field(None, min_length=2, max_length=50)


class BedRead(BedBase, ORMBase):
    id: int
    created_at: datetime
