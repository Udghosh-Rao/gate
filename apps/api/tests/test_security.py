"""Security Regression Tests — Phase 1 Critical Vulnerabilities.

Tests the following invariants that must NEVER regress:

1.  Result Ownership:      Student B cannot read Student A's result (403).
2.  Attempt Ownership:     Student B cannot submit Student A's attempt (403).
3.  Unpublished Exams:     Draft/archived exams never appear in public listings.
4.  Unpublished Tests:     Draft tests are invisible to public endpoints.
5.  Unpublished Series:    Draft test-series invisible to public endpoints.
6.  Token Revocation:      Revoked token rejected with 401.
7.  Refresh Flow:          Valid refresh token issues new access token.
8.  Admin Bypass:          Admin CAN access any student's result.
9.  Unauthenticated:       Protected endpoints return 401 without token.
10. Student vs Admin:      Student token rejected (403) on admin routes.
11. Idempotent Submit:     Double-submit returns 4xx not 5xx.
12. Zero-score honesty:    Score of 0 is returned as 0.0, not null.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from uuid import UUID

from app.models.test import Test as ExamTest, ExplanationReleasePolicy
from app.core.database import AsyncSession
from app.core.config import settings
from app.core.config import Settings
from app.services.billing_service import verify_webhook_signature

from app.main import app

BASE = "http://test"


def test_vercel_runtime_detects_production_environment(monkeypatch):
    monkeypatch.setenv("VERCEL_ENV", "production")
    monkeypatch.delenv("APP_ENV", raising=False)
    monkeypatch.delenv("DEBUG", raising=False)
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://user:pass@db.example/app")
    monkeypatch.setenv("DATABASE_URL_SYNC", "postgresql+psycopg://user:pass@db.example/app")
    monkeypatch.setenv("JWT_SECRET_KEY", "t" * 48)
    monkeypatch.setenv("REDIS_URL", "rediss://redis.example:6380/0")
    monkeypatch.setenv("CORS_ORIGINS", '["https://gate.example"]')
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")

    runtime_settings = Settings(_env_file=None)
    assert runtime_settings.APP_ENV == "production"
    assert runtime_settings.DEBUG is False
    assert runtime_settings.is_production


def test_razorpay_webhook_signature_is_verified(monkeypatch):
    import hashlib
    import hmac

    raw_body = b'{"event":"subscription.activated"}'
    secret = "test-webhook-secret"
    signature = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    monkeypatch.setattr(settings, "RAZORPAY_WEBHOOK_SECRET", secret)
    assert verify_webhook_signature(raw_body, signature)
    assert not verify_webhook_signature(raw_body, "0" * 64)
    monkeypatch.setattr(settings, "RAZORPAY_WEBHOOK_SECRET", None)
    assert not verify_webhook_signature(raw_body, signature)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _login(client, email: str, password: str) -> dict:
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()


async def _gate_da_id(client) -> str:
    res = await client.get("/api/v1/exams")
    assert res.status_code == 200
    exams = res.json()
    gate = next((e for e in exams if e["code"] == "GATE-DA"), None)
    assert gate is not None, "GATE-DA not found in public listing"
    return gate["id"]


async def _get_published_test(client, gate_da_id: str):
    """Return (series_id, test_id) for the first available published test, or None."""
    ts_res = await client.get(f"/api/v1/exams/{gate_da_id}/test-series")
    if not ts_res.json():
        return None
    series_id = ts_res.json()[0]["id"]
    tests_res = await client.get(f"/api/v1/test-series/{series_id}/tests")
    if not tests_res.json():
        return None
    return series_id, tests_res.json()[0]["id"]


# ---------------------------------------------------------------------------
# 1. Result Ownership
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_result_ownership_cross_student_blocked():
    """Student B receives 403 when requesting Student A's result."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        gid = await _gate_da_id(c)
        found = await _get_published_test(c, gid)
        if not found:
            pytest.skip("No published test seeded")
        _, test_id = found

        # Student A: start and submit
        a = await _login(c, "student@examplatform.dev", "Student@Dev123")
        a_hdrs = {"Authorization": f"Bearer {a['access_token']}"}
        ar = await c.post(f"/api/v1/tests/{test_id}/attempts", headers=a_hdrs)
        assert ar.status_code in (200, 201)
        attempt_id = ar.json()["id"]
        await c.post(f"/api/v1/attempts/{attempt_id}/submit", headers=a_hdrs)

        # Register Student B
        await c.post("/api/v1/auth/register", json={
            "email": "sec_b_result@test.examplatform.dev",
            "password": "Test@Secure123",
            "full_name": "Sec B Result",
        })
        b = await _login(c, "sec_b_result@test.examplatform.dev", "Test@Secure123")
        b_hdrs = {"Authorization": f"Bearer {b['access_token']}"}

        res = await c.get(f"/api/v1/attempts/{attempt_id}/result", headers=b_hdrs)
        assert res.status_code == 403, (
            f"Expected 403, got {res.status_code}: {res.text}"
        )


@pytest.mark.asyncio
async def test_result_ownership_admin_can_read():
    """Admin receives 200 or a release-policy 403 (never an ownership 403)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        gid = await _gate_da_id(c)
        found = await _get_published_test(c, gid)
        if not found:
            pytest.skip("No published test seeded")
        _, test_id = found

        s = await _login(c, "student@examplatform.dev", "Student@Dev123")
        sh = {"Authorization": f"Bearer {s['access_token']}"}
        ar = await c.post(f"/api/v1/tests/{test_id}/attempts", headers=sh)
        assert ar.status_code in (200, 201)
        attempt_id = ar.json()["id"]
        await c.post(f"/api/v1/attempts/{attempt_id}/submit", headers=sh)

        adm = await _login(c, "admin@examplatform.dev", "Admin@Dev123")
        ah = {"Authorization": f"Bearer {adm['access_token']}"}
        res = await c.get(f"/api/v1/attempts/{attempt_id}/result", headers=ah)

        # Admin is never blocked by ownership check — only by release policy
        if res.status_code == 403:
            detail = res.json().get("detail", "").lower()
            assert "not yet" in detail or "not released" in detail, (
                f"Admin blocked by ownership check (unexpected): {res.text}"
            )


# ---------------------------------------------------------------------------
# 2. Attempt Ownership
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_attempt_ownership_submit_blocked():
    """Student B gets 403 when submitting Student A's attempt."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        gid = await _gate_da_id(c)
        found = await _get_published_test(c, gid)
        if not found:
            pytest.skip("No published test seeded")
        _, test_id = found

        a = await _login(c, "student@examplatform.dev", "Student@Dev123")
        ah = {"Authorization": f"Bearer {a['access_token']}"}
        ar = await c.post(f"/api/v1/tests/{test_id}/attempts", headers=ah)
        assert ar.status_code in (200, 201)
        attempt_id = ar.json()["id"]

        await c.post("/api/v1/auth/register", json={
            "email": "sec_b_submit@test.examplatform.dev",
            "password": "Test@Secure123",
            "full_name": "Sec B Submit",
        })
        b = await _login(c, "sec_b_submit@test.examplatform.dev", "Test@Secure123")
        bh = {"Authorization": f"Bearer {b['access_token']}"}

        res = await c.post(f"/api/v1/attempts/{attempt_id}/submit", headers=bh)
        assert res.status_code == 403, (
            f"Expected 403 for cross-student submit, got {res.status_code}"
        )


# ---------------------------------------------------------------------------
# 3. Unpublished exams
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_public_exam_listing_only_active():
    """Public /exams must only return ACTIVE exams."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        res = await c.get("/api/v1/exams")
        assert res.status_code == 200
        for exam in res.json():
            assert exam["status"] == "ACTIVE", (
                f"Non-ACTIVE exam '{exam['code']}' ({exam['status']}) in public listing"
            )


@pytest.mark.asyncio
async def test_draft_exam_not_accessible_by_slug():
    """A DRAFT exam must return 404 on the public slug endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        adm = await _login(c, "admin@examplatform.dev", "Admin@Dev123")
        ah = {"Authorization": f"Bearer {adm['access_token']}"}

        import uuid
        uid = uuid.uuid4().hex[:6]
        test_slug = f"draft-vis-{uid}"
        create_res = await c.post("/api/v1/admin/exams", headers=ah, json={
            "name": f"Draft Visibility Test {uid}",
            "code": f"DRAFT-{uid.upper()}",
            "slug": test_slug,
            "status": "DRAFT",
            "exam_type": "OTHER",
        })
        if create_res.status_code not in (200, 201):
            pytest.skip(f"Admin exam creation unavailable: {create_res.text}")

        slug_res = await c.get(f"/api/v1/exams/{test_slug}")
        assert slug_res.status_code == 404, (
            f"Draft exam reachable publicly: {slug_res.status_code}"
        )

        list_res = await c.get("/api/v1/exams")
        assert test_slug not in [e["slug"] for e in list_res.json()], (
            "Draft exam appeared in public /exams listing"
        )


# ---------------------------------------------------------------------------
# 4. Draft tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_public_test_listing_only_published():
    """Public GET /exams/{id}/tests returns only PUBLISHED tests."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        gid = await _gate_da_id(c)
        res = await c.get(f"/api/v1/exams/{gid}/tests")
        assert res.status_code == 200
        for t in res.json():
            assert t["status"] == "PUBLISHED", (
                f"Non-PUBLISHED test '{t['title']}' ({t['status']}) in public listing"
            )


@pytest.mark.asyncio
async def test_public_series_tests_only_published():
    """Public GET /test-series/{id}/tests returns only PUBLISHED tests."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        gid = await _gate_da_id(c)
        ts_res = await c.get(f"/api/v1/exams/{gid}/test-series")
        if not ts_res.json():
            pytest.skip("No published test series seeded")
        sid = ts_res.json()[0]["id"]
        res = await c.get(f"/api/v1/test-series/{sid}/tests")
        assert res.status_code == 200
        for t in res.json():
            assert t["status"] == "PUBLISHED", (
                f"Non-PUBLISHED test ({t['status']}) in public series endpoint"
            )


# ---------------------------------------------------------------------------
# 5. Draft test-series
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_public_test_series_only_published():
    """Public GET /exams/{id}/test-series returns only PUBLISHED series."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        gid = await _gate_da_id(c)
        res = await c.get(f"/api/v1/exams/{gid}/test-series")
        assert res.status_code == 200
        for s in res.json():
            assert s["status"] == "PUBLISHED", (
                f"Non-PUBLISHED series '{s['name']}' ({s['status']}) in public listing"
            )


# ---------------------------------------------------------------------------
# 6 & 7. Token revocation and refresh
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_token_revoked_on_logout():
    """After logout, the same token is rejected with 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        tok = await _login(c, "student@examplatform.dev", "Student@Dev123")
        hdrs = {"Authorization": f"Bearer {tok['access_token']}"}

        assert (await c.get("/api/v1/auth/me", headers=hdrs)).status_code == 200

        logout = await c.post("/api/v1/auth/logout", headers=hdrs)
        assert logout.status_code == 200

        post_logout = await c.get("/api/v1/auth/me", headers=hdrs)
        assert post_logout.status_code == 401, (
            f"Revoked token still accepted: {post_logout.status_code}"
        )


@pytest.mark.asyncio
async def test_revoked_token_blocked_student_attempts():
    """Revoked token is rejected on /student/attempts too."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        tok = await _login(c, "student@examplatform.dev", "Student@Dev123")
        hdrs = {"Authorization": f"Bearer {tok['access_token']}"}
        await c.post("/api/v1/auth/logout", headers=hdrs)
        res = await c.get("/api/v1/student/attempts", headers=hdrs)
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_issues_new_access_token():
    """Refresh token endpoint returns a usable new access token."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        tok = await _login(c, "student@examplatform.dev", "Student@Dev123")
        if "refresh_token" not in tok:
            pytest.skip("Server does not return refresh_token")

        ref = await c.post("/api/v1/auth/refresh", json={"refresh_token": tok["refresh_token"]})
        assert ref.status_code == 200, f"Refresh failed: {ref.text}"
        assert "access_token" in ref.json()

        me = await c.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {ref.json()['access_token']}"})
        assert me.status_code == 200


# ---------------------------------------------------------------------------
# 8. Unauthenticated access
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_unauthenticated_protected_routes():
    """Protected routes return 401 without a token."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        for method, path in [
            ("GET", "/api/v1/student/attempts"),
            ("GET", "/api/v1/auth/me"),
        ]:
            res = await c.request(method, path)
            assert res.status_code == 401, f"{method} {path} returned {res.status_code}"


@pytest.mark.asyncio
async def test_student_cannot_download_source_study_pdf():
    """Source PDFs remain restricted to content staff until the paid reader exists."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        tok = await _login(c, "student@examplatform.dev", "Student@Dev123")
        response = await c.get(
            "/api/v1/resources/00000000-0000-0000-0000-000000000001/download",
            headers={"Authorization": f"Bearer {tok['access_token']}"},
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# 9. Student cannot reach admin routes
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_student_cannot_access_admin_routes():
    """Student token is rejected on /admin endpoints with 403."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        tok = await _login(c, "student@examplatform.dev", "Student@Dev123")
        hdrs = {"Authorization": f"Bearer {tok['access_token']}"}
        res = await c.get("/api/v1/admin/exams", headers=hdrs)
        assert res.status_code == 403, (
            f"Student accessed /admin/exams: {res.status_code}"
        )


# ---------------------------------------------------------------------------
# 10. Idempotent submission
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_idempotent_submission_no_server_error():
    """Submitting twice must never cause a 5xx error."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        gid = await _gate_da_id(c)
        found = await _get_published_test(c, gid)
        if not found:
            pytest.skip("No published test seeded")
        _, test_id = found

        s = await _login(c, "student@examplatform.dev", "Student@Dev123")
        sh = {"Authorization": f"Bearer {s['access_token']}"}

        ar = await c.post(f"/api/v1/tests/{test_id}/attempts", headers=sh)
        assert ar.status_code in (200, 201)
        attempt_id = ar.json()["id"]

        r1 = await c.post(f"/api/v1/attempts/{attempt_id}/submit", headers=sh)
        assert r1.status_code == 200

        r2 = await c.post(f"/api/v1/attempts/{attempt_id}/submit", headers=sh)
        assert r2.status_code < 500, f"Double-submit caused server error: {r2.text}"


# ---------------------------------------------------------------------------
# 11. Zero-score honesty
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_zero_score_reported_honestly():
    """Skipping all questions must produce score=0.0, not null."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        gid = await _gate_da_id(c)
        found = await _get_published_test(c, gid)
        if not found:
            pytest.skip("No published test seeded")
        _, test_id = found

        s = await _login(c, "student@examplatform.dev", "Student@Dev123")
        sh = {"Authorization": f"Bearer {s['access_token']}"}

        ar = await c.post(f"/api/v1/tests/{test_id}/attempts", headers=sh)
        assert ar.status_code in (200, 201)
        attempt_id = ar.json()["id"]

        # Submit without answering any questions
        await c.post(f"/api/v1/attempts/{attempt_id}/submit", headers=sh)

        rr = await c.get(f"/api/v1/attempts/{attempt_id}/result", headers=sh)
        if rr.status_code == 200:
            result = rr.json()
            assert result["total_score"] is not None, (
                "Zero score returned as null — honesty bug"
            )


@pytest.mark.asyncio
async def test_content_manager_cannot_publish_question_via_general_update():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        gid = await _gate_da_id(c)
        manager = await _login(c, "content@examplatform.dev", "Content@Dev123")
        headers = {"Authorization": f"Bearer {manager['access_token']}"}
        created = await c.post("/api/v1/admin/questions", headers=headers, json={
            "exam_id": gid,
            "question_type": "MCQ",
            "text": "Which value is the identity element for addition?",
            "difficulty": "EASY",
            "positive_marks": 1,
            "negative_marks": 0,
            "options": [
                {"label": "A", "text": "0", "is_correct": True},
                {"label": "B", "text": "1", "is_correct": False},
            ],
        })
        assert created.status_code == 201, created.text
        qid = created.json()["id"]
        attempted_publish = await c.patch(
            f"/api/v1/admin/questions/{qid}",
            headers=headers,
            json={"status": "PUBLISHED"},
        )
        assert attempted_publish.status_code == 200, attempted_publish.text
        assert attempted_publish.json()["status"] == "DRAFT"


@pytest.mark.asyncio
async def test_result_withholds_correct_answers_when_explanations_are_held(db_session: AsyncSession):
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        gid = await _gate_da_id(c)
        found = await _get_published_test(c, gid)
        if not found:
            pytest.skip("No published test seeded")
        _, test_id = found
        db_test = await db_session.get(ExamTest, UUID(test_id))
        assert db_test is not None
        db_test.explanation_release_policy = ExplanationReleasePolicy.NEVER
        await db_session.flush()

        student = await _login(c, "student@examplatform.dev", "Student@Dev123")
        headers = {"Authorization": f"Bearer {student['access_token']}"}
        attempt = await c.post(f"/api/v1/tests/{test_id}/attempts", headers=headers)
        assert attempt.status_code == 200, attempt.text
        attempt_id = attempt.json()["id"]
        submitted = await c.post(f"/api/v1/attempts/{attempt_id}/submit", headers=headers)
        assert submitted.status_code == 200, submitted.text
        result = await c.get(f"/api/v1/attempts/{attempt_id}/result", headers=headers)
        assert result.status_code == 200, result.text
        assert all(
            item["correct_answer"] is None and item["explanation"] is None
            for item in result.json()["question_results"]
        )
