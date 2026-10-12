import asyncio
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db import Base, SessionLocal, engine
from app.models import CodingProblem, Course, Lesson, Module, Quiz, QuizQuestion


@dataclass(frozen=True)
class LessonSeed:
    title: str
    slug: str
    content: str
    quiz: tuple[str, tuple[str, ...], str] | None = None
    exercise: tuple[str, str, str] | None = None


@dataclass(frozen=True)
class CourseSeed:
    slug: str
    title: str
    description: str
    difficulty: str
    modules: tuple[tuple[str, tuple[LessonSeed, ...]], ...]


COURSES = (
    CourseSeed(
        "python-foundations",
        "Python Foundations",
        "Build a practical foundation in Python.",
        "beginner",
        (
            (
                "Core syntax",
                (
                    LessonSeed(
                        "Variables and values",
                        "variables",
                        "# Variables\n\nPython names point to values. Try `score = 10`.",
                        (
                            "Core syntax check",
                            ("func", "def", "function", "lambda"),
                            "def",
                        ),
                    ),
                    LessonSeed(
                        "Control flow",
                        "control-flow",
                        "# Control flow\n\nUse `if`, `for`, and `while` to express decisions and repetition.",
                        exercise=(
                            "Print a greeting",
                            "Write a program that prints exactly `Hello, Python!`.",
                            "print('Hello, Python!')",
                        ),
                    ),
                    LessonSeed(
                        "Functions",
                        "functions",
                        "# Functions\n\nFunctions package reusable behavior behind a clear name and parameters.",
                        (
                            "Functions check",
                            ("class", "def", "return", "import"),
                            "def",
                        ),
                    ),
                ),
            ),
            (
                "Working with data",
                (
                    LessonSeed(
                        "Lists and dictionaries",
                        "lists-and-dictionaries",
                        "# Lists and dictionaries\n\nUse lists for ordered values and dictionaries for key-value data.",
                        exercise=(
                            "Count list values",
                            "Print the number of values in `numbers`.",
                            "numbers = [2, 4, 6, 8]\nprint(len(numbers))",
                        ),
                    ),
                    LessonSeed(
                        "Modules and files",
                        "modules-and-files",
                        "# Modules and files\n\nSplit reusable code into modules and keep projects organized.",
                    ),
                ),
            ),
        ),
    ),
    CourseSeed(
        "python-intermediate",
        "Python Intermediate",
        "Build stronger programs with OOP, testing, APIs, and asynchronous code.",
        "intermediate",
        (
            (
                "Write maintainable Python",
                (
                    LessonSeed(
                        "Object-oriented programming",
                        "object-oriented-programming",
                        "# Object-oriented programming\n\nUse classes to model state and behavior that belong together.",
                        (
                            "OOP check",
                            ("A class", "A loop", "A package manager", "A comment"),
                            "A class",
                        ),
                    ),
                    LessonSeed(
                        "Exceptions and debugging",
                        "exceptions-and-debugging",
                        "# Exceptions and debugging\n\nHandle expected failures explicitly and use tracebacks to find the source of bugs.",
                    ),
                    LessonSeed(
                        "Testing with pytest",
                        "testing-with-pytest",
                        "# Testing with pytest\n\nSmall automated tests protect behavior as your code changes.",
                        exercise=(
                            "Write an assertion",
                            "Write a passing assertion that `2 + 2` equals `4`.",
                            "assert 2 + 2 == 4",
                        ),
                    ),
                ),
            ),
            (
                "Modern Python",
                (
                    LessonSeed(
                        "Type hints",
                        "type-hints",
                        "# Type hints\n\nAnnotations document expected values and help tools catch mistakes early.",
                    ),
                    LessonSeed(
                        "Async programming",
                        "async-programming",
                        "# Async programming\n\nUse async functions for work that spends time waiting on I/O.",
                    ),
                ),
            ),
        ),
    ),
    CourseSeed(
        "python-libraries",
        "Python Libraries",
        "Learn the standard and popular libraries used in practical Python projects.",
        "intermediate",
        (
            (
                "Useful tools",
                (
                    LessonSeed(
                        "Working with JSON",
                        "working-with-json",
                        "# Working with JSON\n\nSerialize Python data for APIs and configuration files.",
                    ),
                    LessonSeed(
                        "HTTP requests",
                        "http-requests",
                        "# HTTP requests\n\nCall web services and handle response data safely.",
                    ),
                    LessonSeed(
                        "Data analysis with pandas",
                        "data-analysis-with-pandas",
                        "# Data analysis with pandas\n\nUse tables and transformations to answer questions about data.",
                    ),
                ),
            ),
        ),
    ),
    CourseSeed(
        "django-python",
        "Django with Python",
        "Build database-backed web applications with Django.",
        "advanced",
        (
            (
                "Django foundations",
                (
                    LessonSeed(
                        "Projects and apps",
                        "projects-and-apps",
                        "# Projects and apps\n\nOrganize a Django site into settings, URLs, and focused applications.",
                    ),
                    LessonSeed(
                        "Models and migrations",
                        "models-and-migrations",
                        "# Models and migrations\n\nRepresent application data and evolve its database schema safely.",
                    ),
                    LessonSeed(
                        "Views and templates",
                        "views-and-templates",
                        "# Views and templates\n\nConnect requests to Python logic and reusable HTML templates.",
                    ),
                ),
            ),
        ),
    ),
    CourseSeed(
        "fastapi-python",
        "FastAPI in Python",
        "Create typed, documented, production-ready APIs with FastAPI.",
        "advanced",
        (
            (
                "API development",
                (
                    LessonSeed(
                        "Routes and request models",
                        "routes-and-request-models",
                        "# Routes and request models\n\nUse type annotations and Pydantic models to define reliable API contracts.",
                    ),
                    LessonSeed(
                        "Authentication",
                        "authentication",
                        "# Authentication\n\nProtect API resources with a clear token and dependency strategy.",
                    ),
                    LessonSeed(
                        "Testing APIs",
                        "testing-apis",
                        "# Testing APIs\n\nExercise endpoints with focused tests before deploying changes.",
                        exercise=(
                            "Return a response",
                            "Create a dictionary named `response` with a `status` key set to `200`.",
                            "response = {'status': 200}\nprint(response)",
                        ),
                    ),
                ),
            ),
        ),
    ),
    CourseSeed(
        "dsa-essentials",
        "DSA Essentials",
        "Learn the patterns and trade-offs behind efficient Python solutions.",
        "intermediate",
        (
            (
                "Problem solving patterns",
                (
                    LessonSeed(
                        "Big O notation",
                        "big-o",
                        "# Big O notation\n\nMeasure how algorithm work grows with input size.",
                        (
                            "Complexity check",
                            ("O(1)", "O(log n)", "O(n)", "O(n²)"),
                            "O(n)",
                        ),
                    ),
                    LessonSeed(
                        "Arrays and strings",
                        "arrays-and-strings",
                        "# Arrays and strings\n\nLearn how to iterate, compare, and index efficiently.",
                        exercise=(
                            "Reverse a string",
                            "Print the reverse of the string `python`.",
                            "word = 'python'\nprint(word[::-1])",
                        ),
                    ),
                    LessonSeed(
                        "Hash maps and sets",
                        "hash-maps-and-sets",
                        "# Hash maps and sets\n\nUse hashing for fast lookup, membership checks, and counting.",
                    ),
                ),
            ),
            (
                "Algorithms",
                (
                    LessonSeed(
                        "Stacks and queues",
                        "stacks-and-queues",
                        "# Stacks and queues\n\nChoose LIFO or FIFO behavior to match the problem you are solving.",
                    ),
                    LessonSeed(
                        "Sorting and searching",
                        "sorting-and-searching",
                        "# Sorting and searching\n\nCompare straightforward approaches with efficient built-in and binary-search techniques.",
                    ),
                ),
            ),
        ),
    ),
    CourseSeed(
        "interview-problem-solving",
        "Interview Problem Solving",
        "Practice a repeatable process for solving Python interview problems.",
        "challenge",
        (
            (
                "Interview patterns",
                (
                    LessonSeed(
                        "Clarify and plan",
                        "clarify-and-plan",
                        "# Clarify and plan\n\nRestate the problem, identify constraints, and choose a measurable approach.",
                    ),
                    LessonSeed(
                        "Two pointers",
                        "two-pointers",
                        "# Two pointers\n\nMove two indexes through ordered data to avoid unnecessary nested loops.",
                    ),
                    LessonSeed(
                        "Sliding window",
                        "sliding-window",
                        "# Sliding window\n\nMaintain a changing range to solve contiguous sequence problems efficiently.",
                    ),
                ),
            ),
        ),
    ),
    CourseSeed(
        "advanced-python",
        "Advanced Python",
        "Explore deeper language features and production engineering practices.",
        "advanced",
        (
            (
                "Production Python",
                (
                    LessonSeed(
                        "Decorators and context managers",
                        "decorators-and-context-managers",
                        "# Decorators and context managers\n\nCompose behavior and manage resources with reusable language patterns.",
                    ),
                    LessonSeed(
                        "Packaging and environments",
                        "packaging-and-environments",
                        "# Packaging and environments\n\nMake dependencies reproducible and distribute Python projects cleanly.",
                    ),
                    LessonSeed(
                        "Performance and profiling",
                        "performance-and-profiling",
                        "# Performance and profiling\n\nMeasure real bottlenecks before choosing an optimization.",
                    ),
                ),
            ),
        ),
    ),
)


async def add_lesson_content(
    db, lesson: Lesson, lesson_seed: LessonSeed, has_quiz: bool
) -> None:
    if lesson_seed.quiz and not has_quiz:
        title, options, answer = lesson_seed.quiz
        quiz = Quiz(title=title, lesson=lesson)
        quiz.questions = [
            QuizQuestion(
                prompt=lesson_seed.quiz[0].replace(" check", "") + ": choose the best answer.",
                options="|".join(options),
                answer=answer,
                position=1,
            )
        ]
        db.add(quiz)
    if lesson_seed.exercise:
        title, statement, starter_code = lesson_seed.exercise
        existing = await db.scalar(
            select(CodingProblem.id).where(
                CodingProblem.lesson_id == lesson.id,
                CodingProblem.title == title,
            )
        )
        if existing is None:
            db.add(
                CodingProblem(
                    lesson_id=lesson.id,
                    title=title,
                    statement=statement,
                    starter_code=starter_code,
                )
            )


async def seed() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        for course_seed in COURSES:
            course = await db.scalar(
                select(Course)
                .options(selectinload(Course.modules).selectinload(Module.lessons).selectinload(Lesson.quizzes))
                .where(Course.slug == course_seed.slug)
            )
            if course is None:
                course = Course(
                    slug=course_seed.slug,
                    title=course_seed.title,
                    description=course_seed.description,
                    difficulty=course_seed.difficulty,
                    published=True,
                )
                db.add(course)
                await db.flush()
                modules_by_title = {}
            else:
                modules_by_title = {module.title: module for module in course.modules}

            for module_position, (module_title, lessons) in enumerate(course_seed.modules, 1):
                module = modules_by_title.get(module_title)
                if module is None:
                    module = Module(title=module_title, position=module_position, course=course)
                    db.add(module)
                    await db.flush()
                    lessons_by_slug = {}
                    modules_by_title[module_title] = module
                else:
                    lessons_by_slug = {lesson.slug: lesson for lesson in module.lessons}
                for lesson_position, lesson_seed in enumerate(lessons, 1):
                    lesson = lessons_by_slug.get(lesson_seed.slug)
                    has_quiz = False
                    if lesson is None:
                        lesson = Lesson(
                            title=lesson_seed.title,
                            slug=lesson_seed.slug,
                            position=lesson_position,
                            content=lesson_seed.content,
                            module=module,
                        )
                        db.add(lesson)
                        await db.flush()
                    else:
                        has_quiz = bool(lesson.quizzes)
                    await add_lesson_content(db, lesson, lesson_seed, has_quiz)
        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed())
