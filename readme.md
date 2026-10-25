# Competitive Exam Preparation Platform

A full-stack GATE DA/CS preparation platform built with **Next.js 16** (frontend) and **FastAPI** (backend).

## Quick Start

### 1. Backend (FastAPI)

```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # edit as needed
uvicorn app.main:app --reload --port 8000
```

Database tables are created automatically on startup. The application will seed demo accounts and a sample test on first run.

### 2. Frontend (Next.js)

```bash
cd apps/web
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL if needed
npm install
npm run dev
```

Open http://localhost:3000.

## Seeded Accounts (development only)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@examplatform.dev | Admin@Dev123 |
| Student | student@examplatform.dev | Student@Dev123 |
| Content Manager | content@examplatform.dev | Content@Dev123 |

> **Warning**: Change all passwords before any public deployment.

## Running Tests

```bash
cd apps/api
pip install -r requirements.txt
pytest tests/ -v
```

Tests use an isolated in-memory SQLite database — no external services required.

## Database Migrations

For production use PostgreSQL with Alembic:

```bash
cd apps/api
alembic upgrade head
```

## Production Checklist

- [ ] Set `APP_ENV=production` in backend `.env`
- [ ] Set a strong `JWT_SECRET_KEY` (≥ 32 random characters)
- [ ] Use PostgreSQL (`DATABASE_URL=postgresql+asyncpg://...`)
- [ ] Set `DEBUG=false`
- [ ] Change `BOOTSTRAP_ADMIN_PASSWORD`
- [ ] Set `CORS_ORIGINS` to your frontend domain
- [ ] Configure Redis for distributed rate limiting and token revocation
