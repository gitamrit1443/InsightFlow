from datetime import datetime
from uuid import UUID

from pydantic import EmailStr

from app.schemas.common import ORMModel


class UserRead(ORMModel):
    id: UUID
    name: str
    email: EmailStr
    is_active: bool
    created_at: datetime
