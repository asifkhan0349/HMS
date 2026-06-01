from datetime import datetime
from decimal import Decimal
from pydantic import Field
from .base import AppBaseModel, ORMBase

class CashReceiptBase(AppBaseModel):
    invoice_code: str = Field(..., min_length=2, max_length=20)
    patient_name: str = Field(..., min_length=2, max_length=120)
    amount_paid: Decimal = Field(..., ge=0)
    payment_date: datetime

class CashReceiptRead(CashReceiptBase, ORMBase):
    id: int
    created_at: datetime
