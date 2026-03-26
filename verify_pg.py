import sys
import os
from pathlib import Path

# Add backend to sys.path
backend_path = Path(__file__).resolve().parent / "backend"
sys.path.append(str(backend_path))

from app.database import Base, engine, SessionLocal
from app.seed import seed_database
from sqlalchemy import text

def verify():
    print("Testing PostgreSQL connection...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            print(f"Connected to: {result.fetchone()[0]}")
        
        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
        
        print("Seeding database...")
        with SessionLocal() as db:
            seed_database(db)
        print("Database seeded successfully.")
        
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if verify():
        print("Verification successful!")
    else:
        print("Verification failed!")
        sys.exit(1)
