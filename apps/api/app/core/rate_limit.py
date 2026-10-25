"""In-memory sliding-window rate limiting dependency for FastAPI."""

import time
from collections import defaultdict
from typing import Dict, List
from fastapi import HTTPException, Request, status

from app.core.config import settings

# IP -> list of timestamps
_CLIENT_REQUESTS: Dict[str, List[float]] = defaultdict(list)


def rate_limit(max_requests: int = 15, window_seconds: int = 60):
    """FastAPI dependency to limit requests per IP."""

    async def limiter(request: Request):
        if not settings.RATE_LIMIT_ENABLED:
            return

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        window_start = now - window_seconds

        # Clean timestamps older than window
        timestamps = [t for t in _CLIENT_REQUESTS[client_ip] if t > window_start]
        if len(timestamps) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds} seconds.",
            )

        timestamps.append(now)
        _CLIENT_REQUESTS[client_ip] = timestamps

    return limiter


def reset_rate_limits():
    """Clear all rate limit records (for testing)."""
    _CLIENT_REQUESTS.clear()
