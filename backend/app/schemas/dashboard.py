from typing import Any

from pydantic import BaseModel, Field

from app.schemas.common import TimestampedModel


class DashboardCreate(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    layout_config: dict[str, Any] = Field(default_factory=dict)


class DashboardUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    layout_config: dict[str, Any] | None = None


class DashboardRead(TimestampedModel):
    name: str
    layout_config: dict[str, Any]
