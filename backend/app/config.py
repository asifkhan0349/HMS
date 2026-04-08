import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env if present (development convenience — production sets vars directly)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    # Fallback for development if .env is missing or DATABASE_URL not set
    BACKEND_DIR = Path(__file__).resolve().parent.parent
    DATABASE_PATH = BACKEND_DIR / "hms.db"
    DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"
else:
    # Ensure modern SQLAlchemy compatibility (replace legacy postgres:// with postgresql://)
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

API_PREFIX = "/api"

# Completely automate CORS to allow any origin so the user doesn't have to manually configure domain whitelists
CORS_ORIGINS = ["*"]
