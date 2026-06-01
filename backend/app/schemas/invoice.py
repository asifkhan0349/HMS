from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import Field
from .base import AppBaseModel, ORMBase


class InvoiceLineItem(AppBaseModel):
    category: str = Field(..., min_length=2, max_length=120)
    name: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = Field(None, max_length=255)
    quantity: int = Field(..., ge=1)
    unit_price: Decimal = Field(..., ge=0)
    tax_percentage: Decimal = Field(default=Decimal('0.00'), ge=0, le=100)
    discount_percentage: Decimal = Field(default=Decimal('0.00'), ge=0, le=100)
    subtotal: Decimal = Field(..., ge=0)
    tax_amount: Decimal = Field(default=Decimal('0.00'), ge=0)
    discount_amount: Decimal = Field(default=Decimal('0.00'), ge=0)
    total: Decimal = Field(..., ge=0)
    medicine_code: Optional[str] = Field(None, max_length=50)


class InvoiceBase(AppBaseModel):
    patient_name: str = Field(..., min_length=2, max_length=120)
    billing_type: str = Field(default='OP', min_length=2, max_length=10)
    invoice_date: date
    amount: Decimal = Field(..., ge=0)
    amount_paid: Decimal = Field(default=Decimal('0.00'), ge=0)
    due_amount: Decimal = Field(default=Decimal('0.00'), ge=0)
    tax_total: Decimal = Field(default=Decimal('0.00'), ge=0)
    discount_total: Decimal = Field(default=Decimal('0.00'), ge=0)
    cgst: Optional[Decimal] = Field(default=Decimal('0.00'), ge=0)
    sgst: Optional[Decimal] = Field(default=Decimal('0.00'), ge=0)
    igst: Optional[Decimal] = Field(default=Decimal('0.00'), ge=0)
    status: str = Field(..., min_length=2, max_length=50)
    payment_method: str = Field(..., min_length=2, max_length=100)
    payment_status: str = Field(default='Pending', min_length=2, max_length=50)
    admission_id: Optional[str] = Field(None, max_length=50)
    ward_name: Optional[str] = Field(None, max_length=120)
    stay_duration_days: Optional[int] = Field(None, ge=0)
    room_charge_per_day: Optional[Decimal] = Field(None, ge=0)
    room_charges: Optional[Decimal] = Field(None, ge=0)
    insurance_provider: Optional[str] = Field(None, max_length=120)
    policy_number: Optional[str] = Field(None, max_length=80)
    covered_amount: Optional[Decimal] = Field(None, ge=0)
    remaining_amount: Optional[Decimal] = Field(None, ge=0)
    payment_notes: Optional[str] = Field(None, max_length=255)
    expected_payment_date: Optional[date] = None


class InvoiceCreate(InvoiceBase):
    invoice_code: Optional[str] = None
    line_items: Optional[List[InvoiceLineItem]] = None


class InvoiceUpdate(AppBaseModel):
    invoice_code: Optional[str] = None
    patient_name: Optional[str] = Field(None, min_length=2, max_length=120)
    billing_type: Optional[str] = Field(None, min_length=2, max_length=10)
    invoice_date: Optional[date] = None
    amount: Optional[Decimal] = Field(None, ge=0)
    amount_paid: Optional[Decimal] = Field(None, ge=0)
    due_amount: Optional[Decimal] = Field(None, ge=0)
    tax_total: Optional[Decimal] = Field(None, ge=0)
    discount_total: Optional[Decimal] = Field(None, ge=0)
    cgst: Optional[Decimal] = Field(None, ge=0)
    sgst: Optional[Decimal] = Field(None, ge=0)
    igst: Optional[Decimal] = Field(None, ge=0)
    status: Optional[str] = Field(None, min_length=2, max_length=50)
    payment_method: Optional[str] = Field(None, min_length=2, max_length=100)
    payment_status: Optional[str] = Field(None, min_length=2, max_length=50)
    admission_id: Optional[str] = Field(None, max_length=50)
    ward_name: Optional[str] = Field(None, max_length=120)
    stay_duration_days: Optional[int] = Field(None, ge=0)
    room_charge_per_day: Optional[Decimal] = Field(None, ge=0)
    room_charges: Optional[Decimal] = Field(None, ge=0)
    insurance_provider: Optional[str] = Field(None, max_length=120)
    policy_number: Optional[str] = Field(None, max_length=80)
    covered_amount: Optional[Decimal] = Field(None, ge=0)
    remaining_amount: Optional[Decimal] = Field(None, ge=0)
    payment_notes: Optional[str] = Field(None, max_length=255)
    expected_payment_date: Optional[date] = None
    line_items: Optional[List[InvoiceLineItem]] = None


class InvoiceRead(InvoiceBase, ORMBase):
    id: int
    invoice_code: str
    line_items: Optional[List[InvoiceLineItem]] = None
    created_at: datetime


class InvoicePaidEmailRequest(AppBaseModel):
    recipient_email: str = Field(..., min_length=5, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    invoice_code: Optional[str] = None
    patient_name: Optional[str] = Field(None, min_length=2, max_length=120)
    invoice_date: Optional[date] = None
    amount: Optional[Decimal] = Field(None, ge=0)
    amount_paid: Optional[Decimal] = Field(None, ge=0)
    status: str = Field(..., min_length=2, max_length=50)
    payment_method: Optional[str] = Field(None, min_length=2, max_length=100)


class InvoicePaidEmailResponse(AppBaseModel):
    invoice: InvoiceRead
    email_sent: bool
    message: str

