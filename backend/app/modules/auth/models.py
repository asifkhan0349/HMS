from datetime import datetime, timezone
from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

_utcnow = lambda: datetime.now(timezone.utc)  # noqa: E731

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(30), default="Admin")
    password_hash: Mapped[str] = mapped_column(String(255))
    staff_id: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    reset_password_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reset_password_expires: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
