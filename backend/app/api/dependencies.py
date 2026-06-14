import uuid
from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.project import Project
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)
DBSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DBSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication is required.")
    subject = decode_access_token(credentials.credentials)
    try:
        user_id = uuid.UUID(subject) if subject else None
    except ValueError:
        user_id = None
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired access token.")
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User account is unavailable.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def owned_project(db: AsyncSession, user: User, project_id: uuid.UUID) -> Project:
    project = await db.scalar(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    return project
