import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.append(str(backend_path))

# Load .env manually if needed, but app.core.config should handle it
from app.core.database import SessionLocal
from app.models import (
    Appointment, MedicalRecord, Invoice, Medicine, LabTest,
    Staff, Bed, BloodActivity, InventoryItem, Patient, BloodInventory, User
)

def cleanup():
    db = SessionLocal()
    try:
        print("Connected to the LIVE database...")
        
        # Tables to clear in order (to respect potential FKs if any, though HMS seems simple)
        models = [
            Appointment, MedicalRecord, Invoice, Medicine, LabTest,
            Staff, Bed, BloodActivity, InventoryItem, Patient, BloodInventory
        ]
        
        for model in models:
            table_name = model.__tablename__
            try:
                count = db.query(model).count()
                if count > 0:
                    db.query(model).delete()
                    print(f"Cleared {table_name}: {count} rows removed.")
                else:
                    print(f"Table {table_name} is already empty.")
            except Exception as e:
                print(f"Error clearing {table_name}: {e}")
        
        # Users - keep admin_hms
        try:
            user_count = db.query(User).filter(User.username != 'admin_hms').count()
            if user_count > 0:
                db.query(User).filter(User.username != 'admin_hms').delete()
                print(f"Cleared users: {user_count} extra users removed (kept admin_hms).")
            else:
                print("Users table already clean (only admin exists).")
        except Exception as e:
            print(f"Error clearing users: {e}")
            
        db.commit()
        print("\nDatabase cleanup complete. Live data has been removed.")
        
    except Exception as e:
        print(f"Fatal error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup()
