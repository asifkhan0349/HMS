from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import Field
from .base import AppBaseModel, ORMBase


class InvoiceBase(AppBaseModel):
    patient_name: str = Field(..., min_length=2, max_length=120)
    invoice_date: date
    amount: Decimal = Field(..., ge=0)
    status: str = Field(..., min_length=2, max_length=50)
    payment_method: str = Field(..., min_length=2, max_length=100)


class InvoiceCreate(InvoiceBase):
    invoice_code: Optional[str] = None
    line_items: Optional[List[Any]] = None


class InvoiceUpdate(AppBaseModel):
    invoice_code: Optional[str] = None
    patient_name: Optional[str] = Field(None, min_length=2, max_length=120)
    invoice_date: Optional[date] = None
    amount: Optional[Decimal] = Field(None, ge=0)
    status: Optional[str] = Field(None, min_length=2, max_length=50)
    payment_method: Optional[str] = Field(None, min_length=2, max_length=100)
    line_items: Optional[List[Any]] = None


class InvoiceRead(InvoiceBase, ORMBase):
    id: int
    invoice_code: str
    line_items: Optional[List[Any]] = None
    created_at: datetime


class InvoiceLineItem(AppBaseModel):
    name: str
    price: Decimal = Field(ge=0)
    quantity: int = Field(ge=1)
    subtotal: Decimal = Field(ge=0)


class InvoicePaidEmailRequest(AppBaseModel):
    recipient_email: str = Field(..., min_length=5, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    invoice_code: Optional[str] = None
    patient_name: Optional[str] = Field(None, min_length=2, max_length=120)
    invoice_date: Optional[date] = None
    amount: Optional[Decimal] = Field(None, ge=0)
    status: str = Field(..., min_length=2, max_length=50)
    payment_method: Optional[str] = Field(None, min_length=2, max_length=100)


class InvoicePaidEmailResponse(AppBaseModel):
    invoice: InvoiceRead
    email_sent: bool
    message: str

