"""Authentication service — registration, login, token management."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import RegisterRequest, LoginRequest, TokenResponse, UserResponse


class AuthService:
    """Handles user registration, login, and token operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: RegisterRequest) -> UserResponse:
        """Register a new student account."""
        # Check for existing email
        result = await self.db.execute(
            select(User).where(User.email == data.email.lower())
        )
        if result.scalar_one_or_none():
            raise ValueError("An account with this email already exists")

        user = User(
            email=data.email.lower(),
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            phone=data.phone,
            role=UserRole.STUDENT,
            status=UserStatus.ACTIVE,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return UserResponse.model_validate(user)

    async def login(self, data: LoginRequest) -> TokenResponse:
        """Authenticate and return JWT tokens."""
        result = await self.db.execute(
            select(User).where(User.email == data.email.lower())
        )
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.hashed_password):
            raise ValueError("Invalid email or password")

        if user.status != UserStatus.ACTIVE:
            raise ValueError("Account is not active")

        access_token = create_access_token(
            subject=str(user.id),
            role=user.role.value,
        )
        refresh_token = create_refresh_token(subject=str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def refresh_tokens(self, refresh_token_str: str) -> TokenResponse:
        """Validate a refresh token and return a new access/refresh token pair."""
        from app.core.security import decode_token
        try:
            payload = decode_token(refresh_token_str)
            if payload.get("type") != "refresh":
                raise ValueError("Invalid token type: expected refresh token")
            user_id = payload.get("sub")
            if not user_id:
                raise ValueError("Invalid token payload")
        except Exception as e:
            raise ValueError(f"Invalid refresh token: {str(e)}")

        user = await self.get_user_by_id(UUID(user_id))
        if not user or user.status != UserStatus.ACTIVE:
            raise ValueError("User not found or account is not active")

        # Invalidate old refresh token
        from app.core.security import revoke_token
        revoke_token(refresh_token_str)

        access_token = create_access_token(
            subject=str(user.id),
            role=user.role.value,
        )
        new_refresh_token = create_refresh_token(subject=str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
        )

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        """Load a user by ID."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

