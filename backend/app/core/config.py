from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "InsightFlow API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/insightflow"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:4200"]
    )
    upload_dir: Path = Path("uploads")
    max_upload_size_mb: int = 10
    ai_provider: str = "local"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    ai_timeout_seconds: int = 30
    ai_max_retries: int = 3
    redis_url: str = "redis://localhost:6379/0"
    nlp_enable_transformers: bool = True
    nlp_allow_model_download: bool = False
    nlp_transformer_model: str = "distilbert-base-uncased"
    nlp_model_cache_dir: Path = Path("model-cache")
    nlp_max_chunks: int = 80
    nlp_chunk_size: int = 900
    nlp_chunk_overlap: int = 120
    nlp_embedding_batch_size: int = 8

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
