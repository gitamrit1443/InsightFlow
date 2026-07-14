from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _truncate(password: str) -> str:
    """Bcrypt silently ignores bytes beyond 72 — truncate explicitly to avoid passlib version bug."""
    encoded = password.encode("utf-8")
    return encoded[:72].decode("utf-8", errors="ignore")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return password_context.verify(_truncate(plain_password), hashed_password)
    except Exception:
        # Fallback to direct bcrypt
        import bcrypt
        return bcrypt.checkpw(plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8"))


def hash_password(password: str) -> str:
    try:
        return password_context.hash(_truncate(password))
    except Exception:
        # Fallback to direct bcrypt
        import bcrypt
        hashed = bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt())
        return hashed.decode("utf-8")


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expires = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload: dict[str, Any] = {"sub": subject, "exp": expires, "type": "access"}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "access":
            return None
        return payload.get("sub")
    except JWTError:
        return None
