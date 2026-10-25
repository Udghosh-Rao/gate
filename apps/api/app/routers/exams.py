"""Exam public and admin API routes."""

import os
import uuid as _uuid
from pathlib import Path
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin, require_admin_or_content_manager
from app.models.user import User, UserRole
from app.models.exam import Resource
from app.schemas.exam import (
    ExamCreateRequest, ExamUpdateRequest, ExamResponse,
    SubjectCreateRequest, SubjectResponse,
    TopicCreateRequest, TopicResponse,
    SyllabusVersionCreateRequest, SyllabusVersionResponse,
    ResourceCreateRequest, ResourceUpdateRequest, ResourceResponse,
    PublicResourceResponse,
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

@router.get("/exams/{exam_id}/resources", response_model=list[PublicResourceResponse])
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


# Allowed MIME types for study material uploads
_ALLOWED_UPLOAD_MIME_TYPES = {"application/pdf"}

_MAX_UPLOAD_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@router.post(
    "/admin/exams/{exam_id}/resources/upload",
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_study_material(
    exam_id: UUID,
    file: Annotated[UploadFile, File(description="PDF or image file to upload as study material")],
    current_user: Annotated[User, Depends(require_admin_or_content_manager)],
    db: Annotated[AsyncSession, Depends(get_db)],
    title: str = "Uploaded Study Material",
    description: Optional[str] = None,
    topic_id: Optional[UUID] = None,
):
    """Upload a PDF or image file as study material.

    Files are stored in the configured UPLOAD_DIR and a Resource record is created
    pointing to the server-hosted URL. Maximum file size is MAX_UPLOAD_SIZE_MB.
    """
    if settings.is_production:
        raise HTTPException(status_code=503, detail="Managed object storage is not configured")
    content_type = file.content_type or "application/octet-stream"
    if content_type not in _ALLOWED_UPLOAD_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"File type '{content_type}' is not permitted. "
                "Only PDF files are supported."
            ),
        )

    # Read and size-check the file
    contents = await file.read()
    if len(contents) > _MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the maximum upload size of {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )

    if not (file.filename or "").lower().endswith(".pdf") or not contents.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid PDF")

    # Build a safe filename: <uuid>_<original_filename>
    safe_name = f"{_uuid.uuid4()}.pdf"
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    with open(dest_path, "wb") as f:
        f.write(contents)

    # Relative URL served by the StaticFiles mount at /uploads/
    file_url = f"/uploads/{safe_name}"

    resource_data = ResourceCreateRequest(
        title=title,
        description=description,
        resource_type="notes",
        file_url=file_url,
        file_size_bytes=len(contents),
        mime_type=content_type,
        topic_id=topic_id,
        is_published=False,  # Admin must explicitly publish
    )
    service = ExamService(db)
    resource = await service.create_resource(
        exam_id=exam_id, data=resource_data, uploaded_by=current_user.id
    )
    resource_record = await db.execute(select(Resource).where(Resource.id == resource.id))
    resource_row = resource_record.scalar_one()
    resource_row.resource_type = "pdf"
    await db.flush()
    return resource_row


@router.get("/resources/{resource_id}/download")
async def download_resource(
    resource_id: UUID,
    current_user: Annotated[User, Depends(require_admin_or_content_manager)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Allow content staff to retrieve source files for administration.

    Student delivery is intentionally disabled until private page rendering
    and subscription entitlement checks are implemented.
    """
    row_result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = row_result.scalar_one_or_none()
    if resource is None or not resource.file_url:
        raise HTTPException(status_code=404, detail="Resource not found")
    if not resource.is_published:
        raise HTTPException(status_code=404, detail="Resource not found")
    storage_key = Path(resource.file_url).name
    if storage_key in {"", ".", ".."}:
        raise HTTPException(status_code=404, detail="Resource not found")
    path = (Path(settings.UPLOAD_DIR) / storage_key).resolve()
    if path.parent != Path(settings.UPLOAD_DIR).resolve() or not path.is_file():
        raise HTTPException(status_code=404, detail="Resource file not found")
    return FileResponse(path, media_type="application/pdf", filename=f"{resource.title}.pdf")

