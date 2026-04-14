from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field
from .base import ORMBase


class InvoiceBase(BaseModel):
    patient_name: str = Field(..., min_length=2, max_length=120)
    invoice_date: date
    amount: Decimal = Field(..., ge=0)
    status: str = Field(..., min_length=2, max_length=50)
    payment_method: str = Field(..., min_length=2, max_length=100)


class InvoiceCreate(InvoiceBase):
    invoice_code: Optional[str] = None


class InvoiceUpdate(BaseModel):
    invoice_code: Optional[str] = None
    patient_name: Optional[str] = Field(None, min_length=2, max_length=120)
    invoice_date: Optional[date] = None
    amount: Optional[Decimal] = Field(None, ge=0)
    status: Optional[str] = Field(None, min_length=2, max_length=50)
    payment_method: Optional[str] = Field(None, min_length=2, max_length=100)


class InvoiceRead(InvoiceBase, ORMBase):
    id: int
    invoice_code: str
    created_at: datetime
