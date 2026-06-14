$ErrorActionPreference = "Stop"
$env:DATABASE_URL = "sqlite+aiosqlite:///./insightflow.db"
$env:REDIS_URL = "redis://localhost:6379/0"
$env:AI_PROVIDER = "local"
$env:NLP_ALLOW_MODEL_DOWNLOAD = "false"

& "$PSScriptRoot\venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
