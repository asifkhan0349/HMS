import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env from backend/.env
load_dotenv('backend/.env')
db_url = os.getenv('DATABASE_URL')

if not db_url:
    print("DATABASE_URL not found in .env")
else:
    # Handle the case where postgresql:// might be postgres://
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    engine = create_engine(db_url)
    with engine.connect() as conn:
        try:
            # TRUNCATE is safer for resetting sequences in Postgres
            conn.execute(text("TRUNCATE TABLE appointments RESTART IDENTITY CASCADE;"))
            conn.commit()
            print('Appointments table truncated and sequence reset.')
        except Exception as e:
            print(f"Error: {e}")
