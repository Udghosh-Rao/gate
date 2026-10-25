# Production setup and release procedure

## Current target

The repository contains a Next.js frontend and FastAPI API. A production release requires a managed Next.js host, a managed API host, PostgreSQL, and shared Redis. A domain and its HTTPS configuration must be provided by the owner. No hosting account, credentials, object-storage service, or production database is configured in this repository.

## Required environment

Backend:

- `APP_ENV=production`, `DEBUG=false`
- `DATABASE_URL` as a PostgreSQL SQLAlchemy async URL and `DATABASE_URL_SYNC` as its synchronous PostgreSQL URL for Alembic
- `JWT_SECRET_KEY` as a unique random secret with at least 32 characters
- `REDIS_URL` as a shared Redis connection; the API startup pings Redis and production rate limiting and revocation use it
- `CORS_ORIGINS` as a JSON list containing only the deployed HTTPS frontend origin(s)
- `MAX_UPLOAD_SIZE_MB` and `UPLOAD_DIR` for local development; production PDF uploads remain disabled until durable object storage and signed/authorized download support are configured
- `NEXT_PUBLIC_API_URL` set to the API origin ending in `/api/v1`

Never commit actual values. Use each hosting provider's secret manager.

## Database release

1. Back up the database and verify the backup can be restored in a non-production environment.
2. Review the Alembic revision and confirm the target `DATABASE_URL_SYNC` points to the intended database.
3. Run `cd apps/api && alembic upgrade head` as a one-off release step, not in each worker.
4. Deploy the API with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Deploy the frontend with `npm ci && npm run build` and run it with `npm run start`.
6. Check `/health`, then verify authentication, published content, attempt/resume/submit, result policy, and resource access against staging before directing real students to the service.

The API no longer creates tables at production startup. Development-only seeding is `python -m app.seed`; it rejects production configuration. Seeded content is demonstration data and must not be represented as a full-length examination.

## Operations and rollback

Keep database backups under the provider's retention policy. Record the deployed frontend/API revisions and migration revision for each release. On an application-only failure, roll back to the previous application revision after confirming schema compatibility. A database downgrade is not a default rollback plan: take a backup and review the exact migration before any downgrade. Review provider logs for request IDs and errors; never place credentials or student answers in logs.

## Launch blockers

- Configure and test a managed production PostgreSQL database and shared Redis service.
- Configure durable object storage and authorized download links before publishing PDF resources in production.
- Supply the genuine public support contact, privacy notice, terms, and domain details.
- Validate exam syllabus and question content with the content owner. The software does not verify official exam-board material.
- Run the production/staging browser journey and validate backups, restore, TLS, and provider-specific logging before launch.
