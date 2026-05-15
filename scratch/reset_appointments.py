import sqlite3
import os

db_path = 'hms.db'
if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM appointments;')
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='appointments';")
        conn.commit()
        print('Appointments cleared and sequence reset.')
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
