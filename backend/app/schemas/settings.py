from pydantic import BaseModel, Field

from app.schemas.common import TimestampedModel


class SettingsUpdate(BaseModel):
    organization_name: str | None = Field(default=None, max_length=180)
    theme: str | None = Field(default=None, pattern="^(light|dark|system)$")
    notification_enabled: bool | None = None
    data_retention_days: int | None = Field(default=None, ge=1, le=3650)


class SettingsRead(TimestampedModel):
    organization_name: str | None
    theme: str
    notification_enabled: bool
    billing_plan: str
    data_retention_days: int
