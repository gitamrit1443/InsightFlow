from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class InsightCreate(BaseModel):
    type: str = Field(min_length=2, max_length=80)
    title: str = Field(min_length=2, max_length=240)
    content: str = Field(min_length=2)
    confidence_score: float | None = Field(default=None, ge=0, le=1)
    metadata: dict[str, Any] | None = None


class InsightRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    project_id: UUID
    type: str
    title: str
    content: str
    confidence_score: float | None
    metadata: dict[str, Any] | None = Field(validation_alias="metadata_")
    created_at: datetime
