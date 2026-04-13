from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

# For SQLite, check_same_thread needs to be False for FastAPI
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    # echo=True, # Uncomment to see raw SQL queries in console
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Dependency to get the database session.
    Yields the session and ensures it's closed after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
