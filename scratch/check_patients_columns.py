import sys
from pathlib import Path
from sqlalchemy import inspect

# Add backend to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.append(str(backend_path))

from app.core.database import engine

def check():
    inspector = inspect(engine)
    columns = inspector.get_columns("patients")
    print("Columns in patients table:")
    for col in columns:
        print(f" - {col['name']}: {col['type']}")

if __name__ == "__main__":
    check()
