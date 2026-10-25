import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict

import bcrypt
import jwt
from redis import Redis

from app.core.config import settings

# In-memory revocation set mapping jti or token hash -> expiry timestamp
_REVOKED_TOKENS: Dict[str, datetime] = {}
_revocation_store = Redis.from_url(settings.REDIS_URL, decode_responses=True)


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt directly."""
    pwd_bytes = password.encode("utf-8")
    if len(pwd_bytes) > 72:
        raise ValueError("Password must be at most 72 UTF-8 bytes")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode("utf-8")
        if len(pwd_bytes) > 72:
            return False
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(
    subject: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token with user ID, role, and unique jti."""
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": subject,
        "role": role,
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT refresh token."""
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
    payload = {
        "sub": subject,
        "type": "refresh",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and verify a JWT token. Raises jwt.PyJWTError on failure."""
    payload = jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )
    if payload.get("type") not in {"access", "refresh"}:
        raise jwt.InvalidTokenError("Invalid token purpose")
    jti = payload.get("jti")
    if jti and is_token_revoked(jti):
        raise jwt.InvalidTokenError("Token has been revoked")
    return payload


def revoke_token(token: str) -> None:
    """Revoke a token by recording its jti until its natural expiration."""
    try:
        # Decode without verifying expiration so we can blacklist expired/near-expiry tokens too
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": False},
        )
        jti = payload.get("jti") or token
        exp = payload.get("exp")
        exp_dt = datetime.fromtimestamp(exp, timezone.utc) if exp else datetime.now(timezone.utc) + timedelta(days=7)
        if settings.is_production:
            ttl = max(1, int((exp_dt - datetime.now(timezone.utc)).total_seconds()))
            _revocation_store.setex(f"exam-platform:revoked:{jti}", ttl, "1")
        else:
            _REVOKED_TOKENS[jti] = exp_dt
    except Exception:
        if settings.is_production:
            raise RuntimeError("Token revocation storage is unavailable")
        # Fallback using token string itself
        _REVOKED_TOKENS[token] = datetime.now(timezone.utc) + timedelta(days=7)


def is_token_revoked(token_or_jti: str) -> bool:
    """Check if token or jti is in the revocation store."""
    if settings.is_production:
        return bool(_revocation_store.exists(f"exam-platform:revoked:{token_or_jti}"))
    now = datetime.now(timezone.utc)
    # Lazy cleanup of expired entries
    expired_keys = [k for k, exp in _REVOKED_TOKENS.items() if exp < now]
    for k in expired_keys:
        _REVOKED_TOKENS.pop(k, None)

    return token_or_jti in _REVOKED_TOKENS

