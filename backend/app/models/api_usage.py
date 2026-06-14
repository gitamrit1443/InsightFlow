import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDPrimaryKeyMixin, UUIDType


class ApiUsage(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "api_usage"

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUIDType, ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    route: Mapped[str] = mapped_column(String(255))
    method: Mapped[str] = mapped_column(String(12))
    ip_address: Mapped[str] = mapped_column(String(64))
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    status_code: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
