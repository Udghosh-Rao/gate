"""Pytest configuration and shared fixtures for the API test suite.

The test suite uses an isolated in-memory SQLite database so that:
- Tests never touch the development or production database.
- Each test session starts from a clean, reproducible state.
- Seeded data (admin, student, exam, test) is created deterministically.
"""

import asyncio
import os
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

# Use in-memory SQLite — must be set before app module imports so config picks it up
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("DATABASE_URL_SYNC", "sqlite:///:memory:")
os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-pytest-only-32chars!")
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

from app.core.database import Base, get_db  # noqa: E402 — must follow env setup
from app.core.rate_limit import reset_rate_limits  # noqa: E402
from app.main import app  # noqa: E402


# ---------------------------------------------------------------------------
# Session-scoped async engine + schema creation
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def event_loop():
    """Single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create the database schema once per test session."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="session")
async def session_factory(test_engine):
    """Session factory bound to the in-memory test engine."""
    return async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)


@pytest_asyncio.fixture(scope="session")
async def seeded_db(session_factory):
    """Seed the in-memory database with required test data once per session.

    Calls the application's own seed_database() so test data stays in sync
    with the application's seed logic rather than being duplicated here.
    """
    from app.seed import seed_database
    async with session_factory() as db:
        await seed_database(db)
        await db.commit()


@pytest_asyncio.fixture()
async def db_session(session_factory, seeded_db) -> AsyncGenerator[AsyncSession, None]:
    """Per-test DB session with automatic rollback for test isolation."""
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture()
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """HTTP client wired to the test app using the injected test DB session."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Rate-limit reset — autouse: runs before/after every test
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset in-memory rate limiter before and after every test.

    Without this, repeated login calls during sequential test runs exhaust the
    rate limit window and cause subsequent tests to receive 429 responses.
    """
    reset_rate_limits()
    yield
    reset_rate_limits()

