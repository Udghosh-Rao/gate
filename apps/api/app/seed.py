"""Database seeding script for competitive examination platform.

Seeds:
1. Default development users (ADMIN, STUDENT, CONTENT_MANAGER)
2. GATE Data Science and AI (GATE DA) exam specification
3. Detailed Subjects and Topics for GATE DA syllabus
4. Study notes & resource materials
5. Comprehensive Question Bank (MCQ, MSQ, NAT)
6. Test Series & Mock Tests (Full Length Mock, Topic Tests)
"""

import asyncio
from datetime import datetime, timezone
import uuid

from sqlalchemy import select
from app.core.database import async_session_factory, engine, Base
from app.core.security import hash_password
from app.models.user import User, UserRole, UserStatus
from app.models.exam import Exam, ExamStatus, SyllabusVersion, Subject, Topic, Resource
from app.models.question import (
    Question, QuestionOption, QuestionType, QuestionDifficulty, QuestionStatus
)
from app.models.test import (
    TestSeries, Test, TestSection, TestQuestion,
    TestSeriesStatus, TestStatus,
    ResultReleasePolicy, ExplanationReleasePolicy
)


async def seed():
    """Execute complete database seeding."""
    print("🌱 Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        # 1. Seed Users
        print("👤 Creating default accounts...")
        existing_admin = await session.execute(
            select(User).where(User.email == "admin@examplatform.dev")
        )
        admin_user = existing_admin.scalar_one_or_none()

        if not admin_user:
            admin_user = User(
                email="admin@examplatform.dev",
                hashed_password=hash_password("Admin@Dev123"),
                full_name="Platform Administrator",
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
            )
            session.add(admin_user)

        existing_student = await session.execute(
            select(User).where(User.email == "student@examplatform.dev")
        )
        student_user = existing_student.scalar_one_or_none()
        if not student_user:
            student_user = User(
                email="student@examplatform.dev",
                hashed_password=hash_password("Student@Dev123"),
                full_name="Aarav Sharma",
                role=UserRole.STUDENT,
                status=UserStatus.ACTIVE,
            )
            session.add(student_user)

        existing_cm = await session.execute(
            select(User).where(User.email == "content@examplatform.dev")
        )
        cm_user = existing_cm.scalar_one_or_none()
        if not cm_user:
            cm_user = User(
                email="content@examplatform.dev",
                hashed_password=hash_password("Content@Dev123"),
                full_name="Content Lead",
                role=UserRole.CONTENT_MANAGER,
                status=UserStatus.ACTIVE,
            )
            session.add(cm_user)

        await session.flush()

        # 2. Seed Exams
        print("🎯 Creating GATE DA Exam...")
        existing_exam = await session.execute(
            select(Exam).where(Exam.code == "GATE-DA")
        )
        gate_da = existing_exam.scalar_one_or_none()

        if not gate_da:
            gate_da = Exam(
                name="GATE Data Science & Artificial Intelligence",
                code="GATE-DA",
                slug="gate-da",
                description="Graduate Aptitude Test in Engineering for Data Science and Artificial Intelligence. Comprehensive preparation platform covering Probability, Linear Algebra, Machine Learning, Deep Learning, and AI.",
                status=ExamStatus.ACTIVE,
                default_duration_seconds=10800,  # 3 hours (180 mins)
                default_total_marks=100.0,
                instructions="1. Total duration of exam is 180 minutes.\n2. The exam consists of 65 questions carrying 100 marks.\n3. Questions are of three types: MCQ (Multiple Choice Questions), MSQ (Multiple Select Questions), and NAT (Numerical Answer Type).\n4. For MCQ: Negative marking applies (-0.33 for 1 mark, -0.66 for 2 marks).\n5. For MSQ and NAT: NO negative marking.\n6. Scientific virtual calculator is accessible during the test.",
                created_by=admin_user.id,
                config={
                    "sections": [
                        {"name": "General Aptitude", "marks": 15, "questions": 10},
                        {"name": "Data Science & AI", "marks": 85, "questions": 55}
                    ],
                    "calculator_enabled": True,
                }
            )
            session.add(gate_da)
            await session.flush()

        # Also add GATE CS as an upcoming exam to prove multi-exam dynamism
        existing_gate_cs = await session.execute(
            select(Exam).where(Exam.code == "GATE-CS")
        )
        if not existing_gate_cs.scalar_one_or_none():
            gate_cs = Exam(
                name="GATE Computer Science & Information Technology",
                code="GATE-CS",
                slug="gate-cs",
                description="Graduate Aptitude Test in Engineering for CS & IT. Algorithms, Operating Systems, Computer Networks, and DBMS.",
                status=ExamStatus.ACTIVE,
                default_duration_seconds=10800,
                default_total_marks=100.0,
                instructions="Standard GATE CS rules apply.",
                created_by=admin_user.id,
            )
            session.add(gate_cs)
            await session.flush()

        # 3. Seed Syllabus Version & Subjects for GATE DA
        print("📚 Creating Syllabus Subjects and Topics...")
        existing_version = await session.execute(
            select(SyllabusVersion).where(
                SyllabusVersion.exam_id == gate_da.id,
                SyllabusVersion.version == "2025-2026"
            )
        )
        syllabus_v = existing_version.scalar_one_or_none()
        if not syllabus_v:
            syllabus_v = SyllabusVersion(
                exam_id=gate_da.id,
                version="2025-2026",
                is_active=True,
                description="Official GATE DA 2025-2026 Syllabus",
            )
            session.add(syllabus_v)
            await session.flush()

        subjects_data = [
            {
                "name": "Probability & Statistics",
                "code": "PROB-STAT",
                "description": "Counting, probability axioms, conditional probability, random variables, Bayes theorem, distributions, sampling, hypothesis testing.",
                "topics": [
                    "Conditional Probability & Bayes Theorem",
                    "Random Variables & Expectation",
                    "Probability Distributions (Gaussian, Poisson, Binomial)",
                    "Hypothesis Testing & Confidence Intervals",
                ]
            },
            {
                "name": "Linear Algebra",
                "code": "LIN-ALG",
                "description": "Vector spaces, subspaces, linear dependence, matrices, projections, eigenvalues, eigenvectors, SVD, PCA.",
                "topics": [
                    "Vector Spaces & Subspaces",
                    "Eigenvalues, Eigenvectors & Diagonalization",
                    "Singular Value Decomposition (SVD)",
                    "Principal Component Analysis (PCA)",
                ]
            },
            {
                "name": "Machine Learning",
                "code": "ML",
                "description": "Supervised, unsupervised learning, SVM, Decision Trees, Random Forests, Clustering, Neural Networks basics.",
                "topics": [
                    "Linear & Logistic Regression",
                    "Support Vector Machines (SVM)",
                    "Decision Trees & Ensemble Methods",
                    "K-Means & Hierarchical Clustering",
                ]
            },
            {
                "name": "Artificial Intelligence",
                "code": "AI",
                "description": "Search algorithms, heuristic search, adversarial search, propositional and predicate logic.",
                "topics": [
                    "Informed & Uninformed Search (A*, DFS, BFS)",
                    "Minimax & Alpha-Beta Pruning",
                    "Propositional & First-Order Logic",
                ]
            },
            {
                "name": "Data Structures & Algorithms",
                "code": "DSA",
                "description": "Python programming, asymptotic analysis, arrays, stacks, queues, trees, graphs, sorting, searching.",
                "topics": [
                    "Time & Space Complexity Analysis",
                    "Trees & Binary Search Trees",
                    "Graph Algorithms (Dijkstra, BFS, DFS)",
                    "Dynamic Programming Fundamentals",
                ]
            },
        ]

        created_subjects = {}
        created_topics = {}

        for s_idx, s_info in enumerate(subjects_data):
            subj_res = await session.execute(
                select(Subject).where(Subject.exam_id == gate_da.id, Subject.code == s_info["code"])
            )
            subj = subj_res.scalar_one_or_none()
            if not subj:
                subj = Subject(
                    exam_id=gate_da.id,
                    name=s_info["name"],
                    code=s_info["code"],
                    description=s_info["description"],
                    display_order=s_idx + 1,
                )
                session.add(subj)
                await session.flush()
            created_subjects[s_info["code"]] = subj

            for t_idx, topic_name in enumerate(s_info["topics"]):
                topic_res = await session.execute(
                    select(Topic).where(Topic.subject_id == subj.id, Topic.name == topic_name)
                )
                topic = topic_res.scalar_one_or_none()
                if not topic:
                    topic = Topic(
                        subject_id=subj.id,
                        syllabus_version_id=syllabus_v.id,
                        name=topic_name,
                        display_order=t_idx + 1,
                    )
                    session.add(topic)
                    await session.flush()
                created_topics[f"{s_info['code']}_{t_idx}"] = topic

        # 4. Seed Resources (Study Notes & Formula Sheets)
        print("📄 Adding Study Resources & Notes...")
        existing_res = await session.execute(
            select(Resource).where(Resource.exam_id == gate_da.id)
        )
        if not existing_res.scalars().first():
            resources_data = [
                Resource(
                    exam_id=gate_da.id,
                    topic_id=created_topics["PROB-STAT_0"].id,
                    title="Probability Distributions Cheat Sheet",
                    description="Comprehensive reference for PMFs, PDFs, Mean, Variance, and MGF for all GATE DA distributions.",
                    resource_type="notes",
                    file_url="/uploads/probability_distributions.pdf",
                    file_size_bytes=245000,
                    mime_type="application/pdf",
                    is_published=True,
                    uploaded_by=admin_user.id,
                ),
                Resource(
                    exam_id=gate_da.id,
                    topic_id=created_topics["LIN-ALG_1"].id,
                    title="Eigenvalues & SVD Essential Formulae",
                    description="Rank-nullity theorem, positive definite matrix properties, and SVD decomposition steps.",
                    resource_type="notes",
                    file_url="/uploads/linear_algebra_svd.pdf",
                    file_size_bytes=312000,
                    mime_type="application/pdf",
                    is_published=True,
                    uploaded_by=admin_user.id,
                ),
                Resource(
                    exam_id=gate_da.id,
                    topic_id=created_topics["ML_0"].id,
                    title="Regularization & Loss Functions Guide",
                    description="L1 Lasso vs L2 Ridge differences, Cross-Entropy Loss, and SVM Margin optimization.",
                    resource_type="notes",
                    file_url="/uploads/ml_loss_functions.pdf",
                    file_size_bytes=189000,
                    mime_type="application/pdf",
                    is_published=True,
                    uploaded_by=admin_user.id,
                ),
            ]
            session.add_all(resources_data)
            await session.flush()

        # 5. Seed Questions (MCQ, MSQ, NAT)
        print("❓ Creating Rich Question Bank (MCQ, MSQ, NAT)...")
        existing_q = await session.execute(
            select(Question).where(Question.exam_id == gate_da.id)
        )
        if not existing_q.scalars().first():
            # Q1: MCQ (Probability) - 1 Mark
            q1 = Question(
                exam_id=gate_da.id,
                subject_id=created_subjects["PROB-STAT"].id,
                topic_id=created_topics["PROB-STAT_0"].id,
                question_type=QuestionType.MCQ,
                difficulty=QuestionDifficulty.EASY,
                status=QuestionStatus.PUBLISHED,
                text="Two fair coins are flipped simultaneously. Given that at least one flip is Heads, what is the probability that both flips are Heads?",
                explanation="Sample space: S = {HH, HT, TH, TT}. Event A: at least one Heads = {HH, HT, TH} (size 3). Event B: both Heads = {HH} (size 1). P(B|A) = |A ∩ B| / |A| = 1/3.",
                positive_marks=1.0,
                negative_marks=0.33,
                created_by=admin_user.id,
            )
            session.add(q1)
            await session.flush()

            session.add_all([
                QuestionOption(question_id=q1.id, label="A", text="1/4", is_correct=False, display_order=1),
                QuestionOption(question_id=q1.id, label="B", text="1/3", is_correct=True, display_order=2),
                QuestionOption(question_id=q1.id, label="C", text="1/2", is_correct=False, display_order=3),
                QuestionOption(question_id=q1.id, label="D", text="2/3", is_correct=False, display_order=4),
            ])

            # Q2: MSQ (Linear Algebra) - 2 Marks
            q2 = Question(
                exam_id=gate_da.id,
                subject_id=created_subjects["LIN-ALG"].id,
                topic_id=created_topics["LIN-ALG_1"].id,
                question_type=QuestionType.MSQ,
                difficulty=QuestionDifficulty.MEDIUM,
                status=QuestionStatus.PUBLISHED,
                text="Let A be a 3 × 3 real symmetric matrix with eigenvalues λ1 = 2, λ2 = 2, and λ3 = 5. Which of the following statements are TRUE? (Select all that apply)",
                explanation="1. Since A is real symmetric, it is always orthogonally diagonalizable, regardless of repeated eigenvalues. Hence (A) is true.\n2. Trace(A) = sum of eigenvalues = 2 + 2 + 5 = 9. Hence (B) is true.\n3. det(A) = product of eigenvalues = 2 * 2 * 5 = 20. Hence (C) is true.\n4. Since all eigenvalues > 0, A is positive definite, not negative definite.",
                positive_marks=2.0,
                negative_marks=0.0,
                created_by=admin_user.id,
            )
            session.add(q2)
            await session.flush()

            session.add_all([
                QuestionOption(question_id=q2.id, label="A", text="Matrix A is diagonalizable.", is_correct=True, display_order=1),
                QuestionOption(question_id=q2.id, label="B", text="The trace of A is 9.", is_correct=True, display_order=2),
                QuestionOption(question_id=q2.id, label="C", text="The determinant of A is 20.", is_correct=True, display_order=3),
                QuestionOption(question_id=q2.id, label="D", text="Matrix A is negative definite.", is_correct=False, display_order=4),
            ])

            # Q3: NAT (Numerical Answer Type - Machine Learning) - 2 Marks
            q3 = Question(
                exam_id=gate_da.id,
                subject_id=created_subjects["ML"].id,
                topic_id=created_topics["ML_0"].id,
                question_type=QuestionType.NAT,
                difficulty=QuestionDifficulty.MEDIUM,
                status=QuestionStatus.PUBLISHED,
                text="In a binary classification test dataset of 100 samples, the classifier predicted positive for 40 samples, of which 30 were True Positives. There are 50 actual positives in total. Calculate the F1-score of the classifier. (Round to 2 decimal places)",
                explanation="Precision = TP / (TP + FP) = 30 / 40 = 0.75.\nRecall = TP / (TP + FN) = 30 / 50 = 0.60.\nF1-score = 2 * (Precision * Recall) / (Precision + Recall) = 2 * (0.75 * 0.60) / (0.75 + 0.60) = 0.90 / 1.35 = 2/3 ≈ 0.67.",
                positive_marks=2.0,
                negative_marks=0.0,
                correct_numerical_answer=0.67,
                numerical_tolerance=0.02,
                created_by=admin_user.id,
            )
            session.add(q3)

            # Q4: MCQ (AI Search) - 1 Mark
            q4 = Question(
                exam_id=gate_da.id,
                subject_id=created_subjects["AI"].id,
                topic_id=created_topics["AI_0"].id,
                question_type=QuestionType.MCQ,
                difficulty=QuestionDifficulty.EASY,
                status=QuestionStatus.PUBLISHED,
                text="In A* search algorithm, let h(n) be the heuristic function and h*(n) be the true optimal cost from node n to goal. A* is guaranteed to be admissible (optimal) on tree search if:",
                explanation="For tree search, A* is admissible if h(n) <= h*(n) for all n (admissible heuristic). For graph search, consistency (monotonicity) is also required.",
                positive_marks=1.0,
                negative_marks=0.33,
                created_by=admin_user.id,
            )
            session.add(q4)
            await session.flush()

            session.add_all([
                QuestionOption(question_id=q4.id, label="A", text="h(n) <= h*(n) for all n (admissibility)", is_correct=True, display_order=1),
                QuestionOption(question_id=q4.id, label="B", text="h(n) >= h*(n) for all n", is_correct=False, display_order=2),
                QuestionOption(question_id=q4.id, label="C", text="h(n) = 0 for all nodes", is_correct=False, display_order=3),
                QuestionOption(question_id=q4.id, label="D", text="h(n) is negative", is_correct=False, display_order=4),
            ])

            # Q5: NAT (DSA / Time Complexity) - 1 Mark
            q5 = Question(
                exam_id=gate_da.id,
                subject_id=created_subjects["DSA"].id,
                topic_id=created_topics["DSA_0"].id,
                question_type=QuestionType.NAT,
                difficulty=QuestionDifficulty.EASY,
                status=QuestionStatus.PUBLISHED,
                text="A recurrence relation is given by T(n) = 2*T(n/2) + n for n > 1, with T(1) = 1. If n = 64, what is the exact value of T(64)?",
                explanation="By Master Theorem / recursion tree: T(n) = n * log2(n) + n.\nFor n = 64: log2(64) = 6.\nT(64) = 64 * 6 + 64 = 384 + 64 = 448.",
                positive_marks=1.0,
                negative_marks=0.0,
                correct_numerical_answer=448.0,
                numerical_tolerance=0.0,
                created_by=admin_user.id,
            )
            session.add(q5)
            await session.flush()

        # 6. Seed Test Series & Tests
        print("🎯 Creating Test Series and Mock Tests...")
        existing_ts = await session.execute(
            select(TestSeries).where(TestSeries.exam_id == gate_da.id)
        )
        test_series = existing_ts.scalar_one_or_none()
        if not test_series:
            test_series = TestSeries(
                exam_id=gate_da.id,
                name="All India GATE DA 2026 Premier Mock Test Series",
                slug="gate-da-2026-premier-series",
                description="Engineered according to the latest GATE DA syllabus. Includes topic tests, sectional tests, and full-length simulated CBTs.",
                status=TestSeriesStatus.PUBLISHED,
                display_order=1,
            )
            session.add(test_series)
            await session.flush()

        # Create Mock Test 1: Full CBT Simulation
        existing_test = await session.execute(
            select(Test).where(Test.test_series_id == test_series.id, Test.slug == "gate-da-all-india-open-mock-1")
        )
        test_mock1 = existing_test.scalar_one_or_none()
        if not test_mock1:
            test_mock1 = Test(
                test_series_id=test_series.id,
                exam_id=gate_da.id,
                title="[SAMPLE] GATE DA Demo Test — 5 Questions",
                slug="gate-da-all-india-open-mock-1",
                description=(
                    "Developer demo test with 5 sample questions covering MCQ, MSQ, and NAT formats. "
                    "This is NOT a full-length mock examination. "
                    "Full mock tests will be added by the admin via the Content Management System."
                ),
                duration_seconds=10800,  # 3 hours
                total_marks=7.0,
                total_questions=5,
                status=TestStatus.PUBLISHED,
                result_release_policy=ResultReleasePolicy.IMMEDIATE,
                explanation_release_policy=ExplanationReleasePolicy.WITH_RESULT,
                instructions=(
                    "DEMO TEST — This test contains only 5 sample questions for platform demonstration.\n"
                    "1. The 5 questions cover MCQ, MSQ, and NAT formats used in GATE.\n"
                    "2. Server timing is authoritative. The timer is set to 3 hours for demo convenience.\n"
                    "3. You can flag questions for review and clear answers before submitting.\n"
                    "4. Scores and explanations are released immediately after submission."
                ),
                display_order=1,
            )
            session.add(test_mock1)
            await session.flush()

            # Create Sections: Section 1 (General & Math), Section 2 (Core AI & ML)
            sec1 = TestSection(
                test_id=test_mock1.id,
                name="Section 1: Mathematical Foundations",
                description="Probability, Linear Algebra, and Calculus questions",
                display_order=1,
            )
            sec2 = TestSection(
                test_id=test_mock1.id,
                name="Section 2: AI, ML & Data Structures",
                description="Machine Learning, Search, and Algorithmic analysis",
                display_order=2,
            )
            session.add_all([sec1, sec2])
            await session.flush()

            # Attach Questions to Test
            all_questions = (await session.execute(
                select(Question).where(Question.exam_id == gate_da.id).order_by(Question.created_at)
            )).scalars().all()

            for idx, q in enumerate(all_questions):
                sec = sec1 if idx < 2 else sec2
                session.add(
                    TestQuestion(
                        test_id=test_mock1.id,
                        question_id=q.id,
                        section_id=sec.id,
                        question_number=idx + 1,
                        positive_marks=q.positive_marks,
                        negative_marks=q.negative_marks,
                    )
                )
            await session.flush()

        await session.commit()
        print("✅ Seeding completed successfully!")
        print("--------------------------------------------------")
        print("✨ Demo Credentials:")
        print("   Admin:           admin@examplatform.dev    / Admin@Dev123")
        print("   Student:         student@examplatform.dev  / Student@Dev123")
        print("   Content Manager: content@examplatform.dev  / Content@Dev123")
        print("--------------------------------------------------")


if __name__ == "__main__":
    asyncio.run(seed())
