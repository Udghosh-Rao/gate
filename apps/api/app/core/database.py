"""Async SQLAlchemy database engine and session management."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

import json
from uuid import UUID


def custom_json_serializer(obj):
    def default(o):
        if isinstance(o, UUID):
            return str(o)
        raise TypeError(f"Object of type {o.__class__.__name__} is not JSON serializable")
    return json.dumps(obj, default=default)


engine_kwargs = {
    "echo": settings.DEBUG,
    "json_serializer": custom_json_serializer,
}
if "sqlite" in settings.DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs.update({
        # Bound per-process connections; use the provider's pooled URL on
        # serverless deployments to avoid multiplying large pools per worker.
        "pool_size": 5,
        "max_overflow": 0,
        "pool_timeout": 10,
        "pool_pre_ping": True,
    })

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency that provides a database session per request."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
