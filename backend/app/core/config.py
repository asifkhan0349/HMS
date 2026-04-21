import os
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # General
    ENV: str = "development"
    DEBUG_MODE: bool = True
    API_PREFIX: str = "/api"

    # Security
    HMS_SECRET_KEY: str = "dev-insecure-secret-change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALLOWED_ORIGINS: str = ""

    # Database
    DATABASE_URL: str = ""

    # Email (FastMail)
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "hms@example.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = ""
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"

    # Webhook
    APPOINTMENT_WEBHOOK_URL: str = "https://krishnakanth950.app.n8n.cloud/webhook/hospital-appointment-confirmation"

    @property
    def cors_origins(self) -> List[str]:
        if not self.ALLOWED_ORIGINS:
            return ["*"] if self.ENV != "production" else []
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

settings = Settings()

# Post-processing for production safety
if settings.ENV == "production":
    if settings.HMS_SECRET_KEY == "dev-insecure-secret-change-me":
        raise ValueError("HMS_SECRET_KEY must be a secure value in production!")
    if len(settings.HMS_SECRET_KEY) < 32:
        raise ValueError("HMS_SECRET_KEY must be at least 32 characters long for production security!")

# Database URL adjustment for Postgres (Render compatibility)
if settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql://", 1)
elif not settings.DATABASE_URL:
    BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
    DATABASE_PATH = BACKEND_DIR / "hms.db"
    settings.DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"

# Constants for migration logic
API_PREFIX = settings.API_PREFIX
CORS_ORIGINS = settings.cors_origins
DATABASE_URL = settings.DATABASE_URL
SECRET_KEY = settings.HMS_SECRET_KEY
