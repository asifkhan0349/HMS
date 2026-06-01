from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Date, DateTime, Integer, JSON, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from .core.database import Base

_utcnow = lambda: datetime.now(timezone.utc)  # noqa: E731


from .modules.patients.models import Patient


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    booking_id: Mapped[str | None] = mapped_column(String(20), unique=True, index=True, nullable=True)
    appointment_code: Mapped[str | None] = mapped_column(String(20), unique=True, index=True, nullable=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    patient_name: Mapped[str] = mapped_column(String(120), index=True)
    patient_date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    patient_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    patient_gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    patient_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    appointment_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    appointment_type: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(30), default="Pending", index=True)
    telegram_chat_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    patient_email: Mapped[str | None] = mapped_column(String(120), nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(10), nullable=True)
    emergency_contact: Mapped[str | None] = mapped_column(String(20), nullable=True)
    emergency_contact_2: Mapped[str | None] = mapped_column(String(20), nullable=True)
    time_slot: Mapped[str | None] = mapped_column(String(50), nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    doctor_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    doctor_id: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    scheduled_later_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    symptoms: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    record_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    clinical_id: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    record_date: Mapped[date] = mapped_column(Date)
    patient_name: Mapped[str] = mapped_column(String(120), index=True)
    doctor_name: Mapped[str] = mapped_column(String(120), index=True)
    diagnosis: Mapped[str] = mapped_column(String(255))
    prescription: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    invoice_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    patient_name: Mapped[str] = mapped_column(String(120), index=True)
    invoice_date: Mapped[date] = mapped_column(Date)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.00)
    due_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.00)
    tax_total: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.00)
    discount_total: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.00)
    status: Mapped[str] = mapped_column(String(30), index=True)
    payment_method: Mapped[str] = mapped_column(String(30))
    payment_status: Mapped[str] = mapped_column(String(30), default='Pending', index=True)
    billing_type: Mapped[str] = mapped_column(String(10), default='OP')
    admission_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ward_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    stay_duration_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    room_charge_per_day: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    room_charges: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    insurance_provider: Mapped[str | None] = mapped_column(String(120), nullable=True)
    policy_number: Mapped[str | None] = mapped_column(String(80), nullable=True)
    covered_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    remaining_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    line_items: Mapped[list | None] = mapped_column(JSON, nullable=True)
    cgst: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=True)
    sgst: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=True)
    igst: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=True)
    payment_notes: Mapped[str | None] = mapped_column(String(255), nullable=True)
    expected_payment_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class Medicine(Base):
    __tablename__ = "medicines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    medicine_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    batch: Mapped[str] = mapped_column(String(30), index=True)
    stock: Mapped[int] = mapped_column(Integer)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    expiry_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(30), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class LabTest(Base):
    __tablename__ = "lab_tests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    test_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    patient_name: Mapped[str] = mapped_column(String(120), index=True)
    test_name: Mapped[str] = mapped_column(String(120), index=True)
    doctor_name: Mapped[str] = mapped_column(String(120), index=True)
    status: Mapped[str] = mapped_column(String(30), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class Staff(Base):
    __tablename__ = "staff"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    staff_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    role: Mapped[str] = mapped_column(String(50), index=True)
    department: Mapped[str] = mapped_column(String(80), index=True)
    shift: Mapped[str] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(30), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


from .modules.auth.models import User


class Bed(Base):
    __tablename__ = "beds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    bed_number: Mapped[str] = mapped_column(String(20), index=True)
    ward_name: Mapped[str] = mapped_column(String(80), index=True)
    type: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(30), index=True)
    patient_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    allotment_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class BloodInventory(Base):
    __tablename__ = "blood_inventory"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    blood_group: Mapped[str] = mapped_column(String(10), index=True)
    units: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(30))
    trend: Mapped[str] = mapped_column(String(20), default="Stable")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, onupdate=_utcnow)


class BloodActivity(Base):
    __tablename__ = "blood_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    type: Mapped[str] = mapped_column(String(20))  # "Donation" or "Usage"
    blood_group: Mapped[str] = mapped_column(String(10), index=True)
    units: Mapped[int] = mapped_column(Integer)
    donor_name: Mapped[str] = mapped_column(String(120))
    date: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    sample_id: Mapped[str | None] = mapped_column(String(50), nullable=True)


class InventoryItem(Base):
    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    item_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    category: Mapped[str] = mapped_column(String(50), index=True)
    stock: Mapped[int] = mapped_column(Integer)
    unit: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(30), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class MedicineTransaction(Base):
    __tablename__ = "medicine_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    medicine_id: Mapped[int] = mapped_column(Integer, index=True)
    medicine_name: Mapped[str] = mapped_column(String(120))
    transaction_type: Mapped[str] = mapped_column(String(30))  # "Sale" or "Restock"
    quantity: Mapped[int] = mapped_column(Integer)
    invoice_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class Ambulance(Base):
    __tablename__ = "ambulances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    ambulance_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    vehicle_number: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    type: Mapped[str] = mapped_column(String(50))  # e.g., "ALS", "BLS", "Patient Transport"
    status: Mapped[str] = mapped_column(String(30), default="Available", index=True)  # "Available", "Dispatched", "Maintenance", "Out of Service"
    driver_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    driver_contact: Mapped[str | None] = mapped_column(String(20), nullable=True)
    paramedic_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    equipment_checklist: Mapped[str | None] = mapped_column(String(255), nullable=True)  # e.g., "Oxygen, AED, First Aid"
    current_trip_patient: Mapped[str | None] = mapped_column(String(120), nullable=True)
    current_trip_destination: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class AmbulanceTrip(Base):
    __tablename__ = "ambulance_trips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    ambulance_id: Mapped[int] = mapped_column(Integer, index=True)
    ambulance_code: Mapped[str] = mapped_column(String(20), index=True)
    vehicle_number: Mapped[str] = mapped_column(String(20), index=True)
    patient_name: Mapped[str] = mapped_column(String(120), index=True)
    destination: Mapped[str] = mapped_column(String(255), index=True)
    driver_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    paramedic_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class CashReceipt(Base):
    __tablename__ = "cash_receipts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    invoice_code: Mapped[str] = mapped_column(String(20), index=True)
    patient_name: Mapped[str] = mapped_column(String(120), index=True)
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    payment_date: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)



