# Build a Production-Ready Multi-Exam Competitive Examination Platform

## 1. Your Role

Act as a senior full-stack software architect, product designer, backend engineer, database engineer, security engineer, and QA engineer.

Build a real, professional, scalable web application for an Indian competitive-exam preparation startup.

The platform will initially focus on GATE Data Science and Artificial Intelligence (GATE DA). The architecture must support adding GATE CS, IIT JAM, and other competitive examinations later through the admin interface without requiring code changes for each new exam.

This is a real startup product, not a portfolio project, landing-page-only website, static dashboard, or UI mockup.

You must implement functional frontend pages, backend APIs, database persistence, authentication, role-based authorization, question management, timed examinations, automatic evaluation, result analysis, and administrative workflows.

Do not simply generate a plan and stop. Inspect the repository, create an implementation plan, and then implement the application in verified stages.

## 2. Product Vision

Build a single examination platform that can host multiple exams, subjects, syllabi, study resources, question banks, test series, and examination attempts.

The application must have:

- A professional public website.
- A student learning and examination portal.
- An administrative control panel.
- A content and exam management interface.
- A reliable computer-based test (CBT) experience.
- A reusable examination engine.
- A results and performance analytics system.

GATE DA is the initial active examination. Other examinations must be addable dynamically by authorized administrators.

The platform must not require a developer to edit source code whenever an administrator creates a new examination, subject, test series, or mock test.

## 3. User Roles and Permissions

Implement exactly three application roles in the initial version.

### Role A: ADMIN

The administrator has platform-wide management privileges.

The admin must be able to:

1. Create, edit, archive, and publish examinations.
2. Configure exam name, code, description, logo, syllabus, sections, duration, marking rules, and display order.
3. Create and manage subjects, syllabus topics, chapters, and subtopics.
4. Create, edit, preview, schedule, publish, unpublish, and archive test series and tests.
5. Create and manage MCQ, MSQ, and numerical-answer questions.
6. Upload questions in bulk using a documented import format.
7. Upload notes, PDFs, images, and study resources.
8. Manage answer keys, explanations, difficulty levels, marks, and negative marking.
9. Create and manage student and content-manager accounts.
10. Assign and revoke roles through authorized workflows.
11. Review student attempts, scores, completion rates, and performance statistics.
12. Configure whether results and explanations are released immediately or later.
13. View platform-level audit logs.
14. Manage temporary branding, exam logos, and site configuration.
15. Preview content and examination screens before publication.

An admin must not be able to create invalid tests, publish questions without required answer keys, or accidentally expose unpublished content.

### Role B: STUDENT

Students must be able to:

1. Register, log in, log out, and manage their profiles.
2. Browse available examinations.
3. Select GATE DA as their initial examination.
4. Browse the syllabus by subject, topic, and chapter.
5. Access published study notes and resources.
6. Browse test series and available mock tests.
7. View test instructions and marking rules before starting.
8. Start a test and resume an eligible in-progress attempt.
9. Navigate questions and save answers.
10. Mark questions for review.
11. Change or clear answers before submission.
12. View answered, unanswered, and review-marked questions.
13. Submit a test manually or be submitted automatically when time expires.
14. View results when permitted by the test's result-release settings.
15. Review correct answers, incorrect answers, unanswered questions, and explanations when released.
16. View previous attempts, accuracy, marks, time spent, and topic-wise performance.
17. View personal progress across tests.

Students must never access admin functions, unpublished content, another student's private attempts, answer keys before release, or protected administrative APIs.

### Role C: CONTENT_MANAGER

The content manager supports exam preparation and content operations.

The content manager must be able to:

1. Create and edit questions in assigned examinations.
2. Organize questions by subject, topic, chapter, and difficulty.
3. Add correct answers, explanations, and marking rules.
4. Upload and organize notes and learning resources.
5. Create draft tests and test series.
6. Preview and validate questions.
7. Submit content for administrator approval.
8. View the status of submitted content.

The content manager must not be able to grant themselves admin privileges, manage platform security settings, view private account information unnecessarily, or publish restricted content unless the admin explicitly grants that permission.

Enforce all permissions on the server. Frontend visibility controls are not security controls.

Use a role-based access-control system with explicit permission checks. Include automated tests proving that unauthorized access is rejected.

## 4. Exam Configuration and Multi-Exam Architecture

Examinations must be database-driven.

An examination record should support fields such as:

- id
- name
- code
- slug
- description
- logo_url
- syllabus_version
- status
- default_duration_seconds
- default_total_marks
- instructions
- created_by
- created_at
- updated_at

These are starting concepts, not a requirement to put every property into one table. Design appropriate related tables and constraints.

An administrator should be able to create an examination through a form.

Example initial exam configuration:

Name: GATE Data Science and Artificial Intelligence  
Code: DA  
Slug: gate-da  
Status: Active  
Logo: Temporary placeholder  
Initial test catalogue: Demo tests and draft test series

Future examples:

- GATE Computer Science and Information Technology
- IIT JAM Mathematical Statistics
- IIT JAM Mathematics

These future examinations are examples only. Do not publish misleading exam information or fabricated official syllabus details.

For each examination, support:

- Multiple syllabus versions.
- Subjects and sections.
- Hierarchical topics and subtopics.
- Notes and resources.
- Question banks.
- Test series.
- Mock tests.
- Independent marking rules.
- Test duration and instructions.
- Publication and result-release policies.

Adding a new examination must require database records and admin actions, not new React components, new API routes specific to that exam, or hardcoded conditionals.

Use generic exam routes such as:

/exams
/exams/[examSlug]
/exams/[examSlug]/syllabus
/exams/[examSlug]/tests

The admin interface should provide an examination creation and editing workflow.

## 5. Examination Engine

The examination engine is the most important part of the application.

Build a functional computer-based testing interface inspired by established assessment systems. Use familiar examination conventions without copying another company's proprietary interface or branding.

### Question types

Support:

**MCQ — Multiple Choice Question**
- Single correct option.
- Configurable marks.
- Configurable negative marking.
- Clear selected-option state.

**MSQ — Multiple Select Question**
- Multiple correct options.
- Student can select and deselect multiple options.
- Configurable scoring policy.
- No negative marking by default unless the exam configuration explicitly requires another rule.

**NAT — Numerical Answer Type**
- Numeric input.
- Configurable numerical tolerance.
- Support integer and decimal answers.
- Validate the accepted input format.
- No negative marking by default unless configured otherwise.

Design the question schema so that more question types can be introduced later.

### Test instructions

Before starting, show:

- Test title.
- Exam name.
- Duration.
- Number of questions.
- Total marks.
- Question types.
- Marking scheme.
- Negative-marking rules.
- Navigation instructions.
- Submission policy.

Require explicit confirmation before creating an attempt.

### Test-taking interface

Build a polished, responsive examination screen containing:

- Examination title and section.
- Countdown timer.
- Question number and marks.
- Question text.
- Optional question image or diagram.
- Answer options or numerical input.
- Previous and next navigation.
- Clear-response action.
- Mark-for-review action.
- Save-and-next action.
- Question palette.
- Answered status.
- Unanswered status.
- Marked-for-review status.
- Answered-and-marked-for-review status.
- Submission control.
- Confirmation dialog before manual submission.

Make the question palette clickable and keep the selected question and answer state synchronized.

Use accessible status labels and visual indicators. Do not rely only on colours to convey answer status.

### Attempt lifecycle

Use a server-controlled attempt lifecycle, for example:

CREATED → IN_PROGRESS → SUBMITTED → EVALUATED

Handle expiry, cancellation, and exceptional states explicitly where appropriate.

When a student starts a test:

1. The backend verifies eligibility and publication status.
2. The backend creates the attempt.
3. The backend records the authoritative start time and expiry time.
4. The backend returns the attempt details and permitted question content.
5. The frontend displays the remaining time based on server timestamps.
6. Student answers are saved incrementally.
7. The backend rejects answer modifications after the attempt closes.
8. Manual submission or expiry triggers finalization.
9. Evaluation runs according to the configured marking scheme.
10. The result is stored and made available according to the release policy.

Do not rely exclusively on a JavaScript timer for enforcement.

On page reload or reconnection, restore the eligible in-progress attempt from the backend and calculate the remaining time from the authoritative expiry timestamp.

Display a clear warning before expiry. When the time expires, finalize the attempt automatically, including any answers successfully saved before the deadline.

Protect against duplicate submissions using idempotent submission logic.

Define what happens when a save request races with submission or expiry. Ensure a late request cannot change a finalized attempt.

Do not claim that answers are saved until the backend confirms persistence. Use a visible saving/saved/error indicator.

### Question navigation

Support:

- Current question.
- Previously visited questions.
- Answered questions.
- Unanswered questions.
- Marked-for-review questions.
- Answered and marked-for-review questions.

Show a clear question-status legend.

### Test security

- Never trust client-submitted marks or computed scores.
- Do not send correct answers or hidden answer keys before their authorized release.
- Validate attempt ownership on every attempt-related request.
- Validate question membership in the test.
- Validate answer formats on the backend.
- Prevent edits to finalized attempts.
- Avoid leaking unpublished questions through APIs.
- Use server-side authorization and database constraints where appropriate.

Do not promise impossible browser lockdown. Clearly distinguish a practice test from any future proctored assessment.

## 6. Scoring and Result Evaluation

Create a reusable scoring service that is independent of the frontend.

Each question should have configurable:

- Question type.
- Maximum marks.
- Correct answer or accepted answers.
- Positive marks.
- Negative marks.
- Partial-credit policy, if supported.
- Numerical tolerance, where applicable.
- Evaluation status.
- Explanation-release policy.

Use decimal-safe arithmetic for scores where appropriate.

Implement deterministic scoring rules.

Examples:

- Correct MCQ: award configured positive marks.
- Incorrect MCQ: deduct configured negative marks.
- Unanswered question: award zero unless the configured exam rules specify otherwise.
- MSQ: evaluate using the configured exam policy.
- NAT: compare the submitted number against the accepted answer and configured tolerance.

Support different scoring policies per examination and test.

For official exam simulations, configure the rules using verified official documentation for the relevant examination and year. Do not assume that all GATE papers or IIT JAM papers have identical marking structures.

The result service must calculate:

- Total score.
- Maximum possible marks.
- Correct responses.
- Incorrect responses.
- Unanswered responses.
- Section-wise scores.
- Subject-wise scores.
- Topic-wise accuracy.
- Time spent per question where reliable data is available.
- Percentage score.
- Completion statistics.

Do not invent percentile, rank, or national comparison data when real cohort data is unavailable. Label any estimates clearly.

Persist finalized results and ensure reprocessing cannot create inconsistent or duplicate result records.

## 7. Result Analysis Interface

After a test is submitted and results are released, show a professional result page.

Include:

- Score and maximum marks.
- Correct, incorrect, and unanswered counts.
- Time taken.
- Accuracy.
- Section-wise breakdown.
- Topic-wise breakdown.
- Question review.
- Correct answer.
- Student's answer.
- Explanation.
- Marks awarded or deducted.
- Unanswered question status.

Support both immediate results and delayed result release.

The admin must be able to configure whether a student sees:

- Only the score.
- Score and question-level analysis.
- Score and answer explanations.
- Full analysis after a specified release time.

Create charts only when there is real data to display. Avoid fake dashboard statistics and fabricated national rankings.

## 8. Student Dashboard

Build a useful student dashboard with:

- Welcome section.
- Enrolled or followed examinations.
- GATE DA featured as the initial examination.
- Available mock tests.
- Continue-test action for eligible attempts.
- Recent attempts.
- Performance trends.
- Subject-wise strengths and weaknesses.
- Study resources.
- Recommended next tests based on actual available content and performance.

Provide meaningful empty states for new students.

Do not fill the interface with fake scores or placeholder percentages presented as actual student data.

Make the dashboard usable on desktop, tablet, and mobile.

## 9. Study Material and Content Management

Support a content hierarchy:

Exam → Syllabus version → Subject → Topic → Chapter → Resource

Resources should support:

- PDF notes.
- Downloadable files.
- Image resources.
- Resource descriptions.
- Topic associations.
- Publication status.
- Access permissions.
- Upload metadata.

Store files in object storage, not as large binary blobs in PostgreSQL.

Use signed URLs or an authorized download endpoint for protected resources.

Validate file types, file sizes, and access permissions. Never trust the filename or MIME type alone.

Implement resource listing, upload, preview where supported, editing, archiving, and publication workflows.

Do not scrape copyrighted material or include unauthorized commercial study content. Allow the platform owner to upload content they have the right to distribute.

## 10. Question Bank and Test Series Management

Create reusable question banks organized by exam, syllabus version, subject, topic, and difficulty.

Support:

- Draft questions.
- Review status.
- Approved questions.
- Published tests.
- Archived content.
- Question preview.
- Question duplication with appropriate safeguards.
- Bulk question import.
- Import validation reports.
- Missing-answer detection.
- Invalid-marking-rule detection.
- Duplicate detection where feasible.
- Test preview before publication.

Use a documented CSV or JSON import schema. Handle malformed rows gracefully and provide useful error messages.

For test construction, allow an admin or authorized content manager to select questions from the bank and configure ordering, sections, duration, total marks, and scoring rules.

Support fixed question sets in the first version. Design the schema so randomized or rule-based question selection can be added later.

If questions are randomized, persist the actual question order for each attempt so that review and evaluation remain consistent.

## 11. Admin Dashboard

Create a dedicated admin layout with a sidebar and clear management sections.

Recommended sections:

- Overview.
- Examinations.
- Syllabus.
- Subjects and topics.
- Question bank.
- Test series.
- Tests.
- Study materials.
- Users and roles.
- Attempts and results.
- Content review.
- Audit logs.
- Settings.

The admin overview should display real database-backed metrics, such as total users, active examinations, published tests, attempts, and recent activity.

Every metric must be computed from real records. Do not invent business metrics.

Create practical tables with search, filters, pagination, sorting, and clear status labels.

Include loading states, empty states, validation errors, success messages, and confirmation dialogs for destructive operations.

Make create, edit, preview, publish, archive, and delete workflows functional where permitted.

Prefer soft deletion or archival for educational content referenced by existing attempts. Do not delete historical attempt data or corrupt result records when content is archived.

## 12. Authentication and Security

Implement secure authentication and session management.

Requirements:

- Secure registration and login.
- Password hashing using a modern password-hashing algorithm.
- Secure session handling.
- Logout and session invalidation.
- Protected routes.
- Backend permission checks.
- Role assignment restricted to authorized admins.
- Input validation.
- Rate limiting for sensitive endpoints.
- Secure cookie settings when cookie-based sessions are used.
- CSRF protection where applicable.
- CORS configured for explicitly allowed origins.
- Safe error responses.
- Protection against common injection and access-control vulnerabilities.
- Audit logs for important administrative actions.
- Secrets loaded through environment variables.
- No secrets committed to source control.

Never hardcode production credentials, signing keys, database passwords, or privileged account credentials.

Create a documented, safe development-only admin bootstrap mechanism. Do not ship a publicly accessible endpoint that allows anyone to become an admin.

Use least-privilege access for application database credentials and external services.

Ensure students cannot read other students' profiles, attempts, answers, or results.

Ensure content managers cannot modify user roles or bypass approval workflows.

Do not log passwords, session tokens, access tokens, or unnecessary sensitive personal data.

## 13. Database Design

Design a normalized PostgreSQL schema with appropriate foreign keys, indexes, uniqueness constraints, and transactions.

Potential entities include:

- users
- roles
- permissions
- user_roles
- exams
- syllabus_versions
- subjects
- topics
- resources
- question_banks
- questions
- question_options
- question_answers or protected answer data
- test_series
- tests
- test_sections
- test_questions
- attempts
- attempt_answers
- results
- audit_logs

These are conceptual entities. Refine them based on actual relationships and avoid unnecessary duplication.

Requirements:

1. Use UUIDs or another consistent primary-key strategy.
2. Store timestamps consistently in UTC.
3. Preserve historical attempt and result integrity.
4. Keep unpublished answer keys protected.
5. Use database migrations.
6. Add indexes for common access patterns.
7. Use transactions for attempt finalization and result creation.
8. Enforce uniqueness for important relationships.
9. Design exam and syllabus versioning explicitly.
10. Define deletion and archival policies.

Do not place the entire application in a single JSON field or a single oversized database table.

JSONB may be appropriate for selected extensible configuration fields, but core relationships and evaluation data must remain structured and validated.

## 14. Backend Architecture and API Design

Use FastAPI with clearly separated modules.

Suggested modules:

- auth
- users
- exams
- syllabus
- resources
- questions
- test_series
- tests
- attempts
- evaluation
- results
- analytics
- administration
- audit

Use Pydantic schemas, SQLAlchemy models, Alembic migrations, service-layer business logic, and centralized error handling.

Keep routes thin. Put business logic in services rather than mixing it with request handling.

Potential API groups:

Authentication:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- GET /api/v1/auth/me

Exams:
- GET /api/v1/exams
- GET /api/v1/exams/{exam_slug}
- POST /api/v1/admin/exams
- PATCH /api/v1/admin/exams/{exam_id}

Content:
- GET /api/v1/exams/{exam_id}/syllabus
- GET /api/v1/exams/{exam_id}/resources
- POST /api/v1/admin/questions
- POST /api/v1/admin/questions/import

Tests:
- GET /api/v1/exams/{exam_id}/tests
- GET /api/v1/tests/{test_id}
- POST /api/v1/tests/{test_id}/attempts
- GET /api/v1/attempts/{attempt_id}
- PUT /api/v1/attempts/{attempt_id}/answers/{question_id}
- POST /api/v1/attempts/{attempt_id}/submit
- GET /api/v1/attempts/{attempt_id}/result

Administration:
- CRUD endpoints for subjects, topics, resources, question banks, test series, tests, users, and content review.

Treat these paths as starting conventions, not a rigid requirement to create every endpoint exactly as written.

Validate every endpoint against the authenticated user's permissions and the requested resource's ownership or access policy.

Use appropriate HTTP methods, status codes, pagination, validation, and consistent error responses.

Do not expose the correct answer through a general question-detail endpoint used during an active attempt.

## 15. Frontend Architecture and Design System

Use Next.js App Router and TypeScript.

Use Tailwind CSS and shadcn/ui where appropriate, with reusable components and a consistent design system.

Suggested application areas:

Public:
- /
- /exams
- /exams/[examSlug]
- /pricing (only if a real pricing model is implemented)
- /login
- /register

Student:
- /dashboard
- /learn
- /tests
- /tests/[testId]
- /attempts/[attemptId]
- /results/[attemptId]
- /profile

Admin:
- /admin
- /admin/exams
- /admin/syllabus
- /admin/questions
- /admin/test-series
- /admin/tests
- /admin/resources
- /admin/users
- /admin/results
- /admin/audit-logs
- /admin/settings

Content manager:
- /content
- /content/questions
- /content/resources
- /content/tests
- /content/review-status

Choose a clear, consistent route structure. Adjust it if a better architecture is justified.

### Visual direction

The website must feel like a carefully designed technology product for serious exam preparation.

Design principles:

- Clean, light-first interface.
- Deep navy or charcoal for text and structure.
- One restrained blue accent colour.
- Strong typography hierarchy.
- Consistent spacing and alignment.
- Subtle borders and shadows.
- Moderate corner radii.
- High information density on examination screens.
- More generous spacing on marketing pages.
- Accessible colour contrast.
- Keyboard navigation.
- Responsive layouts.
- Consistent icons.
- Realistic educational content.
- Clear button hierarchy.
- Minimal decorative animation.

Avoid:

- Excessive gradients.
- Neon backgrounds everywhere.
- Oversized hero typography.
- Generic AI-generated illustrations.
- Unnecessary glassmorphism.
- Too many floating cards.
- Random decorative icons.
- Fake charts.
- Fake testimonials.
- Fake student counts.
- Excessive animation.
- Unnecessary modal dialogs.
- Placeholder buttons that do nothing.

Do not reproduce the same generic dashboard layout on every page. Each page should be designed around its actual task.

The examination interface should prioritize clarity, speed, keyboard accessibility, and accurate answer status over decorative appearance.

## 16. Code Quality and Project Structure

Use a maintainable monorepo unless the existing repository has a strong reason to use a different structure.

A suggested structure:

apps/
  web/
  api/

packages/
  shared-types/

infra/
  docker/

docs/

The exact layout may differ if necessary.

Requirements:

- TypeScript strict mode.
- Reusable React components.
- Shared API schemas where practical.
- Clear naming conventions.
- Small, cohesive modules.
- Centralized configuration.
- Environment-variable validation.
- Database migrations.
- Automated formatting and linting.
- Meaningful comments for non-obvious business rules.
- No unnecessary abstractions.
- No duplicated business logic.
- No hardcoded exam-specific branching.
- No committed secrets.
- No dead buttons or fake interactions.
- No unexplained `any` types.
- No broad exception handling that hides errors.

Add `.env.example` files containing placeholders only.

Include `.gitignore`, README documentation, database setup instructions, and development commands.

## 17. Testing Requirements

Testing is mandatory.

### Backend tests

Use Pytest to test:

- Registration and authentication.
- Role-based permissions.
- Exam creation.
- Exam publication and archival.
- Question creation and validation.
- Question import failures.
- Test configuration.
- Attempt creation.
- Answer persistence.
- Answer validation.
- MCQ scoring.
- MSQ scoring.
- NAT tolerance.
- Negative marking.
- Unanswered questions.
- Attempt expiry.
- Duplicate submission.
- Unauthorized access to another student's attempt.
- Unauthorized answer-key access.
- Result release policies.
- Database transaction failures where practical.

### Frontend and end-to-end tests

Use Playwright for important user journeys.

At minimum, verify:

1. A student can register and log in.
2. An admin can create an examination.
3. A content manager can create a draft question.
4. The admin can approve and publish the question.
5. The admin can create and publish a test.
6. The student can start the test.
7. The student can navigate questions.
8. Answers persist across navigation and reload.
9. The student can submit the test.
10. The score is calculated correctly.
11. Results are displayed according to the release policy.
12. A student cannot access administrative routes or another student's private data.

Test timer expiry and duplicate submissions without relying on long real-time waits.

Use a test database or isolated test fixtures. Never run destructive tests against production data.

## 18. Local Development and Deployment

Provide a reproducible local development environment.

Use Docker Compose for services where practical, including PostgreSQL and optional Redis.

The application should support:

- Database migrations.
- Development seed data.
- Backend startup.
- Frontend startup.
- Automated tests.
- Production builds.

Provide commands for installing dependencies, starting services, running migrations, seeding development data, running tests, and building the application.

Use synthetic development seed data with clearly labelled sample accounts and demo content. Never use real student data.

Any sample credentials must be development-only and must not be accepted in production.

Add CI checks for linting, type checking, tests, and production builds.

Document deployment configuration, database backups, migration strategy, environment variables, logging, and rollback considerations.

Do not deploy to paid cloud resources or change external production systems without explicit authorization.

## 19. MVP Scope

Build the first version in the following order.

### Phase 1: Foundation
- Inspect the repository and existing implementation.
- Establish the project structure.
- Set up Next.js, TypeScript, FastAPI, PostgreSQL, SQLAlchemy, and Alembic.
- Create environment configuration.
- Implement authentication and role-based authorization.
- Add the initial database schema and migrations.
- Create a professional base layout and design system.

### Phase 2: Exam and Content Administration
- Build exam CRUD.
- Build subject and topic management.
- Build question-bank management.
- Build resource upload and organization.
- Build test-series and test management.
- Add content review and publication workflows.
- Create the initial GATE DA configuration.

### Phase 3: Examination Engine
- Build the test instructions page.
- Implement MCQ, MSQ, and NAT rendering.
- Implement question navigation and palette.
- Implement answer persistence.
- Implement server-authoritative timing.
- Implement manual and automatic submission.
- Implement backend scoring.
- Implement result persistence.

### Phase 4: Student Experience
- Build the exam catalogue.
- Build the student dashboard.
- Build the study-material interface.
- Build the test catalogue.
- Build the examination interface.
- Build result analysis and attempt history.
- Ensure mobile responsiveness and accessibility.

### Phase 5: Quality and Launch Readiness
- Add backend tests.
- Add browser-based end-to-end tests.
- Test authorization boundaries.
- Test expiry and submission edge cases.
- Review performance and database indexes.
- Add error tracking and structured logs.
- Write setup and deployment documentation.
- Verify a complete end-to-end workflow.

Complete each phase with working code and verification before moving to the next.

## 20. Definition of Done

The MVP is not complete merely because the pages look good.

It is complete when:

- The frontend and backend run locally.
- Database migrations work on a clean database.
- All three roles have correctly enforced permissions.
- An admin can create a new examination without code changes.
- An admin can create questions and publish a test.
- A student can register and attempt the test.
- Answers are persisted reliably.
- The server enforces expiry.
- Manual and automatic submissions work.
- The scoring engine produces correct results.
- The student can review released results.
- Historical attempts remain intact when content is archived.
- Important workflows have automated tests.
- The production frontend builds successfully.
- The API tests pass.
- Documentation explains how to run the application.

Report any remaining limitations honestly.

## 21. Working Instructions for Codex

Start by inspecting the current repository, including its package files, source code, configuration, and existing tests.

If the repository already contains an application, preserve useful working code and improve it rather than replacing everything unnecessarily.

Before implementation, produce a concise plan that identifies the existing state, proposed architecture, milestones, and major risks.

Then start implementing Phase 1. Do not stop after the plan.

Work incrementally. Run the relevant tests, type checks, linting, and builds as the implementation progresses.

When a failure occurs, investigate and fix its root cause instead of hiding it.

Do not claim that a feature works unless you have implemented and verified it.

If something is ambiguous, make a reasonable, documented engineering decision and continue. Ask for clarification only when a missing decision genuinely blocks implementation or could cause an unsafe or irreversible action.

Do not introduce unnecessary microservices, Kubernetes, Kafka, AI features, or paid infrastructure into the initial MVP.

Do not generate huge amounts of superficial code just to appear complete.

Prioritize correctness, maintainability, security, usability, and a polished examination experience.

At the end of each phase, report:
- Features implemented.
- Important files created or changed.
- Database migrations added.
- Tests and commands executed.
- Results of those tests.
- Remaining issues.
- The next concrete implementation step.

Begin now by inspecting the repository and implementing Phase 1.