import uuid

from fastapi import APIRouter, HTTPException, Request, Response
from sqlalchemy import select

from app.api.dependencies import CurrentUser, DBSession, owned_project
from app.core.rate_limit import client_ip
from app.models.insight import Insight
from app.models.uploaded_file import FileStatus, UploadedFile
from app.schemas.insight import InsightCreate, InsightRead
from app.services.insight_service import generate_project_insights
from app.services.rate_limit_service import enforce_ai_limits, record_ai_usage

router = APIRouter(tags=["Insights"])


@router.post("/projects/{project_id}/insights/generate", response_model=list[InsightRead])
async def generate_insights(
    project_id: uuid.UUID, request: Request, db: DBSession, user: CurrentUser
) -> list[Insight]:
    project = await owned_project(db, user, project_id)
    await enforce_ai_limits(db, user)
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
    if not files:
        raise HTTPException(status_code=409, detail="Process at least one file before generating insights.")
    insights = await generate_project_insights(db, user, project, files)
    await record_ai_usage(db, user, "insights/generate", client_ip(request))
    await db.commit()
    return insights


@router.get("/projects/{project_id}/insights", response_model=list[InsightRead])
async def list_insights(
    project_id: uuid.UUID, db: DBSession, user: CurrentUser
) -> list[Insight]:
    await owned_project(db, user, project_id)
    return list(
        (
            await db.scalars(
                select(Insight)
                .where(Insight.project_id == project_id, Insight.user_id == user.id)
                .order_by(Insight.created_at.desc())
            )
        ).all()
    )


@router.post("/projects/{project_id}/insights", response_model=InsightRead, status_code=201)
async def create_insight(
    project_id: uuid.UUID, payload: InsightCreate, db: DBSession, user: CurrentUser
) -> Insight:
    await owned_project(db, user, project_id)
    data = payload.model_dump()
    metadata = data.pop("metadata", None)
    insight = Insight(project_id=project_id, user_id=user.id, metadata_=metadata, **data)
    db.add(insight)
    await db.commit()
    await db.refresh(insight)
    return insight


@router.delete("/insights/{insight_id}", status_code=204)
async def delete_insight(
    insight_id: uuid.UUID, db: DBSession, user: CurrentUser
) -> Response:
    insight = await db.scalar(
        select(Insight).where(Insight.id == insight_id, Insight.user_id == user.id)
    )
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found.")
    await db.delete(insight)
    await db.commit()
    return Response(status_code=204)
