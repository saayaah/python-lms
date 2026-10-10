import asyncio

from sqlalchemy import select

from app.db import Base, SessionLocal, engine
from app.models import CodingProblem, Course, Lesson, Module, Quiz, QuizQuestion


async def seed() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    async with SessionLocal() as db:
        if await db.scalar(select(Course.id).limit(1)):
            return
        course = Course(
            slug="python-foundations",
            title="Python Foundations",
            description="Build a practical foundation in Python.",
            difficulty="beginner",
            published=True,
        )
        module = Module(title="Core syntax", position=1, course=course)
        module.lessons = [
            Lesson(
                title="Variables and values",
                slug="variables",
                position=1,
                content="# Variables\\n\\nPython names point to values. Try `score = 10`.",
            ),
            Lesson(
                title="Control flow",
                slug="control-flow",
                position=2,
                content="# Control flow\\n\\nUse `if`, `for`, and `while` to express decisions and repetition.",
            ),
        ]
        quiz = Quiz(title="Core syntax check", lesson=module.lessons[0])
        quiz.questions = [
            QuizQuestion(
                prompt="Which keyword defines a function?",
                options="func|def|function|lambda",
                answer="def",
                position=1,
            )
        ]
        problem = CodingProblem(
            lesson_id=module.lessons[1].id,
            title="Print a greeting",
            statement="Write a program that prints exactly `Hello, Python!`.",
            starter_code="print('Hello, Python!')",
        )
        dsa_course = Course(
            slug="dsa-essentials",
            title="DSA Essentials",
            description="Learn the patterns and trade-offs behind efficient Python solutions.",
            difficulty="intermediate",
            published=True,
        )
        dsa_module = Module(title="Problem solving patterns", position=1, course=dsa_course)
        dsa_module.lessons = [
            Lesson(
                title="Big O notation",
                slug="big-o",
                position=1,
                content="# Big O notation\n\nMeasure how algorithm work grows with input size.",
            ),
            Lesson(
                title="Arrays and strings",
                slug="arrays-and-strings",
                position=2,
                content="# Arrays and strings\n\nLearn how to iterate, compare, and index efficiently.",
            ),
        ]
        db.add(course)
        db.add(dsa_course)
        db.add(quiz)
        await db.flush()
        problem.lesson_id = module.lessons[1].id
        db.add(problem)
        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed())
