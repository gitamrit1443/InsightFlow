from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dashboard import Dashboard
from app.models.project import Project
from app.models.uploaded_file import UploadedFile
from app.models.user import User
from app.services.ai_service import ai_service


async def generate_dashboard(
    db: AsyncSession, user: User, project: Project, files: list[UploadedFile]
) -> Dashboard:
    plan = await ai_service.generate_dashboard_plan(project, files)
    dashboard = Dashboard(
        project_id=project.id,
        user_id=user.id,
        name=f"{project.name} Overview",
        layout_config=plan,
    )
    db.add(dashboard)
    await db.commit()
    await db.refresh(dashboard)
    return dashboard
