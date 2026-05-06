import sqlite3
import os

db_path = 'backend/hms.db'

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check current columns
cursor.execute("PRAGMA table_info(appointments)")
columns = [row[1] for row in cursor.fetchall()]
print(f"Current columns: {columns}")

# Add doctor_name if missing
if 'doctor_name' not in columns:
    print("Adding doctor_name column...")
    cursor.execute("ALTER TABLE appointments ADD COLUMN doctor_name VARCHAR(120)")

# Add scheduled_later_reason if missing
if 'scheduled_later_reason' not in columns:
    print("Adding scheduled_later_reason column...")
    cursor.execute("ALTER TABLE appointments ADD COLUMN scheduled_later_reason VARCHAR(255)")

conn.commit()
conn.close()
print("Database schema updated successfully.")
