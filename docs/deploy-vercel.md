# Vercel Services deployment

The repository root `vercel.json` configures one Vercel project with two independently built services on a shared domain. In Vercel project settings, select the **Services** framework and connect the repository root (do not set `apps/web` or `apps/api` as the project root). Vercel Services are currently in beta; confirm availability for the account before linking the project.

| Service | Root | Framework | Public route |
| --- | --- | --- | --- |
| `api` | `apps/api` | FastAPI | `/api/*` |
| `web` | `apps/web` | Next.js | `/*` after `/api/*` |

The API entrypoint `index:app` exports the existing FastAPI app. The API keeps its `/api/v1` route prefix; the `/api/(.*)` rewrite forwards that path to the API service. The frontend uses same-origin `/api/v1` requests in production, so the browser reaches the API through the public rewrite. Development continues to use `http://localhost:8000/api/v1` unless `NEXT_PUBLIC_API_URL` is set.

No service binding is configured: current API calls originate in the browser and use the public same-origin rewrite. Neither service makes server-side requests to the other. If server-side service-to-service calls are added later, declare a Vercel binding on the calling service and read its injected URL at function runtime.

## Environment variables

Add shared project variables in Vercel, with separate Preview and Production values where appropriate. Keep secrets out of `NEXT_PUBLIC_*` variables.

```text
APP_ENV=production
DEBUG=false
DATABASE_URL=postgresql+asyncpg://<pooled-neon-connection>
DATABASE_URL_SYNC=postgresql+psycopg://<migration-safe-neon-connection>
JWT_SECRET_KEY=<random-secret-at-least-32-characters>
REDIS_URL=rediss://<shared-redis-endpoint>
CORS_ORIGINS=["https://<your-vercel-domain>"]
RATE_LIMIT_ENABLED=true
RAZORPAY_MODE=test
RAZORPAY_KEY_ID=<rzp_test_key_id>
RAZORPAY_KEY_SECRET=<razorpay_test_key_secret>
RAZORPAY_WEBHOOK_SECRET=<webhook_secret>
```

Use managed PostgreSQL and a pooled runtime URL for serverless database access. Run Alembic migrations separately from a trusted environment using `DATABASE_URL_SYNC`; production app startup does not create tables. The development dependencies include the PostgreSQL `psycopg` driver for the migration environment. Production also requires shared TLS Redis for token revocation and rate limits. Do not run the development seed script against production.

```bash
cd apps/api
DATABASE_URL_SYNC='postgresql+psycopg://<migration-safe-postgres-url>' alembic upgrade head
DATABASE_URL_SYNC='postgresql+psycopg://<migration-safe-postgres-url>' alembic check
```

After migrating a new production database, provision the first administrator through the interactive command from `apps/api`. It requires `APP_ENV=production`, PostgreSQL, validates the password policy, and prompts for the password without adding it to shell history. It refuses an existing email:

```bash
cd apps/api
python -m app.admin_cli create-admin --email owner@example.com --name "Platform Owner"
```

Do not run the development seed script against production.

Razorpay subscription plans, checkout creation, signed webhook verification, idempotent event processing, payment records, cancellation, and test access entitlements are implemented. Configure test credentials before checkout; use `RAZORPAY_MODE=live` only after test flows and webhook verification pass. Set the Razorpay webhook URL to `https://<your-vercel-domain>/api/v1/billing/webhooks/razorpay` and subscribe to `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.paused`, `subscription.resumed`, `subscription.cancelled`, `subscription.completed`, `payment.captured`, `payment.failed`, and `payment.refunded`.

Paid note access is not ready for sale: files still use local upload storage in development, production uploads return unavailable, and private Vercel Blob storage plus an authenticated in-app reader are not integrated. The public resource response excludes file URLs, and the student UI no longer links to the admin-only download endpoint. Do not mark resources paid until private storage and page delivery are in place. Paid-test access checks are enforced by the attempt-start API.

## Local verification and release

Use `vercel dev` from the repository root after linking the project to verify both services and path routing together. The browser API base defaults to `/api/v1` in production, so no API hostname needs to be configured in `NEXT_PUBLIC_API_URL` for this single-domain setup.

Before release, configure Vercel's Services framework, add Preview and Production environment values, run migrations, configure Razorpay test credentials and webhook, and verify `/health`, exam discovery, login, and the frontend's API requests on a Preview deployment. Private Blob storage and the paid-note reader remain prerequisites before offering paid notes. There is no GitHub Actions pipeline; build and test scripts remain available for local checks.
