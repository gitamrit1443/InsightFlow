from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app.api.dependencies import CurrentUser, DBSession
from app.core.rate_limit import ip_rate_limit
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserRead
from app.services.auth_service import authenticate_user, register_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=201,
    dependencies=[Depends(ip_rate_limit("register", 5, 3600))],
)
async def register(payload: RegisterRequest, db: DBSession) -> TokenResponse:
    return await register_user(db, payload)


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(ip_rate_limit("login", 10, 900))],
)
async def login(payload: LoginRequest, db: DBSession) -> TokenResponse:
    return await authenticate_user(db, payload)


@router.get("/me", response_model=UserRead)
async def me(user: CurrentUser) -> UserRead:
    return user
