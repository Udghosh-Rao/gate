"""Exam management service — CRUD operations for examinations."""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exam import Exam, ExamStatus, Subject, Topic, SyllabusVersion, Resource
from app.schemas.exam import (
    ExamCreateRequest, ExamUpdateRequest, ExamResponse,
    SubjectCreateRequest, SubjectResponse,
    TopicCreateRequest, TopicResponse,
    SyllabusVersionCreateRequest, SyllabusVersionResponse,
    ResourceCreateRequest, ResourceUpdateRequest, ResourceResponse,
)


class ExamService:
    """Handles exam CRUD and related content management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Exams ---

    async def create_exam(self, data: ExamCreateRequest, created_by: UUID) -> ExamResponse:
        exam = Exam(
            name=data.name,
            code=data.code.upper(),
            slug=data.slug.lower(),
            description=data.description,
            logo_url=data.logo_url,
            status=ExamStatus(data.status),
            default_duration_seconds=data.default_duration_seconds,
            default_total_marks=data.default_total_marks,
            instructions=data.instructions,
            display_order=data.display_order,
            created_by=created_by,
        )
        self.db.add(exam)
        await self.db.flush()
        await self.db.refresh(exam)
        return ExamResponse.model_validate(exam)

    async def get_exams(self, status_filter: Optional[str] = None) -> List[ExamResponse]:
        query = select(Exam)
        if status_filter:
            query = query.where(Exam.status == ExamStatus(status_filter))
        query = query.order_by(Exam.display_order, Exam.name)
        result = await self.db.execute(query)
        return [ExamResponse.model_validate(e) for e in result.scalars().all()]

    async def get_active_exams(self) -> List[ExamResponse]:
        return await self.get_exams(status_filter="ACTIVE")

    async def get_exam_by_slug(self, slug: str) -> ExamResponse | None:
        result = await self.db.execute(select(Exam).where(Exam.slug == slug.lower()))
        exam = result.scalar_one_or_none()
        return ExamResponse.model_validate(exam) if exam else None

    async def get_exam_by_id(self, exam_id: UUID) -> Exam | None:
        result = await self.db.execute(select(Exam).where(Exam.id == exam_id))
        return result.scalar_one_or_none()

    async def update_exam(self, exam_id: UUID, data: ExamUpdateRequest) -> ExamResponse | None:
        exam = await self.get_exam_by_id(exam_id)
        if not exam:
            return None
        update_data = data.model_dump(exclude_unset=True)
        if "status" in update_data:
            update_data["status"] = ExamStatus(update_data["status"])
        for key, value in update_data.items():
            setattr(exam, key, value)
        await self.db.flush()
        await self.db.refresh(exam)
        return ExamResponse.model_validate(exam)

    # --- Subjects ---

    async def create_subject(self, exam_id: UUID, data: SubjectCreateRequest) -> SubjectResponse:
        subject = Subject(
            exam_id=exam_id,
            name=data.name,
            code=data.code.upper(),
            description=data.description,
            display_order=data.display_order,
        )
        self.db.add(subject)
        await self.db.flush()
        await self.db.refresh(subject)
        return SubjectResponse.model_validate(subject)

    async def get_subjects(self, exam_id: UUID) -> List[SubjectResponse]:
        result = await self.db.execute(
            select(Subject)
            .where(Subject.exam_id == exam_id, Subject.is_active == True)
            .order_by(Subject.display_order, Subject.name)
        )
        return [SubjectResponse.model_validate(s) for s in result.scalars().all()]

    # --- Topics ---

    async def create_topic(self, data: TopicCreateRequest) -> TopicResponse:
        topic = Topic(
            subject_id=data.subject_id,
            syllabus_version_id=data.syllabus_version_id,
            parent_id=data.parent_id,
            name=data.name,
            description=data.description,
            display_order=data.display_order,
        )
        self.db.add(topic)
        await self.db.flush()
        await self.db.refresh(topic)
        return TopicResponse.model_validate(topic)

    async def get_topics(self, subject_id: UUID) -> List[TopicResponse]:
        result = await self.db.execute(
            select(Topic)
            .where(Topic.subject_id == subject_id, Topic.is_active == True)
            .order_by(Topic.display_order, Topic.name)
        )
        return [TopicResponse.model_validate(t) for t in result.scalars().all()]

    # --- Syllabus Versions ---

    async def create_syllabus_version(
        self, exam_id: UUID, data: SyllabusVersionCreateRequest
    ) -> SyllabusVersionResponse:
        sv = SyllabusVersion(
            exam_id=exam_id,
            version=data.version,
            description=data.description,
            is_active=data.is_active,
        )
        self.db.add(sv)
        await self.db.flush()
        await self.db.refresh(sv)
        return SyllabusVersionResponse.model_validate(sv)

    async def get_syllabus_versions(self, exam_id: UUID) -> List[SyllabusVersionResponse]:
        result = await self.db.execute(
            select(SyllabusVersion).where(SyllabusVersion.exam_id == exam_id)
        )
        return [SyllabusVersionResponse.model_validate(sv) for sv in result.scalars().all()]

    # --- Resources (Study Material / Notes) ---

    async def create_resource(
        self, exam_id: UUID, data: ResourceCreateRequest, uploaded_by: UUID
    ) -> ResourceResponse:
        resource = Resource(
            exam_id=exam_id,
            topic_id=data.topic_id,
            title=data.title,
            description=data.description,
            resource_type=data.resource_type,
            file_url=data.file_url,
            file_size_bytes=data.file_size_bytes,
            mime_type=data.mime_type,
            is_published=data.is_published,
            uploaded_by=uploaded_by,
        )
        self.db.add(resource)
        await self.db.flush()
        await self.db.refresh(resource)
        return ResourceResponse.model_validate(resource)

    async def get_resources(
        self,
        exam_id: UUID,
        topic_id: Optional[UUID] = None,
        published_only: bool = True,
    ) -> List[ResourceResponse]:
        query = select(Resource).where(Resource.exam_id == exam_id)
        if published_only:
            query = query.where(Resource.is_published == True)
        if topic_id:
            query = query.where(Resource.topic_id == topic_id)
        query = query.order_by(Resource.created_at.desc())
        result = await self.db.execute(query)
        return [ResourceResponse.model_validate(r) for r in result.scalars().all()]

    async def update_resource(
        self, resource_id: UUID, data: ResourceUpdateRequest
    ) -> ResourceResponse | None:
        result = await self.db.execute(select(Resource).where(Resource.id == resource_id))
        resource = result.scalar_one_or_none()
        if not resource:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(resource, key, value)
        await self.db.flush()
        await self.db.refresh(resource)
        return ResourceResponse.model_validate(resource)

    async def delete_resource(self, resource_id: UUID) -> bool:
        result = await self.db.execute(select(Resource).where(Resource.id == resource_id))
        resource = result.scalar_one_or_none()
        if not resource:
            return False
        await self.db.delete(resource)
        await self.db.flush()
        return True

    # --- Stats ---

    async def get_exam_count(self) -> int:
        result = await self.db.execute(select(func.count(Exam.id)))
        return result.scalar() or 0

    async def get_active_exam_count(self) -> int:
        result = await self.db.execute(
            select(func.count(Exam.id)).where(Exam.status == ExamStatus.ACTIVE)
        )
        return result.scalar() or 0

