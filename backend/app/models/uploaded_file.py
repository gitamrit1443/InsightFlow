import enum
import uuid

from sqlalchemy import BigInteger, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, JSONType, TimestampMixin, UUIDPrimaryKeyMixin, UUIDType


class FileStatus(str, enum.Enum):
    uploaded = "uploaded"
    processing = "processing"
    parsed = "parsed"
    failed = "failed"


class UploadedFile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "uploaded_files"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUIDType, ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUIDType, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    file_name: Mapped[str] = mapped_column(String(255))
    original_name: Mapped[str] = mapped_column(String(255))
    file_type: Mapped[str] = mapped_column(String(20))
    file_path: Mapped[str] = mapped_column(String(1024))
    file_size: Mapped[int] = mapped_column(BigInteger)
    status: Mapped[FileStatus] = mapped_column(
        Enum(FileStatus, name="file_status"), default=FileStatus.uploaded
    )
    extracted_text: Mapped[str | None] = mapped_column(Text)
    parsed_data: Mapped[dict | list | None] = mapped_column(JSONType)
    error_message: Mapped[str | None] = mapped_column(Text)
