import sqlite3
import os

db_path = r"c:\Users\asifk\Documents\antigravity\HMS\backend\hms.db"

if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

tables = ["patients", "appointments", "staff", "inventory", "medical_records", "invoices"]

for table in tables:
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"Table '{table}': {count} records")
    except sqlite3.OperationalError as e:
        print(f"Error reading table '{table}': {e}")

conn.close()
