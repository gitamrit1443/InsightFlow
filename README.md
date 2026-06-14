# InsightFlow

InsightFlow is a full-stack AI analytics SaaS application. Users create projects, upload business data, parse structured and unstructured files, generate insights and dashboards, chat with project context, and produce stakeholder reports.

## Stack

- Angular 21, standalone components, signals, reactive forms, routing, functional HTTP interceptors
- Tailwind CSS with responsive light/dark UI
- FastAPI, Pydantic v2, async SQLAlchemy 2.x
- PostgreSQL 17 and Alembic migrations
- Redis rate limiting with an automatic in-memory development fallback
- JWT authentication and bcrypt password hashing
- Local TensorFlow transformer embeddings, NLP analysis, RAG retrieval, and an optional OpenAI-compatible provider
- Docker Compose for the complete local environment

## Features

- Registration, login, protected routes, and user-owned resources
- Project CRUD with search and pagination
- CSV, XLSX, PDF, TXT, and JSON uploads up to 10MB
- Background parsing with explicit processing retry
- Local document chunking, transformer embeddings, keyword/entity extraction, sentiment, and retrieval indexing
- Real tabular profiling with missing values, correlations, IQR anomalies, categories, and time trends
- AI summaries, findings, trends, anomalies, opportunities, recommendations, and follow-up questions
- Generated dashboard plans with editable widgets
- Project-aware AI chat with saved history
- Generated reports and export integration placeholders
- Workspace theme, notification, retention, and billing-plan settings
- Structured API errors, loading states, toasts, duplicate-action prevention, and responsive navigation

## Quick Start With Docker

1. Create the local environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Replace `SECRET_KEY` in `.env`.

3. Build and start all services:

   ```bash
   docker compose up --build
   ```

4. Seed the demo workspace:

   ```bash
   docker compose exec backend python -m app.seed
   ```

Open:

- Frontend: http://localhost:4200
- API: http://localhost:8000
- Swagger documentation: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

Demo credentials:

- Email: `demo@insightflow.ai`
- Password: `Demo1234!`

## Backend Development

Python 3.11+ and a running PostgreSQL/Redis environment are required.

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item ..\.env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

Run the seed:

```powershell
python -m app.seed
```

Create a migration after model changes:

```powershell
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Frontend Development

Node.js 22+ and npm are required.

```powershell
Set-Location frontend
npm install
npm start
```

The local development frontend calls `http://localhost:8001/api/v1`. Docker serves the backend on port `8000`.

For local development without Docker:

```powershell
cd backend
.\run-local.ps1
```

Production build:

```powershell
npm run build
```

## Environment Variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | Async SQLAlchemy PostgreSQL connection | Docker PostgreSQL service |
| `SECRET_KEY` | JWT signing secret | Must be changed |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `1440` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | `http://localhost:4200` |
| `UPLOAD_DIR` | Private uploaded-file directory | `uploads` |
| `MAX_UPLOAD_SIZE_MB` | Per-file upload limit | `10` |
| `REDIS_URL` | Shared rate-limit store | Docker Redis service |
| `AI_PROVIDER` | `local`, `openai`, or `openai-compatible` | `local` |
| `OPENAI_API_KEY` | Provider credential | Empty |
| `OPENAI_MODEL` | OpenAI-compatible model name | `gpt-4o-mini` |
| `AI_TIMEOUT_SECONDS` | Provider timeout | `30` |
| `AI_MAX_RETRIES` | Exponential-backoff attempt count | `3` |
| `NLP_ENABLE_TRANSFORMERS` | Prefer TensorFlow transformer embeddings | `true` |
| `NLP_ALLOW_MODEL_DOWNLOAD` | Permit model downloads inside upload requests | `false` |
| `NLP_TRANSFORMER_MODEL` | Hugging Face model used by `TFAutoModel` | `distilbert-base-uncased` |
| `NLP_MODEL_CACHE_DIR` | Local transformer cache directory | `model-cache` |
| `NLP_MAX_CHUNKS` | Maximum chunks persisted per file | `80` |

## Rate Limiting

InsightFlow uses Redis when available and falls back to an in-process limiter for local development.

- Global API: 100 requests/minute/IP
- Registration: 5 requests/hour/IP
- Login: 10 requests/15 minutes/IP
- Uploads: 10/hour/user
- AI calls: 5/minute/user
- Daily AI quota: Free 10, Pro 200, Business 2,000

Limit responses use HTTP `429`:

```json
{
  "detail": "Rate limit exceeded. Please try again later.",
  "code": "rate_limit_exceeded",
  "retry_after": 42
}
```

The Angular rate-limit interceptor displays: “Too many requests. Please wait and try again.”

## AI Providers

The default `AI_PROVIDER=local` does not require a paid API. During file processing InsightFlow:

1. Extracts text and structured tables.
2. Splits content into overlapping retrieval chunks.
3. Creates embeddings with TensorFlow and Hugging Face Transformers.
4. Falls back to TF-IDF if the transformer model cannot load.
5. Extracts keywords, entities, lexical sentiment, summaries, anomalies, correlations, categories, and time trends.
6. Persists the document index inside the file analysis data for project chat and reports.

Download the transformer explicitly before the first run:

```powershell
cd backend
.\venv\Scripts\python.exe -m app.download_models
```

Upload requests never wait indefinitely for a model download. If the model is not cached, InsightFlow immediately uses the local TF-IDF retrieval fallback. Docker Compose persists downloaded models in the `model_cache` volume. Allocate at least 4GB RAM to Docker Desktop for the transformer runtime.

Set `AI_PROVIDER=openai` and `OPENAI_API_KEY` only when an external model should enhance the locally extracted context.

The provider boundary is in `backend/app/services/ai_service.py`. It includes:

- Structured JSON responses
- Timeout and exponential retry
- Circuit breaker after repeated failures
- Graceful local NLP fallback
- In-process output caching

For multi-instance production deployments, move AI result caching to Redis or PostgreSQL and configure the compatible provider base URL through a deployment-specific provider class.

## Security Notes

- Every project-owned query is scoped to the authenticated user.
- Filenames are normalized and randomized before storage.
- Upload extensions and byte size are validated server-side.
- Secrets are loaded from environment variables and excluded from source control.
- SQLAlchemy parameterization prevents SQL injection.
- Local storage is used for the development JWT as requested. For a hardened browser deployment, migrate access/refresh tokens to secure, same-site, HTTP-only cookies.

## Project Layout

```text
.
├── backend
│   ├── alembic
│   ├── app
│   │   ├── api/v1
│   │   ├── core
│   │   ├── db
│   │   ├── models
│   │   ├── schemas
│   │   ├── services
│   │   └── utils
│   └── requirements.txt
├── frontend
│   └── src/app
│       ├── core
│       ├── features
│       └── shared
├── docker-compose.yml
└── .env.example
```
