from app.core.database import SessionLocal
from app.seed import seed_database

if __name__ == "__main__":
    with SessionLocal() as db:
        seed_database(db)
        print("Database seeded successfully.")
