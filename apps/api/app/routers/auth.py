"""Authentication API routes — register, login, logout, and current user."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, security_scheme
from app.core.rate_limit import rate_limit
from app.core.security import revoke_token
from app.models.user import User
from app.schemas.user import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse, RefreshTokenRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(max_requests=10, window_seconds=60))],
)
async def register(
    data: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Register a new student account."""
    try:
        service = AuthService(db)
        return await service.register(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit(max_requests=15, window_seconds=60))],
)
async def login(
    data: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Authenticate and receive JWT tokens."""
    try:
        service = AuthService(db)
        return await service.login(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    data: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Obtain a new access and refresh token pair using a valid refresh token."""
    try:
        service = AuthService(db)
        return await service.refresh_tokens(data.refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get the authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.post("/logout")
async def logout(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security_scheme)],
):
    """Logout — invalidates the active bearer token server-side."""
    revoke_token(credentials.credentials)
    return {"message": "Logged out successfully"}

