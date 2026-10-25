"""Pydantic schemas for Exam, Syllabus, Subject, Topic, and Resource."""

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


# --- Exam ---

class ExamCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    code: str = Field(..., min_length=1, max_length=20)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    logo_url: Optional[str] = None
    status: str = Field(default="DRAFT", pattern="^(DRAFT|ACTIVE|ARCHIVED)$")
    default_duration_seconds: int = Field(default=10800, ge=300)
    default_total_marks: float = Field(default=100.0, ge=1)
    instructions: Optional[str] = None
    display_order: int = 0


class ExamUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    description: Optional[str] = None
    logo_url: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(DRAFT|ACTIVE|ARCHIVED)$")
    default_duration_seconds: Optional[int] = Field(None, ge=300)
    default_total_marks: Optional[float] = Field(None, ge=1)
    instructions: Optional[str] = None
    display_order: Optional[int] = None


class ExamResponse(BaseModel):
    id: UUID
    name: str
    code: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    status: str
    default_duration_seconds: int
    default_total_marks: float
    instructions: Optional[str] = None
    display_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Subject ---

class SubjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=1, max_length=20)
    description: Optional[str] = None
    display_order: int = 0


class SubjectResponse(BaseModel):
    id: UUID
    exam_id: UUID
    name: str
    code: str
    description: Optional[str] = None
    display_order: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Topic ---

class TopicCreateRequest(BaseModel):
    subject_id: UUID
    syllabus_version_id: Optional[UUID] = None
    parent_id: Optional[UUID] = None
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    display_order: int = 0


class TopicResponse(BaseModel):
    id: UUID
    subject_id: UUID
    syllabus_version_id: Optional[UUID] = None
    parent_id: Optional[UUID] = None
    name: str
    description: Optional[str] = None
    display_order: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Syllabus Version ---

class SyllabusVersionCreateRequest(BaseModel):
    version: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    is_active: bool = True


class SyllabusVersionResponse(BaseModel):
    id: UUID
    exam_id: UUID
    version: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Resource (Study Notes / PDF Materials) ---

class ResourceCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    topic_id: Optional[UUID] = None
    resource_type: str = Field(default="notes", max_length=50)  # notes, pdf, formula_sheet, syllabus
    file_url: Optional[str] = None
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = "application/pdf"
    is_published: bool = True
    is_paid: bool = False


class ResourceUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    topic_id: Optional[UUID] = None
    resource_type: Optional[str] = None
    file_url: Optional[str] = None
    is_published: Optional[bool] = None
    is_paid: Optional[bool] = None


class ResourceResponse(BaseModel):
    id: UUID
    exam_id: UUID
    topic_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    resource_type: str
    file_url: Optional[str] = None
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    is_published: bool
    is_paid: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PublicResourceResponse(BaseModel):
    """Resource catalogue metadata without internal storage identifiers."""
    id: UUID
    exam_id: UUID
    topic_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    resource_type: str
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    is_published: bool
    is_paid: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

