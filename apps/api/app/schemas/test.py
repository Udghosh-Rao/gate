"""Pydantic schemas for Questions, Tests, Attempts, and Results."""

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


# --- Question ---

class QuestionOptionCreate(BaseModel):
    label: str = Field(..., max_length=10)
    text: str
    image_url: Optional[str] = None
    is_correct: bool = False
    display_order: int = 0


class QuestionCreateRequest(BaseModel):
    exam_id: UUID
    subject_id: Optional[UUID] = None
    topic_id: Optional[UUID] = None
    question_type: str = Field(..., pattern="^(MCQ|MSQ|NAT)$")
    difficulty: str = Field(default="MEDIUM", pattern="^(EASY|MEDIUM|HARD)$")
    text: str = Field(..., min_length=5)
    image_url: Optional[str] = None
    explanation: Optional[str] = None
    positive_marks: float = Field(default=1.0, ge=0)
    negative_marks: float = Field(default=0.0, ge=0)
    correct_numerical_answer: Optional[float] = None
    numerical_tolerance: Optional[float] = Field(None, ge=0)
    partial_credit: bool = False
    options: List[QuestionOptionCreate] = []


class QuestionUpdateRequest(BaseModel):
    subject_id: Optional[UUID] = None
    topic_id: Optional[UUID] = None
    difficulty: Optional[str] = Field(None, pattern="^(EASY|MEDIUM|HARD)$")
    status: Optional[str] = Field(None, pattern="^(DRAFT|IN_REVIEW|APPROVED|PUBLISHED|ARCHIVED)$")
    text: Optional[str] = None
    image_url: Optional[str] = None
    explanation: Optional[str] = None
    positive_marks: Optional[float] = None
    negative_marks: Optional[float] = None
    correct_numerical_answer: Optional[float] = None
    numerical_tolerance: Optional[float] = None
    options: Optional[List[QuestionOptionCreate]] = None


class QuestionOptionResponse(BaseModel):
    id: UUID
    label: str
    text: str
    image_url: Optional[str] = None
    is_correct: bool
    display_order: int

    model_config = {"from_attributes": True}


class QuestionResponse(BaseModel):
    id: UUID
    exam_id: UUID
    subject_id: Optional[UUID] = None
    topic_id: Optional[UUID] = None
    question_type: str
    difficulty: str
    status: str
    text: str
    image_url: Optional[str] = None
    explanation: Optional[str] = None
    positive_marks: float
    negative_marks: float
    correct_numerical_answer: Optional[float] = None
    numerical_tolerance: Optional[float] = None
    partial_credit: bool
    options: List[QuestionOptionResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class QuestionStudentView(BaseModel):
    """Question view during an active attempt — no answer keys exposed."""
    id: UUID
    question_type: str
    text: str
    image_url: Optional[str] = None
    positive_marks: float
    negative_marks: float
    options: List["QuestionOptionStudentView"] = []

    model_config = {"from_attributes": True}


class QuestionOptionStudentView(BaseModel):
    id: UUID
    label: str
    text: str
    image_url: Optional[str] = None
    display_order: int

    model_config = {"from_attributes": True}


# --- Test Series ---

class TestSeriesCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    status: str = Field(default="DRAFT", pattern="^(DRAFT|PUBLISHED|ARCHIVED)$")
    display_order: int = 0


class TestSeriesResponse(BaseModel):
    id: UUID
    exam_id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    status: str
    display_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Test ---

class TestQuestionAssign(BaseModel):
    question_id: UUID
    question_number: int
    section_id: Optional[UUID] = None
    positive_marks: Optional[float] = None
    negative_marks: Optional[float] = None


class TestCreateRequest(BaseModel):
    test_series_id: Optional[UUID] = None
    title: str = Field(..., min_length=3, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    instructions: Optional[str] = None
    duration_seconds: int = Field(default=10800, ge=300)
    total_marks: float = Field(default=100.0, ge=1)
    result_release_policy: str = Field(default="IMMEDIATE", pattern="^(IMMEDIATE|AFTER_DEADLINE|MANUAL)$")
    explanation_release_policy: str = Field(default="WITH_RESULT", pattern="^(WITH_RESULT|AFTER_DEADLINE|MANUAL|NEVER)$")
    is_retakeable: bool = True
    max_attempts: Optional[int] = None
    marking_scheme: Optional[dict] = None
    display_order: int = 0
    questions: List[TestQuestionAssign] = []


class TestResponse(BaseModel):
    id: UUID
    exam_id: UUID
    test_series_id: Optional[UUID] = None
    title: str
    slug: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    duration_seconds: int
    total_marks: float
    total_questions: int
    status: str
    result_release_policy: str
    explanation_release_policy: str
    is_retakeable: bool
    max_attempts: Optional[int] = None
    display_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Attempt ---

class AttemptCreateResponse(BaseModel):
    id: UUID
    test_id: UUID
    status: str
    started_at: datetime
    expires_at: datetime
    questions: List[QuestionStudentView] = []

    model_config = {"from_attributes": True}


class AnswerSaveRequest(BaseModel):
    selected_option_ids: Optional[List[UUID]] = None
    numerical_answer: Optional[float] = None
    is_marked_for_review: bool = False
    time_spent_seconds: int = 0


class AnswerSaveResponse(BaseModel):
    question_id: UUID
    saved: bool
    saved_at: datetime

    model_config = {"from_attributes": True}


class AttemptSubmitResponse(BaseModel):
    id: UUID
    status: str
    submitted_at: datetime
    message: str

    model_config = {"from_attributes": True}


# --- Result ---

class QuestionResultDetail(BaseModel):
    question_id: UUID
    question_number: int
    question_type: str
    question_text: str
    student_answer: Optional[str] = None
    correct_answer: Optional[str] = None
    is_correct: Optional[bool] = None
    marks_awarded: float
    explanation: Optional[str] = None


class ResultResponse(BaseModel):
    id: UUID
    attempt_id: UUID
    total_score: float
    max_possible_marks: float
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    total_questions: int
    accuracy_percentage: float
    percentage_score: float
    time_taken_seconds: int
    section_wise_scores: Optional[dict] = None
    subject_wise_scores: Optional[dict] = None
    topic_wise_scores: Optional[dict] = None
    question_results: Optional[List[QuestionResultDetail]] = None
    is_released: bool
    evaluated_at: datetime

    model_config = {"from_attributes": True}
