import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Response, UploadFile
from sqlalchemy import select

from app.api.dependencies import CurrentUser, DBSession, owned_project
from app.core.rate_limit import user_rate_limit
from app.db.database import AsyncSessionLocal
from app.models.uploaded_file import UploadedFile
from app.schemas.file import FileRead
from app.services.file_parser_service import process_file
from app.utils.file_utils import save_upload

router = APIRouter(tags=["Files"])


async def process_file_background(file_id: uuid.UUID) -> None:
    async with AsyncSessionLocal() as db:
        uploaded_file = await db.get(UploadedFile, file_id)
        if uploaded_file:
            await process_file(db, uploaded_file)


async def owned_file(db, user, file_id: uuid.UUID) -> UploadedFile:
    uploaded_file = await db.scalar(
        select(UploadedFile).where(
            UploadedFile.id == file_id, UploadedFile.user_id == user.id
        )
    )
    if not uploaded_file:
        raise HTTPException(status_code=404, detail="File not found.")
    return uploaded_file


@router.post(
    "/projects/{project_id}/files/upload",
    response_model=FileRead,
    status_code=201,
    dependencies=[Depends(user_rate_limit("upload", 10, 3600))],
)
async def upload_file(
    project_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: DBSession,
    user: CurrentUser,
    file: UploadFile = File(...),
) -> UploadedFile:
    await owned_project(db, user, project_id)
    path, size, file_type = await save_upload(file, user.id)
    uploaded_file = UploadedFile(
        project_id=project_id,
        user_id=user.id,
        file_name=path.name,
        original_name=file.filename or path.name,
        file_type=file_type,
        file_path=str(path.resolve()),
        file_size=size,
    )
    db.add(uploaded_file)
    await db.commit()
    await db.refresh(uploaded_file)
    background_tasks.add_task(process_file_background, uploaded_file.id)
    return uploaded_file


@router.get("/projects/{project_id}/files", response_model=list[FileRead])
async def list_files(project_id: uuid.UUID, db: DBSession, user: CurrentUser) -> list[UploadedFile]:
    await owned_project(db, user, project_id)
    return list(
        (
            await db.scalars(
                select(UploadedFile)
                .where(UploadedFile.project_id == project_id, UploadedFile.user_id == user.id)
                .order_by(UploadedFile.created_at.desc())
            )
        ).all()
    )


@router.get("/files/{file_id}", response_model=FileRead)
async def get_file(file_id: uuid.UUID, db: DBSession, user: CurrentUser) -> UploadedFile:
    return await owned_file(db, user, file_id)


@router.post("/files/{file_id}/process", response_model=FileRead)
async def process_uploaded_file(
    file_id: uuid.UUID, db: DBSession, user: CurrentUser
) -> UploadedFile:
    uploaded_file = await owned_file(db, user, file_id)
    return await process_file(db, uploaded_file)


@router.delete("/files/{file_id}", status_code=204)
async def delete_file(file_id: uuid.UUID, db: DBSession, user: CurrentUser) -> Response:
    uploaded_file = await owned_file(db, user, file_id)
    path = Path(uploaded_file.file_path)
    await db.delete(uploaded_file)
    await db.commit()
    path.unlink(missing_ok=True)
    return Response(status_code=204)
