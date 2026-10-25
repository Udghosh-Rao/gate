"""Exam public and admin API routes."""

from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin, require_admin_or_content_manager
from app.models.user import User, UserRole
from app.schemas.exam import (
    ExamCreateRequest, ExamUpdateRequest, ExamResponse,
    SubjectCreateRequest, SubjectResponse,
    TopicCreateRequest, TopicResponse,
    SyllabusVersionCreateRequest, SyllabusVersionResponse,
    ResourceCreateRequest, ResourceUpdateRequest, ResourceResponse,
)
from app.services.exam_service import ExamService

router = APIRouter(tags=["Exams"])


# --- Public Exam Routes ---

@router.get("/exams", response_model=list[ExamResponse])
async def list_exams(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List active published exams available to the public."""
    service = ExamService(db)
    return await service.get_active_exams()


@router.get("/exams/{exam_slug}", response_model=ExamResponse)
async def get_exam(
    exam_slug: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get active published exam details by slug."""
    service = ExamService(db)
    exam = await service.get_active_exam_by_slug(exam_slug)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam



@router.get("/exams/{exam_id}/subjects", response_model=list[SubjectResponse])
async def list_subjects(
    exam_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List subjects for an exam."""
    service = ExamService(db)
    return await service.get_subjects(exam_id)


@router.get("/subjects/{subject_id}/topics", response_model=list[TopicResponse])
async def list_topics(
    subject_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List topics for a subject."""
    service = ExamService(db)
    return await service.get_topics(subject_id)


@router.get("/exams/{exam_id}/syllabus", response_model=list[SyllabusVersionResponse])
async def list_syllabus_versions(
    exam_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List syllabus versions for an exam."""
    service = ExamService(db)
    return await service.get_syllabus_versions(exam_id)


# --- Admin Exam Routes ---

@router.get("/admin/exams", response_model=list[ExamResponse])
async def list_admin_exams(
    current_user: Annotated[User, Depends(require_admin_or_content_manager)],
    db: Annotated[AsyncSession, Depends(get_db)],
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """List all exams including drafts and archived exams (admin/content manager only)."""
    service = ExamService(db)
    return await service.get_exams(status_filter=status_filter)


@router.post("/admin/exams", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(
    data: ExamCreateRequest,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new examination (admin only)."""
    service = ExamService(db)
    return await service.create_exam(data, created_by=current_user.id)



@router.patch("/admin/exams/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: UUID,
    data: ExamUpdateRequest,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update an examination (admin only)."""
    service = ExamService(db)
    result = await service.update_exam(exam_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Exam not found")
    return result


@router.post(
    "/admin/exams/{exam_id}/subjects",
    response_model=SubjectResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_subject(
    exam_id: UUID,
    data: SubjectCreateRequest,
    current_user: Annotated[User, Depends(require_admin_or_content_manager)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a subject for an exam."""
    service = ExamService(db)
    return await service.create_subject(exam_id, data)


@router.post(
    "/admin/topics",
    response_model=TopicResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_topic(
    data: TopicCreateRequest,
    current_user: Annotated[User, Depends(require_admin_or_content_manager)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a topic."""
    service = ExamService(db)
    return await service.create_topic(data)


@router.post(
    "/admin/exams/{exam_id}/syllabus",
    response_model=SyllabusVersionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_syllabus_version(
    exam_id: UUID,
    data: SyllabusVersionCreateRequest,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a syllabus version for an exam."""
    service = ExamService(db)
    return await service.create_syllabus_version(exam_id, data)


# --- Study Materials / Resources (Public & Admin) ---

@router.get("/exams/{exam_id}/resources", response_model=list[ResourceResponse])
async def list_published_resources(
    exam_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    topic_id: Optional[UUID] = None,
):
    """List published study materials, revision notes, and downloadable resources for students."""
    service = ExamService(db)
    return await service.get_resources(exam_id=exam_id, topic_id=topic_id, published_only=True)


@router.get("/admin/exams/{exam_id}/resources", response_model=list[ResourceResponse])
async def list_admin_resources(
    exam_id: UUID,
    current_user: Annotated[User, Depends(require_admin_or_content_manager)],
    db: Annotated[AsyncSession, Depends(get_db)],
    topic_id: Optional[UUID] = None,
):
    """List all resources (drafts and published) for an examination (admin only)."""
    service = ExamService(db)
    return await service.get_resources(exam_id=exam_id, topic_id=topic_id, published_only=False)


@router.post(
    "/admin/exams/{exam_id}/resources",
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_resource(
    exam_id: UUID,
    data: ResourceCreateRequest,
    current_user: Annotated[User, Depends(require_admin_or_content_manager)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new study resource (notes, PDF, guide) associated with an exam and topic."""
    service = ExamService(db)
    return await service.create_resource(exam_id=exam_id, data=data, uploaded_by=current_user.id)


@router.patch("/admin/resources/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: UUID,
    data: ResourceUpdateRequest,
    current_user: Annotated[User, Depends(require_admin_or_content_manager)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update study material details or toggle publication status."""
    service = ExamService(db)
    result = await service.update_resource(resource_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Resource not found")
    return result


@router.delete("/admin/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: UUID,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a study resource."""
    service = ExamService(db)
    success = await service.delete_resource(resource_id)
    if not success:
        raise HTTPException(status_code=404, detail="Resource not found")
    return None

