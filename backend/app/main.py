from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import register_error_handlers
from app.core.logging import configure_logging
from app.core.rate_limit import Limit, client_ip, enforce_limit, store
from app.db.base import Base
from app.db.database import engine

configure_logging()


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    if settings.database_url.startswith("sqlite"):
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
    await store.connect()
    yield
    await store.close()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def global_rate_limit(request: Request, call_next):
    if request.url.path not in {"/health", "/docs", "/openapi.json", "/redoc"}:
        try:
            await enforce_limit(
                f"rate:global:{client_ip(request)}",
                Limit(requests=100, window_seconds=60),
            )
        except HTTPException as exc:
            retry_after = int((exc.headers or {}).get("Retry-After", "60"))
            return JSONResponse(
                status_code=429,
                content={
                    "detail": exc.detail,
                    "code": "rate_limit_exceeded",
                    "retry_after": retry_after,
                },
                headers=exc.headers,
            )
    return await call_next(request)


register_error_handlers(app)
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["Health"])
async def health() -> dict[str, str]:
    return {"status": "healthy", "service": "insightflow-api"}
