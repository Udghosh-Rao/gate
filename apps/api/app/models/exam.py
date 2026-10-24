"""Exam, Syllabus, Subject, and Topic database models.

Multi-exam architecture: all exam data is database-driven.
Adding a new examination requires only database records and admin actions,
never new code, routes, or hardcoded conditionals.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

import enum


class ExamStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"


class Exam(Base):
    """An examination that can be administered on the platform (e.g., GATE DA)."""
    __tablename__ = "exams"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[ExamStatus] = mapped_column(
        SAEnum(ExamStatus, name="exam_status_enum", create_type=True),
        nullable=False,
        default=ExamStatus.DRAFT,
    )
    default_duration_seconds: Mapped[int] = mapped_column(Integer, default=10800)  # 3 hours
    default_total_marks: Mapped[float] = mapped_column(Float, default=100.0)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Extensible config (e.g., custom marking schemes, branding)
    config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    syllabus_versions = relationship("SyllabusVersion", back_populates="exam", lazy="selectin")
    subjects = relationship("Subject", back_populates="exam", lazy="selectin")
    test_series = relationship("TestSeries", back_populates="exam", lazy="selectin")

    __table_args__ = (
        Index("ix_exams_status", "status"),
    )


class SyllabusVersion(Base):
    """Versioned syllabus for an examination (allows updates across years)."""
    __tablename__ = "syllabus_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    exam_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False
    )
    version: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "2025"
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    exam = relationship("Exam", back_populates="syllabus_versions")
    topics = relationship("Topic", back_populates="syllabus_version", lazy="selectin")

    __table_args__ = (
        Index("ix_syllabus_versions_exam_id", "exam_id"),
    )


class Subject(Base):
    """A subject within an examination (e.g., Linear Algebra, Probability)."""
    __tablename__ = "subjects"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    exam_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    exam = relationship("Exam", back_populates="subjects")
    topics = relationship("Topic", back_populates="subject", lazy="selectin")

    __table_args__ = (
        Index("ix_subjects_exam_id", "exam_id"),
    )


class Topic(Base):
    """Hierarchical topic/subtopic within a subject and syllabus version."""
    __tablename__ = "topics"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    subject_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False
    )
    syllabus_version_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("syllabus_versions.id", ondelete="SET NULL"), nullable=True
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("topics.id", ondelete="CASCADE"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    subject = relationship("Subject", back_populates="topics")
    syllabus_version = relationship("SyllabusVersion", back_populates="topics")
    parent = relationship("Topic", remote_side="Topic.id", backref="children")

    __table_args__ = (
        Index("ix_topics_subject_id", "subject_id"),
        Index("ix_topics_parent_id", "parent_id"),
    )


class Resource(Base):
    """Study material (PDF, image, notes) associated with a topic."""
    __tablename__ = "resources"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    exam_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False
    )
    topic_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)  # pdf, image, notes
    file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("ix_resources_exam_id", "exam_id"),
        Index("ix_resources_topic_id", "topic_id"),
        Index("ix_resources_is_published", "is_published"),
    )
