"""Question management service."""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.question import Question, QuestionOption, QuestionType, QuestionStatus, QuestionDifficulty
from app.schemas.test import QuestionCreateRequest, QuestionUpdateRequest, QuestionResponse


class QuestionService:
    """Handles question bank CRUD and validation."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_question(self, data: QuestionCreateRequest, created_by: UUID) -> QuestionResponse:
        """Create a question with options. Validates answer keys exist."""
        q_type = QuestionType(data.question_type)

        # Validate: MCQ/MSQ must have options with at least one correct
        if q_type in (QuestionType.MCQ, QuestionType.MSQ):
            if not data.options:
                raise ValueError(f"{q_type.value} questions must have options")
            correct_count = sum(1 for o in data.options if o.is_correct)
            if correct_count == 0:
                raise ValueError("At least one option must be marked as correct")
            if q_type == QuestionType.MCQ and correct_count > 1:
                raise ValueError("MCQ questions must have exactly one correct option")

        # Validate: NAT must have correct numerical answer
        if q_type == QuestionType.NAT and data.correct_numerical_answer is None:
            raise ValueError("NAT questions must have a correct numerical answer")

        question = Question(
            exam_id=data.exam_id,
            subject_id=data.subject_id,
            topic_id=data.topic_id,
            question_type=q_type,
            difficulty=QuestionDifficulty(data.difficulty),
            status=QuestionStatus.DRAFT,
            text=data.text,
            image_url=data.image_url,
            explanation=data.explanation,
            positive_marks=data.positive_marks,
            negative_marks=data.negative_marks,
            correct_numerical_answer=data.correct_numerical_answer,
            numerical_tolerance=data.numerical_tolerance,
            partial_credit=data.partial_credit,
            created_by=created_by,
        )
        self.db.add(question)
        await self.db.flush()

        # Create options
        for opt_data in data.options:
            option = QuestionOption(
                question_id=question.id,
                label=opt_data.label,
                text=opt_data.text,
                image_url=opt_data.image_url,
                is_correct=opt_data.is_correct,
                display_order=opt_data.display_order,
            )
            self.db.add(option)

        await self.db.flush()
        await self.db.refresh(question)
        return QuestionResponse.model_validate(question)

    async def get_questions(
        self,
        exam_id: UUID,
        subject_id: Optional[UUID] = None,
        topic_id: Optional[UUID] = None,
        question_type: Optional[str] = None,
        difficulty: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[QuestionResponse]:
        query = select(Question).where(Question.exam_id == exam_id)
        if subject_id:
            query = query.where(Question.subject_id == subject_id)
        if topic_id:
            query = query.where(Question.topic_id == topic_id)
        if question_type:
            query = query.where(Question.question_type == QuestionType(question_type))
        if difficulty:
            query = query.where(Question.difficulty == QuestionDifficulty(difficulty))
        if status:
            query = query.where(Question.status == QuestionStatus(status))
        query = query.order_by(Question.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        return [QuestionResponse.model_validate(q) for q in result.scalars().all()]

    async def get_question_by_id(self, question_id: UUID) -> Question | None:
        result = await self.db.execute(select(Question).where(Question.id == question_id))
        return result.scalar_one_or_none()

    async def update_question_status(
        self, question_id: UUID, new_status: str
    ) -> QuestionResponse | None:
        question = await self.get_question_by_id(question_id)
        if not question:
            return None
        question.status = QuestionStatus(new_status)
        await self.db.flush()
        await self.db.refresh(question)
        return QuestionResponse.model_validate(question)

    async def update_question(
        self, question_id: UUID, data: "QuestionUpdateRequest"
    ) -> QuestionResponse | None:
        """Update a question's content, marks, difficulty, and options.

        Options replacement: when new options are provided the existing set is
        replaced entirely so callers always get a consistent question view.
        """
        from sqlalchemy import delete as sa_delete
        question = await self.get_question_by_id(question_id)
        if not question:
            return None

        if data.subject_id is not None:
            question.subject_id = data.subject_id
        if data.topic_id is not None:
            question.topic_id = data.topic_id
        if data.difficulty is not None:
            question.difficulty = QuestionDifficulty(data.difficulty)
        if data.status is not None:
            question.status = QuestionStatus(data.status)
        if data.text is not None:
            question.text = data.text
        if data.image_url is not None:
            question.image_url = data.image_url
        if data.explanation is not None:
            question.explanation = data.explanation
        if data.positive_marks is not None:
            question.positive_marks = data.positive_marks
        if data.negative_marks is not None:
            question.negative_marks = data.negative_marks
        if data.correct_numerical_answer is not None:
            question.correct_numerical_answer = data.correct_numerical_answer
        if data.numerical_tolerance is not None:
            question.numerical_tolerance = data.numerical_tolerance

        if data.options is not None:
            # Replace options — delete existing, recreate
            await self.db.execute(
                sa_delete(QuestionOption).where(QuestionOption.question_id == question_id)
            )
            for opt_data in data.options:
                option = QuestionOption(
                    question_id=question_id,
                    label=opt_data.label,
                    text=opt_data.text,
                    image_url=opt_data.image_url,
                    is_correct=opt_data.is_correct,
                    display_order=opt_data.display_order,
                )
                self.db.add(option)

        await self.db.flush()
        await self.db.refresh(question)
        return QuestionResponse.model_validate(question)

    async def get_question_count(self, exam_id: Optional[UUID] = None) -> int:
        query = select(func.count(Question.id))
        if exam_id:
            query = query.where(Question.exam_id == exam_id)
        result = await self.db.execute(query)
        return result.scalar() or 0
