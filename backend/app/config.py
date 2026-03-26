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

API_PREFIX = "/api"

# Read allowed origins from env; fall back to localhost dev servers
_raw_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
CORS_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]
