from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.models.workspace_settings import WorkspaceSettings
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


async def register_user(db: AsyncSession, payload: RegisterRequest) -> TokenResponse:
    email = payload.email.lower()
    exists = await db.scalar(select(User.id).where(func.lower(User.email) == email))
    if exists:
        from fastapi import HTTPException

        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = User(name=payload.name.strip(), email=email, password_hash=hash_password(payload.password))
    db.add(user)
    await db.flush()
    db.add(WorkspaceSettings(user_id=user.id))
    await db.commit()
    await db.refresh(user)
    return TokenResponse(access_token=create_access_token(str(user.id)), user=user)


async def authenticate_user(db: AsyncSession, payload: LoginRequest) -> TokenResponse:
    from fastapi import HTTPException

    user = await db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account is inactive.")
    return TokenResponse(access_token=create_access_token(str(user.id)), user=user)
