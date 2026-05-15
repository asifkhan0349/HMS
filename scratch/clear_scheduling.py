import sqlite3
import os

# Use the absolute path or relative to project root
db_path = "backend/hms.db"

def clear_scheduling_data():
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    print(f"Connecting to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM appointments")
        count = cursor.rowcount
        print(f"Cleared table: appointments (deleted {count} records)")
    except sqlite3.OperationalError as e:
        print(f"Error clearing appointments: {e}")

    conn.commit()
    conn.close()
    print("\nScheduling data cleanup complete.")

if __name__ == "__main__":
    clear_scheduling_data()
