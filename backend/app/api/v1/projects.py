import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import func, select

from app.api.dependencies import CurrentUser, DBSession, owned_project
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectList, ProjectRead, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=ProjectList)
async def list_projects(
    db: DBSession,
    user: CurrentUser,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    search: str | None = None,
) -> ProjectList:
    filters = [Project.user_id == user.id]
    if search:
        filters.append(Project.name.ilike(f"%{search.strip()}%"))
    total = await db.scalar(select(func.count(Project.id)).where(*filters))
    projects = (
        await db.scalars(
            select(Project)
            .where(*filters)
            .order_by(Project.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()
    return ProjectList(items=list(projects), total=total or 0, page=page, page_size=page_size)


@router.post("", response_model=ProjectRead, status_code=201)
async def create_project(payload: ProjectCreate, db: DBSession, user: CurrentUser) -> Project:
    project = Project(user_id=user.id, **payload.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(project_id: uuid.UUID, db: DBSession, user: CurrentUser) -> Project:
    return await owned_project(db, user, project_id)


@router.put("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: uuid.UUID, payload: ProjectUpdate, db: DBSession, user: CurrentUser
) -> Project:
    project = await owned_project(db, user, project_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    await db.commit()
    await db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: uuid.UUID, db: DBSession, user: CurrentUser
) -> Response:
    project = await owned_project(db, user, project_id)
    await db.delete(project)
    await db.commit()
    return Response(status_code=204)
