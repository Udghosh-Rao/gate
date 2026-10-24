# Exam Platform - Multi-Exam Competitive Examination Platform

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)

### 1. Start Infrastructure
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
alembic upgrade head
python -m app.seed  # Seed development data
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

### 4. Access
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Development Accounts (DEV ONLY)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@examplatform.dev | Admin@Dev123 |
| Student | student@examplatform.dev | Student@Dev123 |
| Content Manager | content@examplatform.dev | Content@Dev123 |

> ⚠️ These credentials are for development only and must not be used in production.

### Running Tests
```bash
# Backend
cd apps/api
pytest

# E2E
cd apps/web
npx playwright test
```

## Architecture
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2
- **Database**: PostgreSQL 16
- **Cache**: Redis 7

See `docs/` for detailed documentation.
