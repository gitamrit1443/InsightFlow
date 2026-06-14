from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import ORJSONResponse


class AppError(Exception):
    def __init__(self, detail: str, status_code: int = 400, code: str = "application_error"):
        self.detail = detail
        self.status_code = status_code
        self.code = code
        super().__init__(detail)


def error_payload(detail: str, code: str, **extra: Any) -> dict[str, Any]:
    return {"detail": detail, "code": code, **extra}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> ORJSONResponse:
        return ORJSONResponse(
            status_code=exc.status_code,
            content=error_payload(exc.detail, exc.code),
        )

    @app.exception_handler(HTTPException)
    async def http_error_handler(_: Request, exc: HTTPException) -> ORJSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else "Request failed."
        extra: dict[str, Any] = {}
        if exc.status_code == 429 and exc.headers and exc.headers.get("Retry-After"):
            extra["retry_after"] = int(exc.headers["Retry-After"])
        return ORJSONResponse(
            status_code=exc.status_code,
            content=error_payload(
                detail,
                "rate_limit_exceeded" if exc.status_code == 429 else "http_error",
                **extra,
            ),
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        _: Request, exc: RequestValidationError
    ) -> ORJSONResponse:
        return ORJSONResponse(
            status_code=422,
            content=error_payload(
                "The request contains invalid data.",
                "validation_error",
                errors=exc.errors(),
            ),
        )
