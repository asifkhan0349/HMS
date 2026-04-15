from pydantic import Field

from .base import AppBaseModel


class DashboardStats(AppBaseModel):
    patients: int = Field(..., ge=0)
    appointments: int = Field(..., ge=0)
    records: int = Field(..., ge=0)
    invoices: int = Field(..., ge=0)
    medicines: int = Field(..., ge=0)
    tests: int = Field(..., ge=0)
    staff: int = Field(..., ge=0)
