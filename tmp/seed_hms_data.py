import sqlite3
import random
from datetime import datetime, timedelta

def seed():
    DB_PATH = 'backend/hms.db'
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    USER_ID = 6 # asifkhan

    # 1. Clear existing data for asifkhan to start fresh if needed, or just append
    # cursor.execute("DELETE FROM patients WHERE owner_user_id = ?", (USER_ID,))
    # cursor.execute("DELETE FROM invoices WHERE owner_user_id = ?", (USER_ID,))
    # cursor.execute("DELETE FROM staff WHERE owner_user_id = ?", (USER_ID,))
    # cursor.execute("DELETE FROM blood_activities WHERE owner_user_id = ?", (USER_ID,))

    first_names = ["John", "Jane", "Alice", "Bob", "Charlie", "Diana", "Edward", "Fiona", "George", "Hannah", "Ivan", "Julia"]
    last_names = ["Doe", "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez"]
    blood_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    genders = ["Male", "Female", "Other"]
    patient_statuses = ["Inpatient", "Outpatient", "Emergency", "Discharged"]
    
    # Seed Patients
    print("Seeding 10 patients...")
    for i in range(1, 11):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        p_code = f"P-CONF-{1000 + i}"
        age = random.randint(18, 85)
        gender = random.choice(genders)
        bg = random.choice(blood_groups)
        status = random.choice(patient_statuses)
        cursor.execute("""
            INSERT INTO patients (owner_user_id, patient_code, name, age, gender, blood_group, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (USER_ID, p_code, name, age, gender, bg, status, datetime.now().isoformat()))

    # Seed Invoices
    print("Seeding 10 invoices...")
    inv_statuses = ["Paid", "Pending", "Cancelled"]
    methods = ["Cash", "Card", "UPI", "Insurance"]
    cursor.execute("SELECT name FROM patients WHERE owner_user_id = ?", (USER_ID,))
    patient_names = [r[0] for r in cursor.fetchall()]
    
    for i in range(1, 11):
        p_name = random.choice(patient_names)
        inv_code = f"INV-CONF-{2000 + i}"
        amount = random.randint(1000, 50000)
        status = random.choice(inv_statuses)
        method = random.choice(methods)
        inv_date = (datetime.now() - timedelta(days=random.randint(0, 30))).date().isoformat()
        cursor.execute("""
            INSERT INTO invoices (owner_user_id, invoice_code, patient_name, invoice_date, amount, status, payment_method, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (USER_ID, inv_code, p_name, inv_date, amount, status, method, datetime.now().isoformat()))

    # Seed Staff
    print("Seeding 10 staff...")
    roles = ["Doctor", "Nurse", "Admin", "Receptionist", "Lab Technician"]
    depts = ["Cardiology", "Neurology", "General Medicine", "Emergency", "Pediatrics"]
    shifts = ["Morning", "Afternoon", "Night"]
    for i in range(1, 11):
        name = f"Staff {random.choice(first_names)} {random.choice(last_names)}"
        s_code = f"S-CONF-{3000 + i}"
        role = random.choice(roles)
        dept = random.choice(depts)
        shift = random.choice(shifts)
        cursor.execute("""
            INSERT INTO staff (owner_user_id, staff_code, name, role, department, shift, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (USER_ID, s_code, name, role, dept, shift, "Active", datetime.now().isoformat()))

    # Seed Blood Activities
    print("Seeding 10 blood activities...")
    types = ["Donation", "Usage"]
    for i in range(1, 11):
        bg = random.choice(blood_groups)
        units = random.randint(1, 5)
        donor = f"Donor {random.choice(first_names)} {random.choice(last_names)}"
        a_type = random.choice(types)
        b_date = (datetime.now() - timedelta(days=random.randint(0, 10))).isoformat()
        cursor.execute("""
            INSERT INTO blood_activities (owner_user_id, type, blood_group, units, donor_name, date)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (USER_ID, a_type, bg, units, donor, b_date))

    conn.commit()
    conn.close()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed()
