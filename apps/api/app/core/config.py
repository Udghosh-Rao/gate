"""Application configuration loaded from environment variables."""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator, model_validator


class Settings(BaseSettings):
    """Central configuration for the Exam Platform API."""

    # Application
    APP_NAME: str = "ExamPlatform"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///examplatform.db"
    DATABASE_URL_SYNC: str = "sqlite:///examplatform.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "CHANGE_THIS_TO_A_RANDOM_SECRET_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 50
    UPLOAD_DIR: str = "./uploads"

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    AUTH_RATE_LIMIT_PER_MINUTE: int = 15

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | List[str]) -> List[str]:
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        return v

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        """Enforce strict security in production environments."""
        if self.is_production:
            insecure_secrets = [
                "CHANGE_THIS_TO_A_RANDOM_SECRET_IN_PRODUCTION",
                "secret",
                "changeme",
                "admin",
                "password",
                "devpassword123",
            ]
            if not self.JWT_SECRET_KEY or self.JWT_SECRET_KEY in insecure_secrets or len(self.JWT_SECRET_KEY) < 32:
                raise ValueError(
                    "Production security violation: JWT_SECRET_KEY must be a strong, cryptographically random secret of at least 32 characters in production."
                )
            if self.DEBUG:
                raise ValueError("Production security violation: DEBUG mode must be disabled in production.")
            if "sqlite" in self.DATABASE_URL.lower():
                raise ValueError("Production security violation: SQLite is not supported for production. Use PostgreSQL.")
            if "sqlite" in self.DATABASE_URL_SYNC.lower():
                raise ValueError("Production security violation: DATABASE_URL_SYNC must point to PostgreSQL for release migrations.")
            if not self.REDIS_URL.lower().startswith("rediss://"):
                raise ValueError("Production security violation: configure shared TLS-enabled Redis for revocation and rate limits.")
            if not self.RATE_LIMIT_ENABLED:
                raise ValueError("Production security violation: RATE_LIMIT_ENABLED must be true.")
            if any(origin.startswith(("http://localhost", "http://127.0.0.1")) for origin in self.CORS_ORIGINS):
                raise ValueError("Production security violation: remove localhost origins from CORS_ORIGINS.")
            if "*" in self.CORS_ORIGINS:
                raise ValueError("Production security violation: CORS_ORIGINS must list exact trusted origins.")
        return self

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()

