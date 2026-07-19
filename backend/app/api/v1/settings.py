from sqlalchemy import select

from app.api.dependencies import CurrentUser, DBSession
from app.models.workspace_settings import WorkspaceSettings
from app.schemas.settings import SettingsRead, SettingsUpdate
from fastapi import APIRouter

router = APIRouter(prefix="/settings", tags=["Settings"])


async def get_or_create_settings(db, user) -> WorkspaceSettings:
    workspace_settings = await db.scalar(
        select(WorkspaceSettings).where(WorkspaceSettings.user_id == user.id)
    )
    if not workspace_settings:
        workspace_settings = WorkspaceSettings(user_id=user.id)
        db.add(workspace_settings)
        await db.commit()
        await db.refresh(workspace_settings)
    return workspace_settings


@router.get("", response_model=SettingsRead)
async def get_settings(db: DBSession, user: CurrentUser) -> WorkspaceSettings:
    return await get_or_create_settings(db, user)


@router.put("", response_model=SettingsRead)
async def update_settings(
    payload: SettingsUpdate, db: DBSession, user: CurrentUser
) -> WorkspaceSettings:
    workspace_settings = await get_or_create_settings(db, user)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(workspace_settings, key, value)
    await db.commit()
    await db.refresh(workspace_settings)
    return workspace_settings
