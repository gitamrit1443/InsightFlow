from pydantic import BaseModel, Field

from app.schemas.common import TimestampedModel


class ReportRead(TimestampedModel):
    title: str
    content: str
    export_url: str | None


class ReportGenerateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=240)
