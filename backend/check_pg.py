import sys
from pathlib import Path
from sqlalchemy import text

# Add backend to sys.path
backend_path = Path(__file__).resolve().parent
sys.path.append(str(backend_path))

from app.core.database import SessionLocal, engine

def check():
    print("Connecting to PostgreSQL...")
    db = SessionLocal()
    try:
        print("\n--- AMBULANCES ---")
        with engine.connect() as conn:
            result = conn.execute(text("SELECT id, owner_user_id, ambulance_code, vehicle_number, status, current_trip_patient, current_trip_destination FROM ambulances;"))
            for row in result.fetchall():
                print(row)
                
        print("\n--- AMBULANCE TRIPS ---")
        with engine.connect() as conn:
            result = conn.execute(text("SELECT id, owner_user_id, ambulance_id, ambulance_code, vehicle_number, patient_name, destination, completed_at FROM ambulance_trips;"))
            for row in result.fetchall():
                print(row)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check()
