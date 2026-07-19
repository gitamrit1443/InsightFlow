# InsightFlow

InsightFlow is a full-stack AI-powered platform for analyzing project documents, extracting insights, and managing projects through a modern dashboard.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Roadmap](#-roadmap)
- [Author](#-author)

---

## 🧭 Overview

InsightFlow lets teams upload project documents (PDFs, spreadsheets, reports) and get AI-generated insights back — summaries, key data points, and answers to natural-language questions — all through a single dashboard. JWT authentication, Redis rate-limiting, and a reactive Angular frontend keep it production-ready as a real multi-user product.

---

## ✨ Features

- 🔐 **Secure Authentication** — JWT-based login with hashed credentials (Passlib + Bcrypt)
- 📁 **Project Workspaces** — Organise files, insights, dashboards, and reports per project
- 📄 **Document Upload & Parsing** — PDF and Excel ingestion with PyPDF and OpenPyXL
- 🤖 **AI-Powered Insight Extraction** — NLP analysis via Hugging Face Transformers, with local ML support through TensorFlow
- 💬 **AI Chat** — Ask questions about your uploaded data in natural language
- 📊 **Dashboards & Reports** — Visual summaries and exportable reports
- 🚦 **API Rate Limiting** — Redis-backed throttling to protect backend resources
- 🗄️ **Versioned Schema** — Alembic-managed migrations over SQLAlchemy models
- 📱 **Responsive UI** — Tailwind CSS across screen sizes

---

## 🛠️ Tech Stack

### Frontend
- **Angular 21** – Single-page application framework
- **TypeScript** – Type-safe frontend development
- **Tailwind CSS** – Responsive, utility-first styling
- **RxJS** – Reactive data handling
- **Angular Reactive Forms** – Form validation and user input handling

### Backend
- **FastAPI** – High-performance Python REST API framework
- **Python** – Backend development
- **Uvicorn** – ASGI server for FastAPI
- **Pydantic** – Request validation and settings management
- **SQLAlchemy** – Database ORM
- **Alembic** – Database migrations

### Database & Security
- **SQLite** – Lightweight local database
- **JWT (python-jose)** – Secure authentication tokens
- **Passlib + Bcrypt** – Password hashing
- **Redis** – API rate limiting

### AI & File Processing
- **Hugging Face Transformers** – NLP-based text analysis
- **TensorFlow** – Local ML model support
- **PyPDF** – PDF text extraction
- **OpenPyXL** – Excel file processing

### Deployment
- **Netlify** – Frontend deployment
- **Render** – FastAPI backend deployment

---

## 🖼️ Screenshots

| | |
|---|---|
| **Home — Workspace Overview** <br> ![Home](frontend/public/Data/Screenshot%202026-07-15%20005529.png) | **Projects** <br> ![Projects](frontend/public/Data/Screenshot%202026-07-15%20005611.png) |
| **Upload Data** <br> ![Upload](frontend/public/Data/Screenshot%202026-07-15%20005701.png) | ![Screen](frontend/public/Data/Screenshot%202026-07-19%20204307.png) |
| ![Screen](frontend/public/Data/Screenshot%202026-07-19%20204401.png) | ![Screen](frontend/public/Data/Screenshot%202026-07-19%20204439.png) |
| ![Screen](frontend/public/Data/Screenshot%202026-07-19%20204503.png) | ![Screen](frontend/public/Data/Screenshot%202026-07-19%20204532.png) |
| ![Screen](frontend/public/Data/Screenshot%202026-07-19%20204617.png) | ![Screen](frontend/public/Data/Screenshot%202026-07-19%20204643.png) |
| ![Screen](frontend/public/Data/Screenshot%202026-07-19%20204706.png) | ![Screen](frontend/public/Data/Screenshot%202026-07-19%20204728.png) |

---

## 🏗️ Architecture

```
┌─────────────────────┐        REST API (JSON/HTTPS)      ┌───────────────────────────┐
│    Angular 21 (UI)   │ ────────────────────────────────▶ │         FastAPI             │
│  Tailwind + RxJS     │ ◀──────────────────────────────── │   Pydantic + JWT auth       │
└─────────────────────┘                                    └────────────┬──────────────┘
                                                                        │
                                           ┌────────────────────────────┼──────────────────────────┐
                                           ▼                            ▼                          ▼
                                  ┌─────────────────┐       ┌──────────────────┐     ┌───────────────────────┐
                                  │  SQLite (via     │       │  Redis (rate      │     │  HF Transformers /    │
                                  │  SQLAlchemy +    │       │  limiting)        │     │  TensorFlow + PyPDF / │
                                  │  Alembic)        │       │                  │     │  OpenPyXL (analysis)  │
                                  └─────────────────┘       └──────────────────┘     └───────────────────────┘

Frontend → Netlify        Backend → Render
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) & npm
- Python 3.11+
- Redis (local or hosted instance)
- Angular CLI (`npm install -g @angular/cli`)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the API
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
ng serve
```

App runs at `http://localhost:4200`, API at `http://localhost:8000`.

---

## 📁 Project Structure

```
InsightFlow/
├── frontend/
│   ├── public/
│   │   └── Data/                  ← Screenshots
│   └── src/
│       └── app/
│           ├── auth/
│           ├── dashboard/
│           ├── projects/
│           ├── insights/
│           ├── ai-chat/
│           ├── reports/
│           ├── shared/
│           └── core/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── core/
│   ├── alembic/
│   └── requirements.txt
└── README.md
```

---

## 🗺️ Roadmap

- [ ] Real-time collaborative document review
- [ ] Multi-format export (PDF/Excel reports of insights)
- [ ] Role-based team workspaces
- [ ] Migration path from SQLite to PostgreSQL for production scale

---

## 👨‍💻 Author

**Amrit Pal Singh**
Full Stack Developer | Angular & FastAPI

- Portfolio: [amritcode](https://amritpalsingh-portfolio.netlify.app)
- GitHub: [@gitamrit1443](https://github.com/gitamrit1443)

---

⭐ If you found this project interesting, consider giving it a star!
