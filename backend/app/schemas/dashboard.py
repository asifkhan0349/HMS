from pydantic import BaseModel


class DashboardStats(BaseModel):
    patients: int
    appointments: int
    records: int
    invoices: int
    medicines: int
    tests: int
    staff: int
