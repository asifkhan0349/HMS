import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env from backend/.env
load_dotenv('backend/.env')
db_url = os.getenv('DATABASE_URL')

if not db_url:
    print("DATABASE_URL not found in .env")
else:
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    engine = create_engine(db_url)
    tables = [
        'appointments',
        'patients',
        'staff',
        'invoices',
        'medicines',
        'lab_tests',
        'inventory',
        'medical_records',
        'beds',
        'blood_inventory',
        'blood_activities'
    ]
    
    with engine.connect() as conn:
        try:
            for table in tables:
                # Check if table exists first to avoid errors
                check_query = text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}');")
                exists = conn.execute(check_query).scalar()
                if exists:
                    conn.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE;"))
                    print(f"Table '{table}' truncated and sequence reset.")
                else:
                    print(f"Table '{table}' does not exist, skipping.")
            conn.commit()
            print('--- System-wide reset complete ---')
        except Exception as e:
            print(f"Error during reset: {e}")
