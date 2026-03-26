from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from .models import (
    Appointment,
    Bed,
    BloodInventory,
    InventoryItem,
    Invoice,
    LabTest,
    Medicine,
    Patient,
    Staff,
    User,
)
from .security import hash_password


def seed_database(db: Session):
    """Seed the database with a default admin user and sample data."""

    # 1. Create Default Admin User if not exists
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        hashed_pw = hash_password("hrmsadmin123")
        admin_user = User(
            full_name="System Administrator",
            username="admin",
            email="admin@hms.com",
            role="Admin",
            password_hash=hashed_pw,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    admin_id = admin_user.id

    # 2. Seed Blood Inventory (Static categories)
    blood_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    existing_blood = db.query(BloodInventory).count()
    if existing_blood == 0:
        for bg in blood_groups:
            db.add(
                BloodInventory(
                    owner_user_id=admin_id,
                    blood_group=bg,
                    units=10,
                    status="Available",
                    trend="Stable",
                )
            )
        db.commit()

    # 3. Sample Patients
    if db.query(Patient).count() == 0:
        patients_data = [
            {
                "patient_code": "P-001",
                "name": "John Doe",
                "age": 45,
                "gender": "Male",
                "blood_group": "A+",
                "status": "Inpatient",
            },
            {
                "patient_code": "P-002",
                "name": "Jane Smith",
                "age": 32,
                "gender": "Female",
                "blood_group": "B-",
                "status": "Outpatient",
            },
        ]
        for p in patients_data:
            db.add(Patient(owner_user_id=admin_id, **p))
        db.commit()

    # 4. Sample Staff
    if db.query(Staff).count() == 0:
        staff_data = [
            {
                "staff_code": "S-101",
                "name": "Dr. Sarah Johnson",
                "role": "Doctor",
                "department": "Cardiology",
                "shift": "Morning",
                "status": "Active",
            },
            {
                "staff_code": "S-102",
                "name": "Nurse Mike Williams",
                "role": "Nurse",
                "department": "Emergency",
                "shift": "Night",
                "status": "Active",
            },
        ]
        for s in staff_data:
            db.add(Staff(owner_user_id=admin_id, **s))
        db.commit()

    return None
