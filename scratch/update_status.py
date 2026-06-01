import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', 'hms.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("UPDATE invoices SET status = 'Partially Paid' WHERE status = 'Partial';")
conn.commit()
print(f"Updated {cursor.rowcount} legacy rows.")
conn.close()
