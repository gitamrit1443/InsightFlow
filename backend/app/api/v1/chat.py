import json
import uuid

from fastapi import APIRouter, Request
from sqlalchemy import select

from app.api.dependencies import CurrentUser, DBSession, owned_project
from app.core.rate_limit import client_ip
from app.models.chat_message import ChatMessage, ChatRole
from app.models.uploaded_file import FileStatus, UploadedFile
from app.schemas.chat import ChatMessageRead, ChatRequest, ChatResponse
from app.services.ai_service import ai_service
from app.services.rate_limit_service import enforce_ai_limits, record_ai_usage

router = APIRouter(tags=["Chat"])


@router.get("/projects/{project_id}/chat", response_model=list[ChatMessageRead])
async def chat_history(
    project_id: uuid.UUID, db: DBSession, user: CurrentUser
) -> list[ChatMessage]:
    await owned_project(db, user, project_id)
    return list(
        (
            await db.scalars(
                select(ChatMessage)
                .where(ChatMessage.project_id == project_id, ChatMessage.user_id == user.id)
                .order_by(ChatMessage.created_at.asc())
            )
        ).all()
    )


@router.post("/projects/{project_id}/chat", response_model=ChatResponse)
async def send_chat_message(
    project_id: uuid.UUID,
    payload: ChatRequest,
    request: Request,
    db: DBSession,
    user: CurrentUser,
) -> ChatResponse:
    project = await owned_project(db, user, project_id)
    await enforce_ai_limits(db, user)
    history = list(
        (
            await db.scalars(
                select(ChatMessage)
                .where(ChatMessage.project_id == project_id, ChatMessage.user_id == user.id)
                .order_by(ChatMessage.created_at.asc())
            )
        ).all()
    )
    files = list(
        (
            await db.scalars(
                select(UploadedFile).where(
                    UploadedFile.project_id == project_id,
                    UploadedFile.user_id == user.id,
                    UploadedFile.status == FileStatus.parsed,
                )
            )
        ).all()
    )
    user_message = ChatMessage(
        project_id=project_id, user_id=user.id, role=ChatRole.user, content=payload.question
    )
    db.add(user_message)
    result = await ai_service.ask_project_question(project, files, history, payload.question)
    answer = result.get("executive_summary") or json.dumps(result, indent=2)
    passages = result.get("retrieved_passages", [])
    if passages:
        answer += "\n\nTop retrieved evidence:\n" + "\n".join(
            f"- ({item['score']:.2f}) {item['text'][:280]}" for item in passages[:3]
        )
    recommendations = result.get("recommendations", [])
    if recommendations:
        answer += "\n\nRecommended next actions:\n" + "\n".join(
            f"- {item}" for item in recommendations
        )
    assistant_message = ChatMessage(
        project_id=project_id,
        user_id=user.id,
        role=ChatRole.assistant,
        content=answer,
    )
    db.add(assistant_message)
    await record_ai_usage(db, user, "chat", client_ip(request))
    await db.commit()
    await db.refresh(user_message)
    await db.refresh(assistant_message)
    return ChatResponse(user_message=user_message, assistant_message=assistant_message)
