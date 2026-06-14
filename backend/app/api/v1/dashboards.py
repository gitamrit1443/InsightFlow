import uuid

from fastapi import APIRouter, HTTPException, Request, Response
from sqlalchemy import select

from app.api.dependencies import CurrentUser, DBSession, owned_project
from app.core.rate_limit import client_ip
from app.models.dashboard import Dashboard
from app.models.uploaded_file import FileStatus, UploadedFile
from app.schemas.dashboard import DashboardCreate, DashboardRead, DashboardUpdate
from app.services.dashboard_service import generate_dashboard
from app.services.rate_limit_service import enforce_ai_limits, record_ai_usage

router = APIRouter(tags=["Dashboards"])


async def owned_dashboard(db, user, dashboard_id: uuid.UUID) -> Dashboard:
    dashboard = await db.scalar(
        select(Dashboard).where(Dashboard.id == dashboard_id, Dashboard.user_id == user.id)
    )
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found.")
    return dashboard


@router.post("/projects/{project_id}/dashboards/generate", response_model=DashboardRead)
async def generate_project_dashboard(
    project_id: uuid.UUID, request: Request, db: DBSession, user: CurrentUser
) -> Dashboard:
    project = await owned_project(db, user, project_id)
    await enforce_ai_limits(db, user)
    files = list(
        (
            await db.scalars(
                select(UploadedFile).where(
                    UploadedFile.project_id == project_id,
                    UploadedFile.status == FileStatus.parsed,
                )
            )
        ).all()
    )
    dashboard = await generate_dashboard(db, user, project, files)
    await record_ai_usage(db, user, "dashboards/generate", client_ip(request))
    await db.commit()
    return dashboard


@router.get("/projects/{project_id}/dashboards", response_model=list[DashboardRead])
async def list_dashboards(
    project_id: uuid.UUID, db: DBSession, user: CurrentUser
) -> list[Dashboard]:
    await owned_project(db, user, project_id)
    return list(
        (
            await db.scalars(
                select(Dashboard)
                .where(Dashboard.project_id == project_id, Dashboard.user_id == user.id)
                .order_by(Dashboard.updated_at.desc())
            )
        ).all()
    )


@router.post("/projects/{project_id}/dashboards", response_model=DashboardRead, status_code=201)
async def create_dashboard(
    project_id: uuid.UUID, payload: DashboardCreate, db: DBSession, user: CurrentUser
) -> Dashboard:
    await owned_project(db, user, project_id)
    dashboard = Dashboard(project_id=project_id, user_id=user.id, **payload.model_dump())
    db.add(dashboard)
    await db.commit()
    await db.refresh(dashboard)
    return dashboard


@router.put("/dashboards/{dashboard_id}", response_model=DashboardRead)
async def update_dashboard(
    dashboard_id: uuid.UUID, payload: DashboardUpdate, db: DBSession, user: CurrentUser
) -> Dashboard:
    dashboard = await owned_dashboard(db, user, dashboard_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(dashboard, key, value)
    await db.commit()
    await db.refresh(dashboard)
    return dashboard


@router.delete("/dashboards/{dashboard_id}", status_code=204)
async def delete_dashboard(
    dashboard_id: uuid.UUID, db: DBSession, user: CurrentUser
) -> Response:
    dashboard = await owned_dashboard(db, user, dashboard_id)
    await db.delete(dashboard)
    await db.commit()
    return Response(status_code=204)
