"""FastAPI Application entry point for the Competitive Exam Platform.

Configures CORS, routers, database lifecycle, and health endpoints.
"""

from contextlib import asynccontextmanager
import os

from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from redis import Redis

from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.routers import auth, exams, tests, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: initialize DB tables on startup."""
    # Ensure upload directory exists BEFORE mounting static files
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    if settings.is_production:
        # Production uses managed object storage and private downloads; local
        # filesystem paths are never exposed as static content.
        Redis.from_url(settings.REDIS_URL).ping()
    # Uploaded files are served through an authorization-aware download route,
    # never through a static directory mount (which would expose drafts).

    # Create tables if not present
    if not settings.is_production:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    yield

    # Teardown
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="Multi-Exam Competitive Examination Platform API (GATE DA, CS, IIT JAM, etc.)",
    version="1.0.0",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under API prefix and root
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(exams.router, prefix=settings.API_V1_PREFIX)
app.include_router(tests.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Health"])
async def root():
    """Platform API welcome endpoint."""
    return {
        "name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "1.0.0",
        "docs": "/docs",
        "message": "Competitive Examination Platform API is operational",
    }


@app.get("/health", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check verifying database connectivity."""
    try:
        await db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"

    if db_status != "healthy":
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Database is unavailable")
    return {
        "status": "online" if db_status == "healthy" else "degraded",
        "database": db_status,
        "version": "1.0.0",
    }
