"""Admin dashboard and user management API routes."""

from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_admin
from app.core.security import hash_password
from app.models.user import User, UserRole, UserStatus, AuditLog
from app.models.exam import Exam, ExamStatus
from app.models.test import Test, TestStatus, Attempt, AttemptStatus
from app.models.question import Question
from app.schemas.user import (
    AdminUserCreateRequest, AdminUserUpdateRequest, UserResponse,
)
from app.services.exam_service import ExamService
from app.services.test_service import TestService
from app.services.question_service import QuestionService

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/dashboard")
async def admin_dashboard(
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin dashboard with real database-backed metrics."""
    # Total users by role
    user_counts = {}
    for role in UserRole:
        result = await db.execute(
            select(func.count(User.id)).where(User.role == role)
        )
        user_counts[role.value] = result.scalar() or 0

    total_users = sum(user_counts.values())

    # Exam counts
    exam_service = ExamService(db)
    total_exams = await exam_service.get_exam_count()
    active_exams = await exam_service.get_active_exam_count()

    # Test counts
    test_service = TestService(db)
    total_tests = await test_service.get_test_count()

    # Question counts
    question_service = QuestionService(db)
    total_questions = await question_service.get_question_count()

    # Attempt counts
    total_attempts_result = await db.execute(select(func.count(Attempt.id)))
    total_attempts = total_attempts_result.scalar() or 0

    # Recent audit logs
    audit_result = await db.execute(
        select(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(10)
    )
    recent_logs = audit_result.scalars().all()

    return {
        "total_users": total_users,
        "user_counts": user_counts,
        "total_exams": total_exams,
        "active_exams": active_exams,
        "total_tests": total_tests,
        "total_questions": total_questions,
        "total_attempts": total_attempts,
        "recent_audit_logs": [
            {
                "id": str(log.id),
                "action": log.action,
                "resource_type": log.resource_type,
                "details": log.details,
                "created_at": log.created_at.isoformat(),
            }
            for log in recent_logs
        ],
    }


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    role: Optional[str] = None,
    user_status: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
):
    """List users with optional filters."""
    query = select(User)
    if role:
        query = query.where(User.role == UserRole(role))
    if user_status:
        query = query.where(User.status == UserStatus(user_status))
    query = query.order_by(User.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return [UserResponse.model_validate(u) for u in result.scalars().all()]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: AdminUserCreateRequest,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a user with a specified role (admin only)."""
    # Check for existing email
    existing = await db.execute(select(User).where(User.email == data.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=data.email.lower(),
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role=UserRole(data.role),
        status=UserStatus.ACTIVE,
    )
    db.add(user)

    # Audit log
    log = AuditLog(
        user_id=current_user.id,
        action="CREATE_USER",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"Created user {data.email} with role {data.role}",
    )
    db.add(log)

    await db.flush()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    data: AdminUserUpdateRequest,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a user's profile or role (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = data.model_dump(exclude_unset=True)
    if "role" in update_data:
        update_data["role"] = UserRole(update_data["role"])
    if "status" in update_data:
        update_data["status"] = UserStatus(update_data["status"])

    for key, value in update_data.items():
        setattr(user, key, value)

    # Audit log
    log = AuditLog(
        user_id=current_user.id,
        action="UPDATE_USER",
        resource_type="USER",
        resource_id=str(user_id),
        details=f"Updated fields: {', '.join(update_data.keys())}",
    )
    db.add(log)

    await db.flush()
    await db.refresh(user)
    return UserResponse.model_validate(user)
