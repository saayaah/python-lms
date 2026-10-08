from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.dependencies import user_from_token
from app.models import (
    CodeSubmission,
    CodingProblem,
    Course,
    Enrollment,
    Lesson,
    LessonProgress,
    Module,
    Quiz,
    QuizAttempt,
    User,
)
from app.schemas import (
    ChatRequest,
    CodeRunRequest,
    CourseRead,
    Envelope,
    LessonComplete,
    QuizAnswerRequest,
)
from app.services.execution import ExecutionService
from app.services.providers import MockAIProvider

router = APIRouter()


async def auth_user(authorization: str | None, db: AsyncSession) -> User:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    return await user_from_token(authorization, db)


@router.get("/health", response_model=Envelope)
async def health() -> Envelope:
    return Envelope(data={"status": "ok"})


@router.get("/courses", response_model=Envelope)
async def courses(db: AsyncSession = Depends(get_db)) -> Envelope:
    rows = (
        await db.scalars(select(Course).where(Course.published.is_(True)).order_by(Course.title))
    ).all()
    return Envelope(data=[CourseRead.model_validate(row).model_dump(mode="json") for row in rows])


@router.get("/courses/{course_id}", response_model=Envelope)
async def course_detail(course_id: UUID, db: AsyncSession = Depends(get_db)) -> Envelope:
    course = await db.scalar(
        select(Course)
        .options(
            selectinload(Course.modules)
            .selectinload(Module.lessons)
            .selectinload(Lesson.quizzes)
        )
        .where(Course.id == course_id)
    )
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    data = CourseRead.model_validate(course).model_dump(mode="json")
    data["modules"] = [
        {
            "id": str(module.id),
            "title": module.title,
            "position": module.position,
            "lessons": [
                {
                    "id": str(lesson.id),
                    "title": lesson.title,
                    "slug": lesson.slug,
                    "content": lesson.content,
                    "position": lesson.position,
                    "quizzes": [{"id": str(quiz.id), "title": quiz.title} for quiz in lesson.quizzes],
                }
                for lesson in module.lessons
            ],
        }
        for module in course.modules
    ]
    return Envelope(data=data)


@router.post("/courses/{course_id}/enroll", response_model=Envelope)
async def enroll(
    course_id: UUID,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Envelope:
    user = await auth_user(authorization, db)
    if await db.scalar(select(Course.id).where(Course.id == course_id)) is None:
        raise HTTPException(status_code=404, detail="Course not found")
    existing = await db.scalar(
        select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.course_id == course_id)
    )
    if existing is None:
        db.add(Enrollment(user_id=user.id, course_id=course_id))
        await db.commit()
    return Envelope(message="Enrolled")


@router.post("/lessons/{lesson_id}/complete", response_model=Envelope)
async def complete_lesson(
    lesson_id: UUID,
    payload: LessonComplete,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Envelope:
    user = await auth_user(authorization, db)
    if await db.scalar(select(Lesson.id).where(Lesson.id == lesson_id)) is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    progress = await db.scalar(
        select(LessonProgress).where(
            LessonProgress.user_id == user.id, LessonProgress.lesson_id == lesson_id
        )
    )
    if progress is None:
        progress = LessonProgress(user_id=user.id, lesson_id=lesson_id)
        db.add(progress)
    progress.completed = payload.completed
    await db.commit()
    return Envelope(data={"lesson_id": str(lesson_id), "completed": progress.completed})


@router.get("/progress/{course_id}", response_model=Envelope)
async def progress(
    course_id: UUID,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Envelope:
    user = await auth_user(authorization, db)
    enrolled = await db.scalar(
        select(Enrollment.id).where(
            Enrollment.user_id == user.id,
            Enrollment.course_id == course_id,
        )
    ) is not None
    total = (
        await db.scalar(
            select(func.count(Lesson.id)).join(Module).where(Module.course_id == course_id)
        )
        or 0
    )
    done = (
        await db.scalar(
            select(func.count(LessonProgress.id))
            .join(Lesson, Lesson.id == LessonProgress.lesson_id)
            .join(Module)
            .where(
                Module.course_id == course_id,
                LessonProgress.user_id == user.id,
                LessonProgress.completed.is_(True),
            )
        )
        or 0
    )
    return Envelope(
        data={
            "course_id": str(course_id),
            "completed": done,
            "total": total,
            "percentage": round(done / total * 100) if total else 0,
            "enrolled": enrolled,
        }
    )


@router.get("/dashboard", response_model=Envelope)
async def dashboard(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Envelope:
    user = await auth_user(authorization, db)
    enrolled_courses = await db.scalar(
        select(func.count(Enrollment.id)).where(Enrollment.user_id == user.id)
    ) or 0
    completed_lessons = await db.scalar(
        select(func.count(LessonProgress.id)).where(
            LessonProgress.user_id == user.id,
            LessonProgress.completed.is_(True),
        )
    ) or 0
    quiz_attempts = await db.scalar(
        select(func.count(QuizAttempt.id)).where(QuizAttempt.user_id == user.id)
    ) or 0
    total_lessons = await db.scalar(select(func.count(Lesson.id))) or 0
    enrolled = (
        await db.scalars(
            select(Course)
            .join(Enrollment, Enrollment.course_id == Course.id)
            .where(Enrollment.user_id == user.id)
            .options(selectinload(Course.modules).selectinload(Module.lessons))
            .order_by(Course.title)
        )
    ).unique().all()
    completed_ids = set(
        (
            await db.scalars(
                select(LessonProgress.lesson_id).where(
                    LessonProgress.user_id == user.id,
                    LessonProgress.completed.is_(True),
                )
            )
        ).all()
    )
    course_progress = []
    for course in enrolled:
        lessons = [lesson for module in course.modules for lesson in module.lessons]
        completed = sum(lesson.id in completed_ids for lesson in lessons)
        course_progress.append(
            {
                "id": str(course.id),
                "title": course.title,
                "difficulty": course.difficulty,
                "completed": completed,
                "total": len(lessons),
                "percentage": round(completed / len(lessons) * 100) if lessons else 0,
            }
        )
    recommendation = (
        "Continue with Python fundamentals and complete your next exercise."
        if completed_lessons < 3
        else "You are ready for more advanced patterns and algorithmic thinking."
    )
    return Envelope(
        data={
            "name": user.name,
            "role": user.role,
            "enrolled_courses": enrolled_courses,
            "completed_lessons": completed_lessons,
            "quiz_attempts": quiz_attempts,
            "total_lessons": total_lessons,
            "recommendation": recommendation,
            "courses": course_progress,
        }
    )


@router.get("/admin/overview", response_model=Envelope)
async def admin_overview(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Envelope:
    user = await auth_user(authorization, db)
    if user.role not in {"admin", "instructor"}:
        raise HTTPException(status_code=403, detail="Admin access required")
    course_count = await db.scalar(select(func.count(Course.id))) or 0
    student_count = await db.scalar(
        select(func.count(User.id)).where(User.role == "student", User.is_active.is_(True))
    ) or 0
    completion_rate = await db.scalar(
        select(func.avg(LessonProgress.completed.cast(Integer)))
    )
    return Envelope(
        data={
            "role": user.role,
            "course_count": course_count,
            "student_count": student_count,
            "completion_rate": round(float(completion_rate or 0) * 100) if completion_rate is not None else 0,
        }
    )


@router.get("/quizzes/{quiz_id}", response_model=Envelope)
async def quiz(quiz_id: UUID, db: AsyncSession = Depends(get_db)) -> Envelope:
    row = await db.scalar(
        select(Quiz).options(selectinload(Quiz.questions)).where(Quiz.id == quiz_id)
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return Envelope(
        data={
            "id": str(row.id),
            "title": row.title,
            "questions": [
                {
                    "id": str(question.id),
                    "prompt": question.prompt,
                    "options": question.options.split("|"),
                    "position": question.position,
                }
                for question in sorted(row.questions, key=lambda item: item.position)
            ],
        }
    )


@router.post("/quizzes/{quiz_id}/attempts", response_model=Envelope)
async def quiz_attempt(
    quiz_id: UUID,
    payload: QuizAnswerRequest,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Envelope:
    user = await auth_user(authorization, db)
    row = await db.scalar(
        select(Quiz).options(selectinload(Quiz.questions)).where(Quiz.id == quiz_id)
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    score = sum(
        payload.answers.get(question.id) == question.answer for question in row.questions
    )
    attempt = QuizAttempt(user_id=user.id, quiz_id=quiz_id, score=score, total=len(row.questions))
    db.add(attempt)
    await db.commit()
    return Envelope(data={"score": score, "total": len(row.questions), "percentage": round(score / len(row.questions) * 100) if row.questions else 0})


@router.post("/ai/chat", response_model=Envelope)
async def chat(
    payload: ChatRequest,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Envelope:
    await auth_user(authorization, db)
    return Envelope(
        data={
            "reply": await MockAIProvider().reply(payload.message, payload.mode),
            "disclaimer": "AI output should be verified.",
        }
    )


@router.get("/problems", response_model=Envelope)
async def problems(db: AsyncSession = Depends(get_db)) -> Envelope:
    rows = (await db.scalars(select(CodingProblem).order_by(CodingProblem.created_at))).all()
    return Envelope(
        data=[
            {
                "id": str(row.id),
                "title": row.title,
                "statement": row.statement,
                "starter_code": row.starter_code,
            }
            for row in rows
        ]
    )


@router.get("/problems/{problem_id}/submissions", response_model=Envelope)
async def submissions(
    problem_id: UUID,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Envelope:
    user = await auth_user(authorization, db)
    rows = (
        await db.scalars(
            select(CodeSubmission)
            .where(CodeSubmission.problem_id == problem_id, CodeSubmission.user_id == user.id)
            .order_by(CodeSubmission.created_at.desc())
            .limit(20)
        )
    ).all()
    return Envelope(
        data=[
            {
                "id": str(row.id),
                "status": row.status,
                "stdout": row.stdout,
                "stderr": row.stderr,
                "created_at": row.created_at.isoformat(),
            }
            for row in rows
        ]
    )


@router.post("/problems/{problem_id}/run", response_model=Envelope)
async def run_code(
    problem_id: UUID,
    payload: CodeRunRequest,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Envelope:
    user = await auth_user(authorization, db)
    if await db.scalar(select(CodingProblem.id).where(CodingProblem.id == problem_id)) is None:
        raise HTTPException(status_code=404, detail="Coding problem not found")
    result = await ExecutionService().run(payload.code)
    db.add(
        CodeSubmission(
            user_id=user.id,
            problem_id=problem_id,
            code=payload.code,
            status=str(result["status"]),
            stdout=str(result["stdout"]),
            stderr=str(result["stderr"]),
        )
    )
    await db.commit()
    return Envelope(data=result)
