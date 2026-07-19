import json

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.insight import Insight
from app.models.project import Project
from app.models.uploaded_file import UploadedFile
from app.models.user import User
from app.services.ai_service import ai_service


async def generate_project_insights(
    db: AsyncSession, user: User, project: Project, files: list[UploadedFile]
) -> list[Insight]:
    result = await ai_service.generate_insights(project, files)
    insights = [
        Insight(
            project_id=project.id,
            user_id=user.id,
            type="summary",
            title="Executive Summary",
            content=result.get("executive_summary", "Analysis completed."),
            confidence_score=result.get("confidence_score"),
            metadata_={
                "provider": result.get("provider"),
                "cached": result.get("cached", False),
                "sentiment_score": result.get("sentiment_score"),
                "top_keywords": result.get("top_keywords", []),
            },
        )
    ]
    for section, title in [
        ("key_findings", "Key Findings"),
        ("trends", "Important Trends"),
        ("anomalies", "Anomalies and Risks"),
        ("opportunities", "Business Opportunities"),
        ("recommendations", "Recommended Actions"),
        ("follow_up_questions", "Suggested Questions"),
    ]:
        values = result.get(section, [])
        insights.append(
            Insight(
                project_id=project.id,
                user_id=user.id,
                type=section,
                title=title,
                content="\n".join(f"- {value}" for value in values) or "No findings available.",
                confidence_score=result.get("confidence_score"),
                metadata_={"source": result.get("provider", "local-nlp")},
            )
        )
    db.add_all(insights)
    await db.commit()
    for insight in insights:
        await db.refresh(insight)
    return insights
