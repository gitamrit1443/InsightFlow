import json
from typing import Any


def truncate_text(value: str, limit: int = 50_000) -> str:
    return value if len(value) <= limit else f"{value[:limit]}\n[Content truncated]"


def data_preview(value: Any, limit: int = 12_000) -> str:
    return truncate_text(json.dumps(value, default=str, ensure_ascii=True, indent=2), limit)
