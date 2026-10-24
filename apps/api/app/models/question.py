"""Question, QuestionOption, and QuestionBank database models.

Supports MCQ (single correct), MSQ (multiple correct), and NAT (numerical answer).
The schema is extensible for future question types. Answer keys are stored
separately and never exposed to students during active attempts.
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
    String,
    Text,
)
from sqlalchemy import JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

import enum


class QuestionType(str, enum.Enum):
    MCQ = "MCQ"
    MSQ = "MSQ"
    NAT = "NAT"


class QuestionDifficulty(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class QuestionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class Question(Base):
    """A question in the question bank, belonging to an exam and optionally a topic."""
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    exam_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False
    )
    subject_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True
    )
    topic_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True
    )
    question_type: Mapped[QuestionType] = mapped_column(
        SAEnum(QuestionType, name="question_type_enum", create_type=True),
        nullable=False,
    )
    difficulty: Mapped[QuestionDifficulty] = mapped_column(
        SAEnum(QuestionDifficulty, name="question_difficulty_enum", create_type=True),
        nullable=False,
        default=QuestionDifficulty.MEDIUM,
    )
    status: Mapped[QuestionStatus] = mapped_column(
        SAEnum(QuestionStatus, name="question_status_enum", create_type=True),
        nullable=False,
        default=QuestionStatus.DRAFT,
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    positive_marks: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    negative_marks: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    # For NAT questions: the correct numerical answer and tolerance
    correct_numerical_answer: Mapped[float | None] = mapped_column(Float, nullable=True)
    numerical_tolerance: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.01)
    # For MSQ: partial credit policy config
    partial_credit: Mapped[bool] = mapped_column(Boolean, default=False)
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

    # Relationships
    options = relationship(
        "QuestionOption", back_populates="question", lazy="selectin",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_questions_exam_id", "exam_id"),
        Index("ix_questions_subject_id", "subject_id"),
        Index("ix_questions_topic_id", "topic_id"),
        Index("ix_questions_status", "status"),
        Index("ix_questions_type", "question_type"),
        Index("ix_questions_difficulty", "difficulty"),
    )


class QuestionOption(Base):
    """An answer option for MCQ or MSQ questions."""
    __tablename__ = "question_options"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str] = mapped_column(String(10), nullable=False)  # A, B, C, D
    text: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    question = relationship("Question", back_populates="options")

    __table_args__ = (
        Index("ix_question_options_question_id", "question_id"),
    )
