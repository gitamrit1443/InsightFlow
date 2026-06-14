import asyncio

from sqlalchemy import select

from app.core.security import hash_password
from app.db.database import AsyncSessionLocal
from app.models.dashboard import Dashboard
from app.models.insight import Insight
from app.models.project import Project
from app.models.user import User
from app.models.workspace_settings import WorkspaceSettings


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        existing = await db.scalar(select(User).where(User.email == "demo@insightflow.ai"))
        if existing:
            print("Demo user already exists.")
            return
        user = User(
            name="Demo Analyst",
            email="demo@insightflow.ai",
            password_hash=hash_password("Demo1234!"),
        )
        db.add(user)
        await db.flush()
        db.add(
            WorkspaceSettings(
                user_id=user.id,
                organization_name="InsightFlow Demo",
                billing_plan="pro",
            )
        )
        project = Project(
            user_id=user.id,
            name="Q4 Customer Feedback Analysis",
            category="Customer Success",
            description="A consolidated view of Q4 customer feedback and account health.",
            goal="Understand feedback trends and churn risks",
        )
        db.add(project)
        await db.flush()
        db.add_all(
            [
                Insight(
                    project_id=project.id,
                    user_id=user.id,
                    type="summary",
                    title="Executive Summary",
                    content="Customer sentiment improved through Q4, while response time remains the strongest churn-risk signal.",
                    confidence_score=0.88,
                    metadata_={"source": "demo"},
                ),
                Insight(
                    project_id=project.id,
                    user_id=user.id,
                    type="recommendations",
                    title="Recommended Actions",
                    content="- Prioritize accounts with repeated response-time complaints.\n- Expand onboarding guidance for the reporting workflow.",
                    confidence_score=0.84,
                    metadata_={"source": "demo"},
                ),
                Dashboard(
                    project_id=project.id,
                    user_id=user.id,
                    name="Q4 Feedback Overview",
                    layout_config={
                        "widgets": [
                            {"type": "kpi", "title": "Responses", "value": 1842},
                            {"type": "kpi", "title": "Sentiment", "value": "72%"},
                            {"type": "line", "title": "Weekly sentiment", "series": [62, 65, 67, 69, 72, 74]},
                            {"type": "pie", "title": "Feedback themes", "series": [38, 27, 21, 14]},
                        ]
                    },
                ),
            ]
        )
        await db.commit()
        print("Seeded demo@insightflow.ai / Demo1234!")


if __name__ == "__main__":
    asyncio.run(seed())
