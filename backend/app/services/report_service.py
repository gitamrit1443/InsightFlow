import json

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.report import Report
from app.models.user import User
from app.services.ai_service import ai_service


async def generate_report(
    db: AsyncSession, user: User, project: Project, insights: list, dashboards: list, title: str | None
) -> Report:
    result = await ai_service.generate_report(project, insights, dashboards)
    sections = [
        f"# {title or f'{project.name} Analysis Report'}",
        "## Executive Summary",
        result.get("executive_summary", "Analysis completed."),
    ]
    for key, heading in [
        ("key_findings", "Key Findings"),
        ("trends", "Trends"),
        ("anomalies", "Risks and Anomalies"),
        ("opportunities", "Opportunities"),
        ("recommendations", "Recommendations"),
        ("follow_up_questions", "Next Steps"),
    ]:
        sections.extend([f"## {heading}", "\n".join(f"- {item}" for item in result.get(key, []))])
    report = Report(
        project_id=project.id,
        user_id=user.id,
        title=title or f"{project.name} Analysis Report",
        content="\n\n".join(sections),
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report
