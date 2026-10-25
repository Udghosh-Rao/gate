"""Test, Attempt, and Scoring services.

Implements the full examination lifecycle with server-authoritative timing.
The scoring engine is deterministic and independent of the frontend.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.question import Question, QuestionOption, QuestionType
from app.models.test import (
    Test, TestSeries, TestQuestion, TestSection,
    Attempt, AttemptAnswer, Result,
    TestStatus, TestSeriesStatus, AttemptStatus,
    ResultReleasePolicy,
    ExplanationReleasePolicy,
)
from app.schemas.test import (
    TestCreateRequest, TestResponse, TestSeriesCreateRequest, TestSeriesResponse,
    AttemptCreateResponse, AnswerSaveRequest, AnswerSaveResponse,
    AttemptSubmitResponse, ResultResponse, QuestionStudentView, QuestionOptionStudentView,
    QuestionResultDetail,
)


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensure datetime has UTC tzinfo for cross-database compatibility."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def can_release_result(test: Test, result: Result) -> bool:
    if test.result_release_policy == ResultReleasePolicy.IMMEDIATE:
        return True
    if test.result_release_policy == ResultReleasePolicy.AFTER_DEADLINE:
        release_at = ensure_utc(test.result_release_at)
        return bool(release_at and release_at <= datetime.now(timezone.utc))
    return result.is_released


def can_release_explanations(test: Test, result: Result) -> bool:
    policy = test.explanation_release_policy
    if policy == ExplanationReleasePolicy.NEVER:
        return False
    if policy == ExplanationReleasePolicy.WITH_RESULT:
        return can_release_result(test, result)
    if policy == ExplanationReleasePolicy.AFTER_DEADLINE:
        release_at = ensure_utc(test.result_release_at)
        return bool(release_at and release_at <= datetime.now(timezone.utc))
    # This schema has no independent explanation-approval flag. Fail closed for
    # MANUAL rather than coupling it to the result release bit.
    return False


class TestService:
    """Manages test series, tests, and test-question assignments."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_test_series(
        self, exam_id: UUID, data: TestSeriesCreateRequest, created_by: UUID
    ) -> TestSeriesResponse:
        ts = TestSeries(
            exam_id=exam_id,
            name=data.name,
            slug=data.slug.lower(),
            description=data.description,
            status=TestSeriesStatus(data.status),
            display_order=data.display_order,
            created_by=created_by,
        )
        self.db.add(ts)
        await self.db.flush()
        await self.db.refresh(ts)
        return TestSeriesResponse.model_validate(ts)

    async def get_test_series(self, exam_id: UUID) -> List[TestSeriesResponse]:
        result = await self.db.execute(
            select(TestSeries)
            .where(TestSeries.exam_id == exam_id)
            .order_by(TestSeries.display_order, TestSeries.name)
        )
        return [TestSeriesResponse.model_validate(ts) for ts in result.scalars().all()]

    async def create_test(
        self, exam_id: UUID, data: TestCreateRequest, created_by: UUID
    ) -> TestResponse:
        test = Test(
            exam_id=exam_id,
            test_series_id=data.test_series_id,
            title=data.title,
            slug=data.slug.lower(),
            description=data.description,
            instructions=data.instructions,
            duration_seconds=data.duration_seconds,
            total_marks=data.total_marks,
            total_questions=len(data.questions),
            status=TestStatus.DRAFT,
            result_release_policy=ResultReleasePolicy(data.result_release_policy),
            is_retakeable=data.is_retakeable,
            max_attempts=data.max_attempts,
            marking_scheme=data.marking_scheme,
            display_order=data.display_order,
            created_by=created_by,
        )
        self.db.add(test)
        await self.db.flush()

        # Assign questions
        for tq_data in data.questions:
            tq = TestQuestion(
                test_id=test.id,
                question_id=tq_data.question_id,
                section_id=tq_data.section_id,
                question_number=tq_data.question_number,
                positive_marks=tq_data.positive_marks,
                negative_marks=tq_data.negative_marks,
            )
            self.db.add(tq)

        await self.db.flush()
        await self.db.refresh(test)
        return TestResponse.model_validate(test)

    async def get_tests(
        self, exam_id: UUID, status_filter: Optional[str] = None
    ) -> List[TestResponse]:
        query = select(Test).where(Test.exam_id == exam_id)
        if status_filter:
            query = query.where(Test.status == TestStatus(status_filter))
        query = query.order_by(Test.display_order, Test.title)
        result = await self.db.execute(query)
        return [TestResponse.model_validate(t) for t in result.scalars().all()]

    async def get_published_tests(self, exam_id: UUID) -> List[TestResponse]:
        return await self.get_tests(exam_id, status_filter="PUBLISHED")

    async def get_published_test_series(self, exam_id: UUID) -> List[TestSeriesResponse]:
        """Return only PUBLISHED test series (public-facing)."""
        result = await self.db.execute(
            select(TestSeries)
            .where(
                TestSeries.exam_id == exam_id,
                TestSeries.status == TestSeriesStatus.PUBLISHED,
            )
            .order_by(TestSeries.display_order, TestSeries.name)
        )
        return [TestSeriesResponse.model_validate(ts) for ts in result.scalars().all()]

    async def get_tests_by_series(self, series_id: UUID) -> List[TestResponse]:
        query = select(Test).where(Test.test_series_id == series_id).order_by(Test.display_order, Test.title)
        result = await self.db.execute(query)
        return [TestResponse.model_validate(t) for t in result.scalars().all()]

    async def get_published_tests_by_series(self, series_id: UUID) -> List[TestResponse]:
        """Return only PUBLISHED tests for a series (public-facing)."""
        query = (
            select(Test)
            .where(
                Test.test_series_id == series_id,
                Test.status == TestStatus.PUBLISHED,
            )
            .order_by(Test.display_order, Test.title)
        )
        result = await self.db.execute(query)
        return [TestResponse.model_validate(t) for t in result.scalars().all()]

    async def get_test_by_id(self, test_id: UUID) -> Test | None:
        result = await self.db.execute(select(Test).where(Test.id == test_id))
        return result.scalar_one_or_none()

    async def publish_test(self, test_id: UUID) -> TestResponse | None:
        """Publish a test. Validates that:
        - The test has at least one question attached.
        - All attached questions have PUBLISHED status (unpublished questions
          must not be visible to students).
        """
        from app.models.question import Question, QuestionStatus
        test = await self.get_test_by_id(test_id)
        if not test:
            return None
        # Validate: test must have questions
        if not test.test_questions:
            raise ValueError("Cannot publish a test with no questions")
        # Validate: all questions must be PUBLISHED
        for tq in test.test_questions:
            q = tq.question
            if q is None:
                raise ValueError("Test contains a reference to a question that no longer exists")
            if q.status != QuestionStatus.PUBLISHED:
                raise ValueError(
                    f"Question '{q.text[:60]}...' (id={q.id}) is not published. "
                    "All questions must be published before the test can be published."
                )
        test.status = TestStatus.PUBLISHED
        await self.db.flush()
        await self.db.refresh(test)
        return TestResponse.model_validate(test)

    async def get_test_count(self, exam_id: Optional[UUID] = None) -> int:
        query = select(func.count(Test.id))
        if exam_id:
            query = query.where(Test.exam_id == exam_id)
        result = await self.db.execute(query)
        return result.scalar() or 0


class AttemptService:
    """Manages test attempts with server-authoritative timing."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def start_attempt(
        self, test_id: UUID, student_id: UUID
    ) -> AttemptCreateResponse:
        """Create a new attempt or resume an in-progress one."""
        test = await self.db.execute(select(Test).where(Test.id == test_id))
        test = test.scalar_one_or_none()
        if not test:
            raise ValueError("Test not found")
        if test.status != TestStatus.PUBLISHED:
            raise ValueError("Test is not available")

        # Check for existing in-progress attempt to resume
        existing = await self.db.execute(
            select(Attempt).where(
                Attempt.test_id == test_id,
                Attempt.student_id == student_id,
                Attempt.status == AttemptStatus.IN_PROGRESS,
            )
        )
        existing_attempt = existing.scalar_one_or_none()
        if existing_attempt:
            # Check if expired
            now = datetime.now(timezone.utc)
            if existing_attempt.expires_at and ensure_utc(existing_attempt.expires_at) <= now:
                existing_attempt.status = AttemptStatus.EXPIRED
                existing_attempt.submitted_at = ensure_utc(existing_attempt.expires_at)
                await self.db.flush()
                # Evaluate the expired attempt so student gets a score
                try:
                    scoring = ScoringService(self.db)
                    await scoring.evaluate_attempt_idempotent(existing_attempt.id)
                except Exception:
                    pass  # Evaluation failure must not block starting a new attempt
            else:
                # Resume — load questions
                questions = await self._load_test_questions_for_student(test_id)
                return AttemptCreateResponse(
                    id=existing_attempt.id,
                    test_id=test_id,
                    status=existing_attempt.status.value,
                    started_at=existing_attempt.started_at,
                    expires_at=existing_attempt.expires_at,
                    remaining_seconds=max(0, int((ensure_utc(existing_attempt.expires_at) - now).total_seconds())),
                    questions=questions,
                    saved_answers=existing_attempt.answers,
                )

        # Check max attempts
        if test.max_attempts:
            count_result = await self.db.execute(
                select(func.count(Attempt.id)).where(
                    Attempt.test_id == test_id,
                    Attempt.student_id == student_id,
                    Attempt.status.in_([
                        AttemptStatus.SUBMITTED,
                        AttemptStatus.EVALUATED,
                    ]),
                )
            )
            count = count_result.scalar() or 0
            if count >= test.max_attempts:
                raise ValueError("Maximum attempts reached for this test")

        if not test.is_retakeable:
            prev = await self.db.execute(
                select(Attempt).where(
                    Attempt.test_id == test_id,
                    Attempt.student_id == student_id,
                    Attempt.status.in_([
                        AttemptStatus.SUBMITTED,
                        AttemptStatus.EVALUATED,
                    ]),
                )
            )
            if prev.scalar_one_or_none():
                raise ValueError("This test cannot be retaken")

        # Create new attempt with server-authoritative timing
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(seconds=test.duration_seconds)

        attempt = Attempt(
            test_id=test_id,
            student_id=student_id,
            status=AttemptStatus.IN_PROGRESS,
            started_at=now,
            expires_at=expires_at,
        )
        self.db.add(attempt)
        await self.db.flush()
        await self.db.refresh(attempt)

        questions = await self._load_test_questions_for_student(test_id)

        return AttemptCreateResponse(
            id=attempt.id,
            test_id=test_id,
            status=attempt.status.value,
            started_at=attempt.started_at,
            expires_at=attempt.expires_at,
            remaining_seconds=test.duration_seconds,
            questions=questions,
            saved_answers=[],
        )

    async def _load_test_questions_for_student(
        self, test_id: UUID
    ) -> List[QuestionStudentView]:
        """Load questions WITHOUT answer keys for student view."""
        result = await self.db.execute(
            select(TestQuestion)
            .where(TestQuestion.test_id == test_id)
            .order_by(TestQuestion.question_number)
        )
        test_questions = result.scalars().all()
        questions = []
        for tq in test_questions:
            q = tq.question
            options = [
                QuestionOptionStudentView(
                    id=opt.id,
                    label=opt.label,
                    text=opt.text,
                    image_url=opt.image_url,
                    display_order=opt.display_order,
                )
                for opt in sorted(q.options, key=lambda o: o.display_order)
            ]
            questions.append(QuestionStudentView(
                id=q.id,
                question_type=q.question_type.value,
                text=q.text,
                image_url=q.image_url,
                positive_marks=tq.positive_marks if tq.positive_marks is not None else q.positive_marks,
                negative_marks=tq.negative_marks if tq.negative_marks is not None else q.negative_marks,
                options=options,
            ))
        return questions

    async def save_answer(
        self, attempt_id: UUID, question_id: UUID,
        data: AnswerSaveRequest, student_id: UUID,
    ) -> AnswerSaveResponse:
        """Save or update a student's answer. Rejects if attempt is finalized."""
        attempt = await self._get_valid_attempt(attempt_id, student_id)

        # Verify question belongs to this test
        tq_result = await self.db.execute(
            select(TestQuestion).where(
                TestQuestion.test_id == attempt.test_id,
                TestQuestion.question_id == question_id,
            )
        )
        if not tq_result.scalar_one_or_none():
            raise ValueError("Question does not belong to this test")

        q_result = await self.db.execute(select(Question).where(Question.id == question_id))
        question = q_result.scalar_one()
        selected_ids = data.selected_option_ids or []
        if question.question_type == QuestionType.NAT:
            if selected_ids:
                raise ValueError("Numerical questions do not accept option selections")
        else:
            if data.numerical_answer is not None:
                raise ValueError("Choice questions do not accept numerical answers")
            if question.question_type == QuestionType.MCQ and len(selected_ids) > 1:
                raise ValueError("MCQ accepts at most one selected option")
            valid_ids = {option.id for option in question.options}
            if any(option_id not in valid_ids for option_id in selected_ids):
                raise ValueError("Selected option does not belong to this question")

        # Upsert the answer
        existing = await self.db.execute(
            select(AttemptAnswer).where(
                AttemptAnswer.attempt_id == attempt_id,
                AttemptAnswer.question_id == question_id,
            )
        )
        answer = existing.scalar_one_or_none()
        now = datetime.now(timezone.utc)

        if answer:
            answer.selected_option_ids = [str(oid) for oid in data.selected_option_ids] if data.selected_option_ids else None
            answer.numerical_answer = data.numerical_answer
            answer.is_marked_for_review = data.is_marked_for_review
            answer.time_spent_seconds = data.time_spent_seconds
            answer.saved_at = now
        else:
            answer = AttemptAnswer(
                attempt_id=attempt_id,
                question_id=question_id,
                selected_option_ids=[str(oid) for oid in data.selected_option_ids] if data.selected_option_ids else None,
                numerical_answer=data.numerical_answer,
                is_marked_for_review=data.is_marked_for_review,
                time_spent_seconds=data.time_spent_seconds,
                saved_at=now,
            )
            self.db.add(answer)

        await self.db.flush()
        return AnswerSaveResponse(
            question_id=question_id,
            saved=True,
            saved_at=now,
        )

    async def submit_attempt(
        self, attempt_id: UUID, student_id: UUID
    ) -> AttemptSubmitResponse:
        """Finalize an attempt — manual submission.

        Idempotent: if the attempt is already SUBMITTED or EVALUATED, return
        the existing state instead of raising an error. This makes repeated
        submission safe across network retries and duplicate requests.
        """
        # Load attempt with ownership check but allow already-finalized state
        result = await self.db.execute(
            select(Attempt).where(Attempt.id == attempt_id).with_for_update()
        )
        attempt = result.scalar_one_or_none()
        if not attempt:
            raise ValueError("Attempt not found")
        if attempt.student_id != student_id:
            raise PermissionError("You do not own this attempt")

        # Already finalized — return existing state (idempotent)
        if attempt.status in (AttemptStatus.SUBMITTED, AttemptStatus.EVALUATED):
            return AttemptSubmitResponse(
                id=attempt.id,
                status=attempt.status.value,
                submitted_at=attempt.submitted_at,
                message="Test was already submitted",
            )

        if attempt.status not in (AttemptStatus.IN_PROGRESS, AttemptStatus.CREATED):
            raise ValueError(f"Cannot submit an attempt with status: {attempt.status.value}")

        now = datetime.now(timezone.utc)
        expired = bool(attempt.expires_at and ensure_utc(attempt.expires_at) <= now)
        attempt.status = AttemptStatus.EXPIRED if expired else AttemptStatus.SUBMITTED
        attempt.submitted_at = ensure_utc(attempt.expires_at) if expired else now
        attempt.submission_key = f"{attempt_id}-{now.timestamp()}"
        await self.db.flush()
        await self.db.refresh(attempt)

        return AttemptSubmitResponse(
            id=attempt.id,
            status=attempt.status.value,
            submitted_at=attempt.submitted_at,
            message="Test submitted successfully",
        )

    async def _get_valid_attempt(
        self, attempt_id: UUID, student_id: UUID
    ) -> Attempt:
        """Load and validate an attempt — checks ownership and status.

        When an attempt is found to be expired, we commit the expiry update
        immediately via flush before raising so the status change cannot be
        rolled back by the caller's exception handler discarding the transaction.
        """
        result = await self.db.execute(
            select(Attempt).where(Attempt.id == attempt_id).with_for_update()
        )
        attempt = result.scalar_one_or_none()
        if not attempt:
            raise ValueError("Attempt not found")
        if attempt.student_id != student_id:
            raise PermissionError("You do not own this attempt")
        if attempt.status not in (AttemptStatus.IN_PROGRESS, AttemptStatus.CREATED):
            raise ValueError("This attempt is already finalized")

        # Check expiry — persist the status change before raising so the
        # update survives even if the caller rolls back the outer transaction.
        now = datetime.now(timezone.utc)
        if attempt.expires_at and ensure_utc(attempt.expires_at) <= now:
            attempt.status = AttemptStatus.EXPIRED
            attempt.submitted_at = ensure_utc(attempt.expires_at)
            await self.db.flush()
            await self.db.commit()  # Durably persist expiry before raising
            raise ValueError("This attempt has expired")

        return attempt

    async def get_attempt_count(self, student_id: Optional[UUID] = None) -> int:
        query = select(func.count(Attempt.id))
        if student_id:
            query = query.where(Attempt.student_id == student_id)
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def get_student_attempts(
        self, student_id: UUID, test_id: Optional[UUID] = None
    ) -> list:
        query = select(Attempt).where(Attempt.student_id == student_id)
        query = query.options(selectinload(Attempt.result), selectinload(Attempt.test))
        if test_id:
            query = query.where(Attempt.test_id == test_id)
        query = query.order_by(Attempt.created_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_attempt_by_id(self, attempt_id: UUID) -> Attempt | None:
        """Load an attempt by ID — used for ownership verification."""
        result = await self.db.execute(
            select(Attempt).where(Attempt.id == attempt_id)
        )
        return result.scalar_one_or_none()


class ScoringService:
    """Deterministic scoring engine — independent of the frontend.

    Evaluates MCQ, MSQ, and NAT questions using configured marking rules.
    Uses exact decimal comparison where applicable.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def evaluate_attempt(self, attempt_id: UUID) -> ResultResponse:
        """Score a submitted attempt and persist the result."""
        result = await self.db.execute(
            select(Attempt).where(Attempt.id == attempt_id)
        )
        attempt = result.scalar_one_or_none()
        if not attempt:
            raise ValueError("Attempt not found")
        if attempt.status not in (AttemptStatus.SUBMITTED, AttemptStatus.EXPIRED):
            raise ValueError("Attempt must be submitted before evaluation")

        # Check for existing result — idempotent: return existing without re-scoring
        existing_result = await self.db.execute(
            select(Result).where(Result.attempt_id == attempt_id)
        )
        existing = existing_result.scalar_one_or_none()
        if existing:
            return ResultResponse.model_validate(existing)

        # Load test questions
        tq_result = await self.db.execute(
            select(TestQuestion)
            .where(TestQuestion.test_id == attempt.test_id)
            .order_by(TestQuestion.question_number)
        )
        test_questions = tq_result.scalars().all()

        # Load student answers
        answers_result = await self.db.execute(
            select(AttemptAnswer).where(AttemptAnswer.attempt_id == attempt_id)
        )
        answers_map = {str(a.question_id): a for a in answers_result.scalars().all()}

        total_score = 0.0
        max_possible = 0.0
        correct_count = 0
        incorrect_count = 0
        unanswered_count = 0
        question_results = []
        time_taken = 0

        for tq in test_questions:
            q = tq.question
            # Use 'is not None' so that a zero-mark override on the test question
            # is honoured rather than silently falling through to the question default.
            pos_marks = tq.positive_marks if tq.positive_marks is not None else q.positive_marks
            neg_marks = tq.negative_marks if tq.negative_marks is not None else q.negative_marks
            max_possible += pos_marks

            answer = answers_map.get(str(q.id))

            if not answer or (not answer.selected_option_ids and answer.numerical_answer is None):
                # Unanswered
                unanswered_count += 1
                question_results.append(QuestionResultDetail(
                    question_id=q.id,
                    question_number=tq.question_number,
                    question_type=q.question_type.value,
                    question_text=q.text,
                    student_answer=None,
                    correct_answer=self._get_correct_answer_text(q),
                    is_correct=None,
                    marks_awarded=0,
                    explanation=q.explanation,
                ).model_dump(mode="json"))
                continue

            is_correct, marks = self._evaluate_question(q, answer, pos_marks, neg_marks)
            total_score += marks

            if is_correct:
                correct_count += 1
            else:
                incorrect_count += 1

            student_answer_text = self._get_student_answer_text(q, answer)
            question_results.append(QuestionResultDetail(
                question_id=q.id,
                question_number=tq.question_number,
                question_type=q.question_type.value,
                question_text=q.text,
                student_answer=student_answer_text,
                correct_answer=self._get_correct_answer_text(q),
                is_correct=is_correct,
                marks_awarded=marks,
                explanation=q.explanation,
            ).model_dump(mode="json"))

        total_questions = len(test_questions)
        answered = correct_count + incorrect_count
        accuracy = (correct_count / answered * 100) if answered > 0 else 0.0
        percentage = (total_score / max_possible * 100) if max_possible > 0 else 0.0

        # Time reported by the browser is advisory only; derive it from server timestamps.
        if attempt.started_at:
            end_time = attempt.submitted_at or datetime.now(timezone.utc)
            if attempt.expires_at:
                end_time = min(ensure_utc(end_time), ensure_utc(attempt.expires_at))
            time_taken = max(0, int((ensure_utc(end_time) - ensure_utc(attempt.started_at)).total_seconds()))

        # Determine result visibility from the test's configured release policy.
        # IMMEDIATE → release straight away; anything else → hold for admin release.
        test_result = await self.db.execute(
            select(Test).where(Test.id == attempt.test_id)
        )
        test_obj = test_result.scalar_one_or_none()
        is_released = (
            test_obj is not None
            and test_obj.result_release_policy == ResultReleasePolicy.IMMEDIATE
        )

        new_result = Result(
            attempt_id=attempt_id,
            total_score=total_score,
            max_possible_marks=max_possible,
            correct_count=correct_count,
            incorrect_count=incorrect_count,
            unanswered_count=unanswered_count,
            total_questions=total_questions,
            accuracy_percentage=round(accuracy, 2),
            percentage_score=round(percentage, 2),
            time_taken_seconds=time_taken,
            question_results=question_results,
            is_released=is_released,
        )
        self.db.add(new_result)
        attempt.status = AttemptStatus.EVALUATED
        await self.db.flush()
        await self.db.refresh(new_result)

        return ResultResponse.model_validate(new_result)

    def _evaluate_question(
        self, question: Question, answer: AttemptAnswer,
        pos_marks: float, neg_marks: float,
    ) -> tuple[bool, float]:
        """Evaluate a single question. Returns (is_correct, marks_awarded)."""
        if question.question_type == QuestionType.MCQ:
            return self._evaluate_mcq(question, answer, pos_marks, neg_marks)
        elif question.question_type == QuestionType.MSQ:
            return self._evaluate_msq(question, answer, pos_marks, neg_marks)
        elif question.question_type == QuestionType.NAT:
            return self._evaluate_nat(question, answer, pos_marks, neg_marks)
        return False, 0.0

    def _evaluate_mcq(
        self, question: Question, answer: AttemptAnswer,
        pos_marks: float, neg_marks: float,
    ) -> tuple[bool, float]:
        """MCQ: exactly one correct option must be selected. Negative marking applies.

        Guard against gaming: if a student selects multiple options (which the
        frontend should prevent but the API must also reject), treat as wrong.
        """
        if not answer.selected_option_ids:
            return False, 0.0
        correct_ids = {str(opt.id) for opt in question.options if opt.is_correct}
        if not correct_ids:
            # Question has no correct option configured — score 0, flag as anomaly
            return False, 0.0
        selected = set(answer.selected_option_ids)
        if selected == correct_ids:
            return True, pos_marks
        # Wrong answer: deduct negative marks (neg_marks is stored as a positive value)
        penalty = abs(neg_marks)
        return False, -penalty

    def _evaluate_msq(
        self, question: Question, answer: AttemptAnswer,
        pos_marks: float, neg_marks: float,
    ) -> tuple[bool, float]:
        """MSQ: all correct options must be selected, no extras."""
        if not answer.selected_option_ids:
            return False, 0.0
        correct_ids = {str(opt.id) for opt in question.options if opt.is_correct}
        selected = set(answer.selected_option_ids)
        if selected == correct_ids:
            return True, pos_marks
        # No negative marking for MSQ by default
        return False, 0.0

    def _evaluate_nat(
        self, question: Question, answer: AttemptAnswer,
        pos_marks: float, neg_marks: float,
    ) -> tuple[bool, float]:
        """NAT: compare numerical answer within configured tolerance.

        GATE DA NAT questions have no negative marking.
        Tolerance comparison uses absolute difference.
        """
        if answer.numerical_answer is None:
            return False, 0.0
        if question.correct_numerical_answer is None:
            # Question has no correct answer configured
            return False, 0.0
        # Use 0.0 tolerance for strict equality when not configured
        tolerance = question.numerical_tolerance if question.numerical_tolerance is not None else 0.0
        diff = abs(answer.numerical_answer - question.correct_numerical_answer)
        if diff <= tolerance:
            return True, pos_marks
        # No negative marking for NAT
        return False, 0.0

    def _get_correct_answer_text(self, question: Question) -> str:
        if question.question_type == QuestionType.NAT:
            return str(question.correct_numerical_answer)
        correct_opts = [opt for opt in question.options if opt.is_correct]
        return ", ".join(f"{opt.label}" for opt in correct_opts)

    def _get_student_answer_text(
        self, question: Question, answer: AttemptAnswer
    ) -> str:
        if question.question_type == QuestionType.NAT:
            return str(answer.numerical_answer) if answer.numerical_answer is not None else "Not answered"
        if not answer.selected_option_ids:
            return "Not answered"
        selected_ids = set(answer.selected_option_ids)
        selected_opts = [opt for opt in question.options if str(opt.id) in selected_ids]
        return ", ".join(f"{opt.label}" for opt in selected_opts)

    async def get_result(self, attempt_id: UUID) -> Result | None:
        result = await self.db.execute(
            select(Result).where(Result.attempt_id == attempt_id)
        )
        return result.scalar_one_or_none()

    async def evaluate_attempt_idempotent(self, attempt_id: UUID) -> ResultResponse | None:
        """Evaluate an attempt and return the result. If already evaluated, return existing.

        This is safe to call multiple times — it will never re-score an attempt.
        """
        existing = await self.get_result(attempt_id)
        if existing:
            return ResultResponse.model_validate(existing)
        try:
            return await self.evaluate_attempt(attempt_id)
        except ValueError:
            # Attempt may not be in a scoreable state yet; caller should handle
            return None
