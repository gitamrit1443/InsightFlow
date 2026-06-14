import uuid

from fastapi import APIRouter, HTTPException, Request, Response
from sqlalchemy import select

from app.api.dependencies import CurrentUser, DBSession, owned_project
from app.core.rate_limit import client_ip
from app.models.dashboard import Dashboard
from app.models.insight import Insight
from app.models.report import Report
from app.schemas.report import ReportGenerateRequest, ReportRead
from app.services.rate_limit_service import enforce_ai_limits, record_ai_usage
from app.services.report_service import generate_report

router = APIRouter(tags=["Reports"])


@router.post("/projects/{project_id}/reports/generate", response_model=ReportRead)
async def generate_project_report(
    project_id: uuid.UUID,
    payload: ReportGenerateRequest,
    request: Request,
    db: DBSession,
    user: CurrentUser,
) -> Report:
    project = await owned_project(db, user, project_id)
    await enforce_ai_limits(db, user)
    insights = list(
        (await db.scalars(select(Insight).where(Insight.project_id == project_id))).all()
    )
    dashboards = list(
        (await db.scalars(select(Dashboard).where(Dashboard.project_id == project_id))).all()
    )
    report = await generate_report(db, user, project, insights, dashboards, payload.title)
    await record_ai_usage(db, user, "reports/generate", client_ip(request))
    await db.commit()
    return report


@router.get("/projects/{project_id}/reports", response_model=list[ReportRead])
async def list_reports(project_id: uuid.UUID, db: DBSession, user: CurrentUser) -> list[Report]:
    await owned_project(db, user, project_id)
    return list(
        (
            await db.scalars(
                select(Report)
                .where(Report.project_id == project_id, Report.user_id == user.id)
                .order_by(Report.updated_at.desc())
            )
        ).all()
    )


@router.get("/reports/{report_id}", response_model=ReportRead)
async def get_report(report_id: uuid.UUID, db: DBSession, user: CurrentUser) -> Report:
    report = await db.scalar(
        select(Report).where(Report.id == report_id, Report.user_id == user.id)
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return report


@router.delete("/reports/{report_id}", status_code=204)
async def delete_report(report_id: uuid.UUID, db: DBSession, user: CurrentUser) -> Response:
    report = await get_report(report_id, db, user)
    await db.delete(report)
    await db.commit()
    return Response(status_code=204)
