import sqlite3
import os

db_path = r"c:\Users\asifk\Documents\antigravity\HMS\backend\hms.db"
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT username, role FROM users")
        rows = cursor.fetchall()
        for row in rows:
            print(f"User: {row[0]}, Role: {row[1]}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
