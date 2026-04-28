from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Date, DateTime, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from .core.database import Base

_utcnow = lambda: datetime.now(timezone.utc)  # noqa: E731


from .modules.patients.models import Patient


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
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
    time_slot: Mapped[str | None] = mapped_column(String(50), nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
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
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    invoice_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    patient_name: Mapped[str] = mapped_column(String(120), index=True)
    invoice_date: Mapped[date] = mapped_column(Date)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    status: Mapped[str] = mapped_column(String(30), index=True)
    payment_method: Mapped[str] = mapped_column(String(30))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class Medicine(Base):
    __tablename__ = "medicines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(Integer, index=True)
    medicine_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    batch: Mapped[str] = mapped_column(String(30), index=True)
    stock: Mapped[int] = mapped_column(Integer)
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
