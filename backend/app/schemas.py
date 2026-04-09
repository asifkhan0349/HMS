from datetime import date, datetime, timezone
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PatientBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    age: int = Field(..., ge=0, le=130)
    gender: str
    blood_group: str
    last_visit: date | None = None
    status: str


class PatientCreate(PatientBase):
    patient_code: str


class PatientUpdate(BaseModel):
    patient_code: str | None = None
    name: str | None = None
    age: int | None = Field(default=None, ge=0, le=130)
    gender: str | None = None
    blood_group: str | None = None
    last_visit: date | None = None
    status: str | None = None


class PatientRead(PatientBase, ORMBase):
    id: int
    patient_code: str
    created_at: datetime


class AppointmentBase(BaseModel):
    patient_name: str
    doctor_name: str
    scheduled_time: datetime
    appointment_type: str
    status: str


class AppointmentCreate(AppointmentBase):
    appointment_code: str


class AppointmentUpdate(BaseModel):
    appointment_code: str | None = None
    patient_name: str | None = None
    doctor_name: str | None = None
    scheduled_time: datetime | None = None
    appointment_type: str | None = None
    status: str | None = None


class AppointmentRead(AppointmentBase, ORMBase):
    id: int
    appointment_code: str
    created_at: datetime


class MedicalRecordBase(BaseModel):
    clinical_id: str
    record_date: date
    patient_name: str
    doctor_name: str
    diagnosis: str
    prescription: str


class MedicalRecordCreate(MedicalRecordBase):
    record_code: str


class MedicalRecordUpdate(BaseModel):
    record_code: str | None = None
    clinical_id: str | None = None
    record_date: date | None = None
    patient_name: str | None = None
    doctor_name: str | None = None
    diagnosis: str | None = None
    prescription: str | None = None


class MedicalRecordRead(MedicalRecordBase, ORMBase):
    id: int
    record_code: str
    created_at: datetime


class InvoiceBase(BaseModel):
    patient_name: str
    invoice_date: date
    amount: Decimal = Field(..., ge=0)
    status: str
    payment_method: str


class InvoiceCreate(InvoiceBase):
    invoice_code: str


class InvoiceUpdate(BaseModel):
    invoice_code: str | None = None
    patient_name: str | None = None
    invoice_date: date | None = None
    amount: Decimal | None = Field(default=None, ge=0)
    status: str | None = None
    payment_method: str | None = None


class InvoiceRead(InvoiceBase, ORMBase):
    id: int
    invoice_code: str
    created_at: datetime


class MedicineBase(BaseModel):
    name: str
    batch: str
    stock: int = Field(..., ge=0)
    expiry_date: date
    status: str


class MedicineCreate(MedicineBase):
    medicine_code: str


class MedicineUpdate(BaseModel):
    medicine_code: str | None = None
    name: str | None = None
    batch: str | None = None
    stock: int | None = Field(default=None, ge=0)
    expiry_date: date | None = None
    status: str | None = None


class MedicineRead(MedicineBase, ORMBase):
    id: int
    medicine_code: str
    created_at: datetime


class LabTestBase(BaseModel):
    patient_name: str
    test_name: str
    doctor_name: str
    status: str


class LabTestCreate(LabTestBase):
    test_code: str


class LabTestUpdate(BaseModel):
    test_code: str | None = None
    patient_name: str | None = None
    test_name: str | None = None
    doctor_name: str | None = None
    status: str | None = None


class LabTestRead(LabTestBase, ORMBase):
    id: int
    test_code: str
    created_at: datetime


class StaffBase(BaseModel):
    name: str
    role: str
    department: str
    shift: str
    status: str


class StaffCreate(StaffBase):
    staff_code: str


class StaffUpdate(BaseModel):
    staff_code: str | None = None
    name: str | None = None
    role: str | None = None
    department: str | None = None
    shift: str | None = None
    status: str | None = None


class StaffRead(StaffBase, ORMBase):
    id: int
    staff_code: str
    created_at: datetime


class DashboardStats(BaseModel):
    patients: int
    appointments: int
    records: int
    invoices: int
    medicines: int
    tests: int
    staff: int


class UserRead(ORMBase):
    id: int
    full_name: str
    username: str
    email: str
    role: str
    created_at: datetime


class SignupRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(default="Admin", min_length=2, max_length=30)

    @field_validator("full_name", "username", "email", "role")
    @classmethod
    def strip_text_fields(cls, value: str) -> str:
        return value.strip()


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def strip_username(cls, value: str) -> str:
        return value.strip()


class AuthResponse(BaseModel):
    message: str
    user: UserRead
    token: str


# --- Bed Schemas ---
class BedBase(BaseModel):
    bed_number: str
    ward_name: str
    type: str
    status: str


class BedCreate(BedBase):
    pass


class BedUpdate(BaseModel):
    bed_number: str | None = None
    ward_name: str | None = None
    type: str | None = None
    status: str | None = None


class BedRead(BedBase, ORMBase):
    id: int
    created_at: datetime


# --- Blood Bank Schemas ---
class BloodInventoryBase(BaseModel):
    blood_group: str
    units: int = Field(default=0, ge=0)
    status: str
    trend: str = "Stable"


class BloodInventoryCreate(BloodInventoryBase):
    pass


class BloodInventoryUpdate(BaseModel):
    blood_group: str | None = None
    units: int | None = Field(default=None, ge=0)
    status: str | None = None
    trend: str | None = None


class BloodInventoryRead(BloodInventoryBase, ORMBase):
    id: int
    updated_at: datetime


class BloodActivityBase(BaseModel):
    type: str  # "Donation" or "Usage"
    blood_group: str
    units: int = Field(..., gt=0)
    donor_name: str
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BloodActivityCreate(BloodActivityBase):
    pass


class BloodActivityUpdate(BaseModel):
    type: str | None = None
    blood_group: str | None = None
    units: int | None = Field(default=None, gt=0)
    donor_name: str | None = None
    date: datetime | None = None


class BloodActivityRead(BloodActivityBase, ORMBase):
    id: int


# --- Inventory Schemas ---
class InventoryItemBase(BaseModel):
    item_code: str
    name: str
    category: str
    stock: int = Field(default=0, ge=0)
    unit: str
    status: str


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    item_code: str | None = None
    name: str | None = None
    category: str | None = None
    stock: int | None = Field(default=None, ge=0)
    unit: str | None = None
    status: str | None = None


class InventoryItemRead(InventoryItemBase, ORMBase):
    id: int
    created_at: datetime


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: str | None = Field(default=None, min_length=5, max_length=120)


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)
