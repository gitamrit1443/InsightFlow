import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, UUIDType


class WorkspaceSettings(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "workspace_settings"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUIDType, ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    organization_name: Mapped[str | None] = mapped_column(String(180))
    theme: Mapped[str] = mapped_column(String(20), default="system")
    notification_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    billing_plan: Mapped[str] = mapped_column(String(30), default="free")
    data_retention_days: Mapped[int] = mapped_column(Integer, default=30)

    user: Mapped["User"] = relationship(back_populates="settings")


from app.models.user import User  # noqa: E402
