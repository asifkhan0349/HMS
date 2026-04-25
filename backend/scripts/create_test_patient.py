from app.core.database import SessionLocal
from app.models import User
from app.core.security import hash_password

def create_test_patient():
    db = SessionLocal()
    try:
        # Check if exists
        user = db.query(User).filter(User.username == "patient_test").first()
        if user:
            print("Patient test user already exists.")
            return
        
        user = User(
            full_name="Patient Test User",
            username="patient_test",
            email="patient@test.com",
            password_hash=hash_password("patient123"),
            role="Patient"
        )
        db.add(user)
        db.commit()
        print("Patient test user created successfully.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_patient()
