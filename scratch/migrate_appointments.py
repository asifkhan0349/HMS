import psycopg2

DATABASE_URL = "postgresql://admin:hrmsadmin123@91.108.104.46:5432/hrms"

def migrate():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        print("Adding patient_email column...")
        cur.execute("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_email VARCHAR(120);")
        
        print("Adding blood_group column...")
        cur.execute("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);")
        
        print("Adding emergency_contact_2 column...")
        cur.execute("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS emergency_contact_2 VARCHAR(20);")
        
        conn.commit()
        print("Migration successful!")
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
