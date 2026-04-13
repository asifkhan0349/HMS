import logging
import sys
import os

# Add parent directory to path so app modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import SessionLocal
from app.database.base import Base, engine
from app.services.user_service import user_service
from app.schemas.user import UserCreate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db(db) -> None:
    # Normally you'd run alembic migrations instead of create_all
    # but for a quick script we ensure tables exist.
    Base.metadata.create_all(bind=engine)
    
    user = user_service.get_user_by_email(db, email="admin@example.com")
    if not user:
        user_in = UserCreate(
            email="admin@example.com",
            password="adminpassword",
            full_name="Admin User",
            is_active=True,
        )
        user = user_service.create_user(db, user_in=user_in)
        logger.info(f"Created admin user: {user.email}")
    else:
        logger.info(f"Admin user already exists: {user.email}")

def main() -> None:
    logger.info("Creating initial data")
    db = SessionLocal()
    init_db(db)
    logger.info("Initial data created")

if __name__ == "__main__":
    main()
