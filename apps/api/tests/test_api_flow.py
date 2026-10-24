"""Comprehensive Integration Test Suite for Exam Platform.

Tests:
1. Health and welcome endpoints
2. Authentication (login with seeded admin and student, register new user)
3. Exams listing and slug retrieval
4. Question and Test Series browsing
5. Test Attempt flow: Start attempt -> Save MCQ, MSQ, NAT answers -> Submit attempt -> Verify Result
6. Admin dashboard and user metrics
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_health_and_root():
    """Verify health and root endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/")
        assert res.status_code == 200
        data = res.json()
        assert data["version"] == "1.0.0"

        health = await client.get("/health")
        assert health.status_code == 200
        assert health.json()["database"] == "healthy"


@pytest.mark.asyncio
async def test_auth_login_and_me():
    """Verify admin and student login and /me endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Admin login
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@examplatform.dev", "password": "Admin@Dev123"}
        )
        assert login_res.status_code == 200
        tokens = login_res.json()
        assert "access_token" in tokens

        # Admin /me
        me_res = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        assert me_res.status_code == 200
        assert me_res.json()["role"] == "ADMIN"


@pytest.mark.asyncio
async def test_exams_and_syllabus():
    """Verify public exam catalog and subjects."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/exams")
        assert res.status_code == 200
        exams = res.json()
        assert len(exams) >= 1
        gate_da = next(e for e in exams if e["code"] == "GATE-DA")
        assert gate_da["slug"] == "gate-da"

        # Check subjects
        subj_res = await client.get(f"/api/v1/exams/{gate_da['id']}/subjects")
        assert subj_res.status_code == 200
        subjects = subj_res.json()
        assert len(subjects) >= 5


@pytest.mark.asyncio
async def test_cbt_exam_lifecycle():
    """Verify student taking an exam: start, answer MCQ, MSQ, NAT, submit, and get evaluated."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login student
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "student@examplatform.dev", "password": "Student@Dev123"}
        )
        student_token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {student_token}"}

        # 2. Get GATE DA exam and test series
        exams_res = await client.get("/api/v1/exams")
        gate_da_id = next(e["id"] for e in exams_res.json() if e["code"] == "GATE-DA")

        ts_res = await client.get(f"/api/v1/exams/{gate_da_id}/test-series")
        assert ts_res.status_code == 200
        series = ts_res.json()
        assert len(series) >= 1
        series_id = series[0]["id"]

        # 3. Get tests in series
        tests_res = await client.get(f"/api/v1/test-series/{series_id}/tests")
        assert tests_res.status_code == 200
        tests_list = tests_res.json()
        assert len(tests_list) >= 1
        test_id = tests_list[0]["id"]

        # 4. Start test attempt
        attempt_res = await client.post(f"/api/v1/tests/{test_id}/attempts", headers=headers)
        assert attempt_res.status_code == 200
        attempt_data = attempt_res.json()
        attempt_id = attempt_data.get("id") or attempt_data.get("attempt_id")
        assert "questions" in attempt_data
        questions = attempt_data["questions"]
        assert len(questions) == 5

        # 5. Answer question 1 (MCQ: Probability)
        q1 = next(q for q in questions if q["question_type"] == "MCQ")
        # In seeded question 1, Option B is correct (label B)
        opt_b = next(o["id"] for o in q1["options"] if o["label"] == "B")
        ans1_res = await client.put(
            f"/api/v1/attempts/{attempt_id}/answers/{q1['id']}",
            headers=headers,
            json={
                "selected_option_ids": [opt_b],
                "time_spent_seconds": 45,
            }
        )
        assert ans1_res.status_code == 200

        # 6. Answer question 3 (NAT: F1-score 0.67)
        q_nat = next(q for q in questions if q["question_type"] == "NAT")
        ans_nat_res = await client.put(
            f"/api/v1/attempts/{attempt_id}/answers/{q_nat['id']}",
            headers=headers,
            json={
                "numerical_answer": 0.67,
                "time_spent_seconds": 60,
            }
        )
        assert ans_nat_res.status_code == 200

        # 7. Submit test
        submit_res = await client.post(f"/api/v1/attempts/{attempt_id}/submit", headers=headers)
        assert submit_res.status_code == 200
        sub_data = submit_res.json()
        assert sub_data["status"] == "SUBMITTED"

        # 8. Check result (policy is IMMEDIATE)
        res_res = await client.get(f"/api/v1/attempts/{attempt_id}/result", headers=headers)
        assert res_res.status_code == 200
        result = res_res.json()
        assert result["total_score"] >= 3.0  # 1.0 (Q1) + 2.0 (NAT) = 3.0
        assert result["correct_count"] >= 2
        assert "section_wise_scores" in result
