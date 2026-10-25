"""Question and test management API routes."""

from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin, require_admin_or_content_manager, require_student
from app.models.user import User, UserRole
from app.schemas.test import (
    QuestionCreateRequest, QuestionUpdateRequest, QuestionResponse,
    TestSeriesCreateRequest, TestSeriesResponse,
    TestCreateRequest, TestResponse,
    AttemptCreateResponse, AnswerSaveRequest, AnswerSaveResponse,
    AttemptSubmitResponse, ResultResponse,
)
from app.services.question_service import QuestionService
from app.services.test_service import TestService, AttemptService, ScoringService

router = APIRouter(tags=["Tests & Questions"])


# --- Questions (Admin/Content Manager) ---

@router.post("/admin/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    data: QuestionCreateRequest,
    current_user: Annotated[User, Depends(require_admin_or_content_manager)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a question in the question bank."""
    try:
        service = QuestionService(db)
        return await service.create_question(data, created_by=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/admin/questions", response_model=list[QuestionResponse])
async def list_questions(
    exam_id: UUID,
    current_user: Annotated[User, Depends(require_admin_or_content_manager)],
    db: Annotated[AsyncSession, Depends(get_db)],
    subject_id: Optional[UUID] = None,
    topic_id: Optional[UUID] = None,
    question_type: Optional[str] = None,
    difficulty: Optional[str] = None,
    question_status: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
    """List questions in the question bank with filters."""
    service = QuestionService(db)
    return await service.get_questions(
        exam_id=exam_id,
        subject_id=subject_id,
        topic_id=topic_id,
        question_type=question_type,
        difficulty=difficulty,
        status=question_status,
        limit=limit,
        offset=offset,
    )


@router.patch("/admin/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: UUID,
    data: QuestionUpdateRequest,
    current_user: Annotated[User, Depends(require_admin_or_content_manager)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Edit an existing question's text, options, marks, difficulty, and status."""
    try:
        service = QuestionService(db)
        result = await service.update_question(question_id, data)
        if not result:
            raise HTTPException(status_code=404, detail="Question not found")
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/admin/questions/{question_id}/status", response_model=QuestionResponse)
async def update_question_status(
    question_id: UUID,
    new_status: str,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a question's status (approve, publish, archive)."""
    try:
        service = QuestionService(db)
        result = await service.update_question_status(question_id, new_status)
        if not result:
            raise HTTPException(status_code=404, detail="Question not found")
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# --- Test Series (Admin) ---

@router.post(
    "/admin/exams/{exam_id}/test-series",
    response_model=TestSeriesResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_test_series(
    exam_id: UUID,
    data: TestSeriesCreateRequest,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a test series for an exam."""
    service = TestService(db)
    return await service.create_test_series(exam_id, data, created_by=current_user.id)


@router.get("/exams/{exam_id}/test-series", response_model=list[TestSeriesResponse])
async def list_test_series(
    exam_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List PUBLISHED test series for an exam (public)."""
    service = TestService(db)
    return await service.get_published_test_series(exam_id)


@router.get("/admin/exams/{exam_id}/test-series", response_model=list[TestSeriesResponse])
async def list_admin_test_series(
    exam_id: UUID,
    current_user: Annotated[User, Depends(require_admin_or_content_manager)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all test series including drafts (admin/content manager only)."""
    service = TestService(db)
    return await service.get_test_series(exam_id)


# --- Tests ---

@router.post(
    "/admin/exams/{exam_id}/tests",
    response_model=TestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_test(
    exam_id: UUID,
    data: TestCreateRequest,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a test with assigned questions."""
    service = TestService(db)
    return await service.create_test(exam_id, data, created_by=current_user.id)


@router.get("/exams/{exam_id}/tests", response_model=list[TestResponse])
async def list_tests(
    exam_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List PUBLISHED tests for an exam (public). Draft/archived tests are never exposed."""
    service = TestService(db)
    return await service.get_published_tests(exam_id)


@router.get("/admin/exams/{exam_id}/tests", response_model=list[TestResponse])
async def list_admin_tests(
    exam_id: UUID,
    current_user: Annotated[User, Depends(require_admin_or_content_manager)],
    db: Annotated[AsyncSession, Depends(get_db)],
    test_status: Optional[str] = Query(None, alias="status"),
):
    """List all tests including drafts (admin/content manager only)."""
    service = TestService(db)
    return await service.get_tests(exam_id, status_filter=test_status)


@router.get("/test-series/{series_id}/tests", response_model=list[TestResponse])
async def list_series_tests(
    series_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List PUBLISHED tests belonging to a test series (public)."""
    service = TestService(db)
    return await service.get_published_tests_by_series(series_id)


@router.post("/admin/tests/{test_id}/publish", response_model=TestResponse)
async def publish_test(
    test_id: UUID,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Publish a test — validates it has questions."""
    try:
        service = TestService(db)
        result = await service.publish_test(test_id)
        if not result:
            raise HTTPException(status_code=404, detail="Test not found")
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# --- Attempts (Student) ---

@router.post("/tests/{test_id}/attempts", response_model=AttemptCreateResponse)
async def start_attempt(
    test_id: UUID,
    current_user: Annotated[User, Depends(require_student)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Start a new test attempt or resume an in-progress one."""
    try:
        service = AttemptService(db)
        return await service.start_attempt(test_id, student_id=current_user.id)
    except (ValueError, PermissionError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/attempts/{attempt_id}/answers/{question_id}", response_model=AnswerSaveResponse)
async def save_answer(
    attempt_id: UUID,
    question_id: UUID,
    data: AnswerSaveRequest,
    current_user: Annotated[User, Depends(require_student)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Save or update an answer for a question in an active attempt."""
    try:
        service = AttemptService(db)
        return await service.save_answer(
            attempt_id, question_id, data, student_id=current_user.id
        )
    except (ValueError, PermissionError) as e:
        status_code = status.HTTP_403_FORBIDDEN if isinstance(e, PermissionError) else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=str(e))


@router.post("/attempts/{attempt_id}/submit", response_model=AttemptSubmitResponse)
async def submit_attempt(
    attempt_id: UUID,
    current_user: Annotated[User, Depends(require_student)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Submit a test attempt for evaluation. Idempotent: repeated calls are safe."""
    try:
        service = AttemptService(db)
        result = await service.submit_attempt(attempt_id, student_id=current_user.id)

        # Auto-evaluate on submission (idempotent — won't re-score if already done)
        scoring = ScoringService(db)
        await scoring.evaluate_attempt_idempotent(attempt_id)

        return result
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/attempts/{attempt_id}/result", response_model=ResultResponse)
async def get_result(
    attempt_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get the result for a completed attempt.

    Security: Students can only access their own results. Admins can access any.
    """
    # Load the attempt FIRST to verify ownership BEFORE leaking any result data
    attempt_service = AttemptService(db)
    attempt = await attempt_service.get_attempt_by_id(attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    # Critical: enforce ownership — students cannot read other students' results
    if current_user.role != UserRole.ADMIN:
        if attempt.student_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to access this result",
            )

    scoring = ScoringService(db)
    result = await scoring.get_result(attempt_id)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found or not yet available")

    if not result.is_released and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Result has not been released yet",
        )

    return ResultResponse.model_validate(result)


@router.get("/student/attempts")
async def list_student_attempts(
    current_user: Annotated[User, Depends(require_student)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List historical attempts for the authenticated student."""
    service = AttemptService(db)
    attempts = await service.get_student_attempts(student_id=current_user.id)
    return [
        {
            "id": str(a.id),
            "test_id": str(a.test_id),
            "status": a.status.value,
            "started_at": a.started_at.isoformat() if a.started_at else None,
            "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
            # Use 'is not None' — score of 0 is a valid result and must not be hidden
            "score": float(a.result.total_score) if (getattr(a, "result", None) is not None) else None,
            "accuracy_percentage": a.result.accuracy_percentage if (getattr(a, "result", None) is not None) else None,
        }
        for a in attempts
    ]

