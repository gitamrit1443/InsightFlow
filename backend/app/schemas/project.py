from pydantic import BaseModel, Field

from app.schemas.common import TimestampedModel


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=5000)
    category: str | None = Field(default=None, max_length=120)
    goal: str | None = Field(default=None, max_length=5000)


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=5000)
    category: str | None = Field(default=None, max_length=120)
    goal: str | None = Field(default=None, max_length=5000)


class ProjectRead(TimestampedModel):
    name: str
    description: str | None
    category: str | None
    goal: str | None


class ProjectList(BaseModel):
    items: list[ProjectRead]
    total: int
    page: int
    page_size: int
