from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from .core.database import get_db
from .core.security import decode_access_token, hash_password
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
from .core.security import hash_password


def seed_database(db: Session):
    """Seed the database with a default admin user and sample data."""

    # 1. Create Default Admin User if not exists
    # First, cleanup any legacy admin users if necessary, or just ensure the target admin exists.
    # To enforce "Exactly ONE Admin", we can delete others, but for safety, 
    # let's just make sure admin_hms exists and no other user has 'Admin' role.
    
    db.query(User).filter(User.role == "Admin", User.username != "admin_hms").delete()
    
    admin_user = db.query(User).filter(User.username == "admin_hms").first()
    if not admin_user:
        hashed_pw = hash_password("ham33dSh@ika7m1n4m5")
        admin_user = User(
            full_name="HMS Administrator",
            username="admin_hms",
            email="admin@hms.com",
            role="Admin",
            password_hash=hashed_pw,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
    else:
        # Update password if it exists just to be sure it matches the requirement
        admin_user.password_hash = hash_password("ham33dSh@ika7m1n4m5")
        db.commit()

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
