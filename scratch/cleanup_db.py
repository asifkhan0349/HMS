import sqlite3
import os

# Use the absolute path or relative to project root
db_path = "backend/hms.db"

tables_to_clear = [
    "appointments",
    "medical_records",
    "invoices",
    "medicines",
    "lab_tests",
    "staff",
    "beds",
    "blood_activities",
    "inventory",
    "patients",
    "blood_inventory"
]

def clear_data():
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    print(f"Connecting to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    for table in tables_to_clear:
        try:
            cursor.execute(f"DELETE FROM {table}")
            print(f"Cleared table: {table}")
        except sqlite3.OperationalError as e:
            print(f"Error clearing {table}: {e}")

    # Special handling for users - keep admin_hms
    try:
        cursor.execute("DELETE FROM users WHERE username != 'admin_hms'")
        deleted_users = cursor.rowcount
        print(f"Cleared users table (deleted {deleted_users} users, kept admin_hms)")
    except sqlite3.OperationalError as e:
        print(f"Error clearing users: {e}")

    conn.commit()
    conn.close()
    print("\nDatabase cleanup complete. All user-entered data has been removed.")

if __name__ == "__main__":
    clear_data()
