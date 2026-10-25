# Vercel deployment setup

The repository is prepared for two Vercel projects connected to the same GitHub repository. Deployment has not been run from this workspace.

## Frontend project

Create a Vercel project for this repository with:

- Root Directory: `apps/web`
- Framework preset: Next.js (auto-detected)
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: leave the Next.js default
- Environment variable: `NEXT_PUBLIC_API_URL=https://<your-api-domain>/api/v1`

Set the API URL for Preview and Production separately. `NEXT_PUBLIC_API_URL` is public browser configuration; never put credentials in it. The frontend uses localhost only as a development fallback. A production build without this value fails API calls with an explicit configuration error instead of calling localhost.

## API project

Create a second Vercel project from the same repository with:

- Root Directory: `apps/api`
- Framework preset: FastAPI (auto-detected)
- Python version: 3.12 (`.python-version`)
- Entrypoint: `index.py`, which exports the existing `app.main:app`
- Install dependencies from the existing `requirements.txt`
- Do not configure a build step that creates tables; production schema changes use Alembic

FastAPI-on-Vercel runs as one Python Function. The app is kept as the existing FastAPI service, not reimplemented in Next.js. The current API can serve its ordinary HTTP routes in this model, but local-disk uploads are disabled in production and the paid-note viewer/billing workflows are not implemented yet. Do not sell protected resources until those features and entitlements exist.

## Required API environment

Configure these values in the API project's Vercel settings for Preview and Production. Use a managed PostgreSQL connection from Neon via the Vercel Marketplace; select its pooled connection string for the serverless runtime.

```text
APP_ENV=production
DEBUG=false
DATABASE_URL=postgresql+asyncpg://<pooled-neon-connection>
DATABASE_URL_SYNC=postgresql://<neon-migration-connection>
JWT_SECRET_KEY=<random-secret-at-least-32-characters>
REDIS_URL=<shared-redis-tls-url>
CORS_ORIGINS=["https://<frontend-production-domain>"]
RATE_LIMIT_ENABLED=true
```

For the `DATABASE_URL` value, use the Neon pooled PostgreSQL connection and SQLAlchemy's `postgresql+asyncpg` driver prefix. For `DATABASE_URL_SYNC`, use a direct or migration-safe PostgreSQL URL for Alembic. Do not use SQLite for either production value. Keep API and frontend Preview origins separate from Production origins.

The API also requires a shared Redis service for production token revocation and rate limiting. The API will fail startup if the required Redis service is unavailable. Do not configure local Redis or local origins in production.

## Database migration and first administrator

Before sending traffic to a release, run migrations from a trusted local environment against the intended Neon database:

```bash
cd apps/api
DATABASE_URL_SYNC='<migration-safe-postgres-url>' alembic upgrade head
DATABASE_URL_SYNC='<migration-safe-postgres-url>' alembic check
```

Never run these commands with an ambiguous database URL. This repository does not yet include a production-safe one-time administrator provisioning command; provision the first administrator through a reviewed database operation before launch. Do not run the development seed script against production.

## Storage, billing, and launch blockers

The current API rejects production PDF uploads because durable private storage and page rendering are not implemented. The student PDF route is restricted to content staff; it is not a student reader. There is no paid entitlement model or Razorpay checkout/webhook implementation. No Blob token or Razorpay secret belongs in the frontend project.

Before selling notes or tests, implement and test private page storage, an authenticated in-app reader, subscription/entitlement records, Razorpay signature-verified webhook processing, cancellation and expiry logic, and access checks on every paid API. Then add the corresponding server-only storage and Razorpay credentials to the API project.

## Release process

1. Push the reviewed source branch to GitHub; Vercel builds Preview deployments automatically after project linking.
2. Configure Preview service credentials and verify the API `/health` endpoint, published exam discovery, and login flows.
3. Run Alembic migrations against the intended database using the release procedure above.
4. Configure Production environment variables, exact production CORS origins, and the frontend API URL.
5. Promote through Vercel's Git integration and verify frontend-to-API connectivity and logs.
6. Roll back using Vercel's deployment rollback controls if health checks or smoke tests fail. Restore the database from its provider backup only through a reviewed recovery procedure.

There is no GitHub Actions pipeline in this repository; tests and builds remain available through the documented package scripts and local commands.
