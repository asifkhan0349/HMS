from app.core.database import SessionLocal
from app.models import User
from app.core.security import hash_password

def create_reception():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "reception_test").first()
        if user:
            user.password_hash = hash_password("reception123")
            user.role = "Reception"
        else:
            user = User(
                username="reception_test",
                email="reception@example.com",
                password_hash=hash_password("reception123"),
                full_name="Reception Test",
                role="Reception"
            )
            db.add(user)
        db.commit()
        print("Reception test account created/updated: reception_test / reception123")
    finally:
        db.close()

if __name__ == "__main__":
    create_reception()
