"""Pytest configuration and shared fixtures for the API test suite."""

import pytest


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset in-memory rate limiter state before every test.
    
    Without this, repeated login calls during sequential test runs exhaust the 
    rate limit window and cause subsequent tests to receive 429 responses.
    """
    from app.core.rate_limit import reset_rate_limits
    reset_rate_limits()
    yield
    # Also reset after — so one test can't pollute the next
    reset_rate_limits()
