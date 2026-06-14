from datetime import datetime
from typing import Any
from uuid import UUID

from app.models.uploaded_file import FileStatus
from app.schemas.common import ORMModel


class FileRead(ORMModel):
    id: UUID
    project_id: UUID
    file_name: str
    original_name: str
    file_type: str
    file_size: int
    status: FileStatus
    extracted_text: str | None
    parsed_data: dict[str, Any] | list[Any] | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime
