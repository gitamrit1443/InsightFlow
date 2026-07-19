from fastapi import APIRouter

from app.api.v1 import auth, chat, dashboards, files, insights, projects, reports, settings, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(files.router)
api_router.include_router(insights.router)
api_router.include_router(dashboards.router)
api_router.include_router(reports.router)
api_router.include_router(chat.router)
api_router.include_router(settings.router)
