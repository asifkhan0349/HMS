import sys
import os
from pathlib import Path

# Add backend to path so we can import app
sys.path.append(str(Path(__file__).resolve().parent.parent / "backend"))

from app.core.database import SessionLocal
from app.models import Appointment

def clear_remote_scheduling():
    db = SessionLocal()
    try:
        print("Connecting to remote database...")
        # Use a more efficient delete if possible, but this works
        count = db.query(Appointment).delete()
        db.commit()
        print(f"Successfully deleted {count} appointments from the remote database.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_remote_scheduling()
