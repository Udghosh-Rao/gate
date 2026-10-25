"""Test, TestSeries, TestSection, TestQuestion, Attempt, AttemptAnswer, and Result models.

Implements the full examination lifecycle:
CREATED → IN_PROGRESS → SUBMITTED → EVALUATED

Server-authoritative timing prevents client manipulation.
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    false,
)
from sqlalchemy import JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

import enum


class TestSeriesStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class TestStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class ResultReleasePolicy(str, enum.Enum):
    IMMEDIATE = "IMMEDIATE"
    AFTER_DEADLINE = "AFTER_DEADLINE"
    MANUAL = "MANUAL"


class ExplanationReleasePolicy(str, enum.Enum):
    WITH_RESULT = "WITH_RESULT"
    AFTER_DEADLINE = "AFTER_DEADLINE"
    MANUAL = "MANUAL"
    NEVER = "NEVER"


class TestSeries(Base):
    """A collection of tests grouped under an examination."""
    __tablename__ = "test_series"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    exam_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[TestSeriesStatus] = mapped_column(
        SAEnum(TestSeriesStatus, name="test_series_status_enum", create_type=True),
        nullable=False,
        default=TestSeriesStatus.DRAFT,
    )
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
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

    exam = relationship("Exam", back_populates="test_series")
    tests = relationship("Test", back_populates="test_series", lazy="selectin")

    __table_args__ = (
        Index("ix_test_series_exam_id", "exam_id"),
        UniqueConstraint("exam_id", "slug", name="uq_test_series_exam_slug"),
    )


class Test(Base):
    """A specific test/mock exam within a test series."""
    __tablename__ = "tests"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    test_series_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("test_series.id", ondelete="SET NULL"), nullable=True
    )
    exam_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=10800)
    total_marks: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[TestStatus] = mapped_column(
        SAEnum(TestStatus, name="test_status_enum", create_type=True),
        nullable=False,
        default=TestStatus.DRAFT,
    )
    result_release_policy: Mapped[ResultReleasePolicy] = mapped_column(
        SAEnum(ResultReleasePolicy, name="result_release_policy_enum", create_type=True),
        nullable=False,
        default=ResultReleasePolicy.IMMEDIATE,
    )
    explanation_release_policy: Mapped[ExplanationReleasePolicy] = mapped_column(
        SAEnum(ExplanationReleasePolicy, name="explanation_release_policy_enum", create_type=True),
        nullable=False,
        default=ExplanationReleasePolicy.WITH_RESULT,
    )
    result_release_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_retakeable: Mapped[bool] = mapped_column(Boolean, default=True)
    max_attempts: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_paid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false())
    # Marking scheme config (JSON for flexibility)
    marking_scheme: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
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

    test_series = relationship("TestSeries", back_populates="tests")
    test_questions = relationship(
        "TestQuestion", back_populates="test", lazy="selectin",
        cascade="all, delete-orphan",
    )
    attempts = relationship("Attempt", back_populates="test", lazy="selectin")

    __table_args__ = (
        Index("ix_tests_exam_id", "exam_id"),
        Index("ix_tests_status", "status"),
        UniqueConstraint("exam_id", "slug", name="uq_tests_exam_slug"),
    )


class TestSection(Base):
    """Optional section grouping within a test (e.g., General Aptitude, Technical)."""
    __tablename__ = "test_sections"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    test_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    __table_args__ = (
        Index("ix_test_sections_test_id", "test_id"),
    )


class TestQuestion(Base):
    """Associates a question with a test, with ordering and optional section."""
    __tablename__ = "test_questions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    test_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    section_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("test_sections.id", ondelete="SET NULL"), nullable=True
    )
    question_number: Mapped[int] = mapped_column(Integer, nullable=False)
    # Override marks at the test level if needed
    positive_marks: Mapped[float | None] = mapped_column(Float, nullable=True)
    negative_marks: Mapped[float | None] = mapped_column(Float, nullable=True)

    test = relationship("Test", back_populates="test_questions")
    question = relationship("Question", lazy="selectin")

    __table_args__ = (
        Index("ix_test_questions_test_id", "test_id"),
        UniqueConstraint("test_id", "question_id", name="uq_test_question"),
        UniqueConstraint("test_id", "question_number", name="uq_test_question_number"),
    )


class AttemptStatus(str, enum.Enum):
    CREATED = "CREATED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    EVALUATED = "EVALUATED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class Attempt(Base):
    """A student's attempt at a test. Server-authoritative start/expiry times."""
    __tablename__ = "attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    test_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[AttemptStatus] = mapped_column(
        SAEnum(AttemptStatus, name="attempt_status_enum", create_type=True),
        nullable=False,
        default=AttemptStatus.CREATED,
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Idempotency key prevents duplicate submissions
    submission_key: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    student = relationship("User", back_populates="attempts")
    test = relationship("Test", back_populates="attempts")
    answers = relationship(
        "AttemptAnswer", back_populates="attempt", lazy="selectin",
        cascade="all, delete-orphan",
    )
    result = relationship("Result", back_populates="attempt", uselist=False, lazy="selectin")

    __table_args__ = (
        Index("ix_attempts_test_id", "test_id"),
        Index("ix_attempts_student_id", "student_id"),
        Index("ix_attempts_status", "status"),
    )


class AttemptAnswer(Base):
    """A student's answer to a specific question within an attempt."""
    __tablename__ = "attempt_answers"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    attempt_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("attempts.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    # MCQ: single option ID; MSQ: list of option IDs (JSON); NAT: numerical value
    selected_option_ids: Mapped[list | None] = mapped_column(JSON, nullable=True)
    numerical_answer: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_marked_for_review: Mapped[bool] = mapped_column(Boolean, default=False)
    is_visited: Mapped[bool] = mapped_column(Boolean, default=True)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0)
    saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    attempt = relationship("Attempt", back_populates="answers")

    __table_args__ = (
        Index("ix_attempt_answers_attempt_id", "attempt_id"),
        UniqueConstraint("attempt_id", "question_id", name="uq_attempt_answer_question"),
    )


class Result(Base):
    """Finalized result for a submitted and evaluated attempt."""
    __tablename__ = "results"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    attempt_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("attempts.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    total_score: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    max_possible_marks: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    correct_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    incorrect_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unanswered_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    accuracy_percentage: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    percentage_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    time_taken_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Detailed breakdown stored as JSON
    section_wise_scores: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    subject_wise_scores: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    topic_wise_scores: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Per-question evaluation details
    question_results: Mapped[list | None] = mapped_column(JSON, nullable=True)
    is_released: Mapped[bool] = mapped_column(Boolean, default=False)
    evaluated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    attempt = relationship("Attempt", back_populates="result")

    __table_args__ = (
        Index("ix_results_attempt_id", "attempt_id"),
    )
