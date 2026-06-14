from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.chat_message import ChatRole
from app.schemas.common import ORMModel


class ChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=4000)


class ChatMessageRead(ORMModel):
    id: UUID
    role: ChatRole
    content: str
    created_at: datetime


class ChatResponse(BaseModel):
    user_message: ChatMessageRead
    assistant_message: ChatMessageRead
