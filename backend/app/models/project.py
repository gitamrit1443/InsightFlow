from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, UUIDType


class Project(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "projects"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUIDType, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(180))
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(120))
    goal: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="projects")
    files: Mapped[list["UploadedFile"]] = relationship(cascade="all, delete-orphan")
    insights: Mapped[list["Insight"]] = relationship(cascade="all, delete-orphan")
    dashboards: Mapped[list["Dashboard"]] = relationship(cascade="all, delete-orphan")
    reports: Mapped[list["Report"]] = relationship(cascade="all, delete-orphan")
    chat_messages: Mapped[list["ChatMessage"]] = relationship(cascade="all, delete-orphan")


from app.models.chat_message import ChatMessage  # noqa: E402
from app.models.dashboard import Dashboard  # noqa: E402
from app.models.insight import Insight  # noqa: E402
from app.models.report import Report  # noqa: E402
from app.models.uploaded_file import UploadedFile  # noqa: E402
from app.models.user import User  # noqa: E402
