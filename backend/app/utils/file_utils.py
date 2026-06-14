import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import settings

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".pdf", ".txt", ".json"}


def safe_filename(original_name: str) -> tuple[str, str]:
    suffix = Path(original_name).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}.",
        )
    stem = re.sub(r"[^A-Za-z0-9._-]+", "-", Path(original_name).stem).strip("-") or "file"
    return f"{stem[:80]}-{uuid.uuid4().hex}{suffix}", suffix.lstrip(".")


async def save_upload(upload: UploadFile, user_id: uuid.UUID) -> tuple[Path, int, str]:
    generated_name, file_type = safe_filename(upload.filename or "file")
    target_dir = settings.upload_dir / str(user_id)
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / generated_name
    size = 0
    try:
        with target.open("wb") as destination:
            while chunk := await upload.read(1024 * 1024):
                size += len(chunk)
                if size > settings.max_upload_size_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds the {settings.max_upload_size_mb}MB limit.",
                    )
                destination.write(chunk)
    except Exception:
        target.unlink(missing_ok=True)
        raise
    finally:
        await upload.close()
    return target, size, file_type
