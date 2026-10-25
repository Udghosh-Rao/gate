"""Production configuration guard tests."""

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def production_config(**overrides):
    values = {
        "APP_ENV": "production",
        "DEBUG": False,
        "DATABASE_URL": "postgresql+asyncpg://user:pass@db.example.test/app",
        "DATABASE_URL_SYNC": "postgresql://user:pass@db.example.test/app",
        "JWT_SECRET_KEY": "test-only-random-secret-long-enough-for-production-check",
        "REDIS_URL": "rediss://cache.example.test:6380/0",
        "CORS_ORIGINS": ["https://learn.example.test"],
        "RATE_LIMIT_ENABLED": True,
    }
    values.update(overrides)
    return values


def test_production_configuration_accepts_managed_services():
    settings = Settings(**production_config())
    assert settings.is_production


@pytest.mark.parametrize(
    "overrides",
    [
        {"DATABASE_URL": "sqlite+aiosqlite:///./local.db"},
        {"DATABASE_URL_SYNC": "sqlite:///./local.db"},
        {"REDIS_URL": "redis://cache.example.test:6379/0"},
        {"CORS_ORIGINS": ["*"]},
        {"RATE_LIMIT_ENABLED": False},
        {"DEBUG": True},
    ],
)
def test_production_configuration_rejects_insecure_values(overrides):
    with pytest.raises(ValidationError):
        Settings(**production_config(**overrides))
