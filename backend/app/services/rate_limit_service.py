from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import Limit, enforce_limit
from app.models.api_usage import ApiUsage
from app.models.user import User
from app.models.workspace_settings import WorkspaceSettings

PLAN_DAILY_LIMITS = {"free": 10, "pro": 200, "business": 2000}


async def enforce_ai_limits(db: AsyncSession, user: User) -> None:
    await enforce_limit(f"rate:ai:minute:{user.id}", Limit(5, 60))
    settings = await db.scalar(
        select(WorkspaceSettings).where(WorkspaceSettings.user_id == user.id)
    )
    plan = settings.billing_plan if settings else "free"
    daily_limit = PLAN_DAILY_LIMITS.get(plan, PLAN_DAILY_LIMITS["free"])
    today = datetime.now(timezone.utc).date()
    used = await db.scalar(
        select(func.count(ApiUsage.id)).where(
            ApiUsage.user_id == user.id,
            ApiUsage.route.in_(
                [
                    "insights/generate",
                    "dashboards/generate",
                    "reports/generate",
                    "chat",
                ]
            ),
            func.date(ApiUsage.created_at) == today,
            ApiUsage.status_code < 500,
        )
    )
    if (used or 0) >= daily_limit:
        raise HTTPException(
            status_code=429,
            detail=f"Daily AI request limit reached for the {plan} plan.",
            headers={"Retry-After": "3600"},
        )


async def record_ai_usage(
    db: AsyncSession,
    user: User,
    route: str,
    ip_address: str,
    status_code: int = 200,
    tokens_used: int = 0,
) -> None:
    db.add(
        ApiUsage(
            user_id=user.id,
            route=route,
            method="POST",
            ip_address=ip_address,
            tokens_used=tokens_used,
            status_code=status_code,
        )
    )
