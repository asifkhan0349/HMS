from datetime import datetime
from typing import Optional
from pydantic import Field
from .base import AppBaseModel, ORMBase


class BloodInventoryBase(AppBaseModel):
    blood_group: str = Field(..., min_length=2, max_length=5)
    units: int = Field(default=0, ge=0)
    status: str = Field(..., min_length=2, max_length=50)
    trend: str = Field(default="Stable", min_length=2, max_length=50)


class BloodInventoryCreate(BloodInventoryBase):
    pass


class BloodInventoryUpdate(AppBaseModel):
    blood_group: Optional[str] = Field(None, min_length=2, max_length=5)
    units: Optional[int] = Field(None, ge=0)
    status: Optional[str] = Field(None, min_length=2, max_length=50)
    trend: Optional[str] = Field(None, min_length=2, max_length=50)


class BloodInventoryRead(BloodInventoryBase, ORMBase):
    id: int
    updated_at: datetime


class BloodActivityBase(AppBaseModel):
    type: str = Field(..., min_length=2, max_length=50)  # "Donation" or "Usage"
    blood_group: str = Field(..., min_length=2, max_length=5)
    units: int = Field(..., gt=0)
    donor_name: str = Field(..., min_length=2, max_length=120)
    date: datetime = Field(default_factory=datetime.now)
    sample_id: Optional[str] = Field(None, max_length=50)


class BloodActivityCreate(BloodActivityBase):
    pass


class BloodActivityUpdate(AppBaseModel):
    type: Optional[str] = Field(None, min_length=2, max_length=50)
    blood_group: Optional[str] = Field(None, min_length=2, max_length=5)
    units: Optional[int] = Field(None, gt=0)
    donor_name: Optional[str] = Field(None, min_length=2, max_length=120)
    date: Optional[datetime] = None
    sample_id: Optional[str] = Field(None, max_length=50)


class BloodActivityRead(BloodActivityBase, ORMBase):
    id: int
