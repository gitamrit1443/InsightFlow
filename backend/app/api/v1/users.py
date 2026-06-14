from fastapi import APIRouter

from app.api.dependencies import CurrentUser
from app.schemas.user import UserRead

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
async def current_user(user: CurrentUser) -> UserRead:
    return user
