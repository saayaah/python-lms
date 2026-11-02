from httpx import ASGITransport, AsyncClient

from app.db import SessionLocal
from app.main import app
from app.models import Course, Lesson, Module, Quiz, QuizQuestion


async def client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def register(client: AsyncClient, email: str = "student@example.com") -> dict:
    response = await client.post(
        "/api/v1/auth/register",
        json={"name": "Student", "email": email, "password": "Password123!"},
    )
    assert response.status_code == 201
    return response.json()["data"]


async def test_registration_login_me_refresh_and_logout() -> None:
    async with await client() as http:
        session = await register(http)
        assert session["user"]["email"] == "student@example.com"

        me = await http.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {session['access_token']}"},
        )
        assert me.status_code == 200
        assert me.json()["data"]["name"] == "Student"

        duplicate = await http.post(
            "/api/v1/auth/register",
            json={"name": "Other", "email": "STUDENT@example.com", "password": "Password123!"},
        )
        assert duplicate.status_code == 409

        login = await http.post(
            "/api/v1/auth/login",
            json={"email": "STUDENT@example.com", "password": "Password123!"},
        )
        assert login.status_code == 200
        refreshed = await http.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": session["refresh_token"]},
        )
        assert refreshed.status_code == 200
        assert refreshed.json()["data"]["refresh_token"] != session["refresh_token"]

        logged_out = await http.post(
            "/api/v1/auth/logout",
            json={"refresh_token": refreshed.json()["data"]["refresh_token"]},
        )
        assert logged_out.status_code == 200
        revoked = await http.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refreshed.json()["data"]["refresh_token"]},
        )
        assert revoked.status_code == 401


async def test_invalid_authentication_and_protected_access() -> None:
    async with await client() as http:
        protected = await http.get("/api/v1/dashboard")
        assert protected.status_code == 401
        invalid = await http.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert invalid.status_code == 401
        login = await http.post(
            "/api/v1/auth/login",
            json={"email": "missing@example.com", "password": "Password123!"},
        )
        assert login.status_code == 401


async def test_enrollment_progress_and_quiz_attempt() -> None:
    async with SessionLocal() as db:
        course = Course(
            slug="test-course",
            title="Test Course",
            description="A test course",
            difficulty="beginner",
            published=True,
        )
        module = Module(title="Module 1", position=1, course=course)
        lesson = Lesson(
            title="Lesson 1",
            slug="lesson-1",
            content="# Lesson 1\n\nLearn the basics.",
            position=1,
            module=module,
        )
        quiz = Quiz(title="Lesson quiz", lesson=lesson)
        quiz.questions = [
            QuizQuestion(
                prompt="Which keyword defines a function?",
                options="def|class|loop",
                answer="def",
                position=1,
            )
        ]
        db.add(course)
        await db.flush()
        question_id = quiz.questions[0].id
        course_id = course.id
        lesson_id = lesson.id
        quiz_id = quiz.id
        await db.commit()

    async with await client() as http:
        session = await register(http)
        headers = {"Authorization": f"Bearer {session['access_token']}"}

        before_enrollment = await http.post(
            f"/api/v1/lessons/{lesson_id}/complete",
            headers=headers,
            json={"completed": True},
        )
        assert before_enrollment.status_code == 403

        enrolled = await http.post(f"/api/v1/courses/{course_id}/enroll", headers=headers)
        assert enrolled.status_code == 200
        duplicate_enrollment = await http.post(
            f"/api/v1/courses/{course_id}/enroll",
            headers=headers,
        )
        assert duplicate_enrollment.status_code == 200

        completed = await http.post(
            f"/api/v1/lessons/{lesson_id}/complete",
            headers=headers,
            json={"completed": True},
        )
        assert completed.status_code == 200
        progress = await http.get(f"/api/v1/progress/{course_id}", headers=headers)
        assert progress.json()["data"]["percentage"] == 100

        invalid_answers = await http.post(
            f"/api/v1/quizzes/{quiz_id}/attempts",
            headers=headers,
            json={"answers": {}},
        )
        assert invalid_answers.status_code == 422
        attempt = await http.post(
            f"/api/v1/quizzes/{quiz_id}/attempts",
            headers=headers,
            json={"answers": {str(question_id): "def"}},
        )
        assert attempt.status_code == 200
        assert attempt.json()["data"]["percentage"] == 100
