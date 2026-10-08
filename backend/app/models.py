from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    TypeDecorator,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class UUIDType(TypeDecorator[UUID]):
    impl = PGUUID
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "sqlite":
            from sqlalchemy import CHAR

            return dialect.type_descriptor(CHAR(36))
        return dialect.type_descriptor(PGUUID(as_uuid=True))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return str(value) if dialect.name == "sqlite" else value

    def process_result_value(self, value, dialect):
        return UUID(value) if value is not None and dialect.name == "sqlite" else value


UuidType = UUIDType()


class TimestampMixin:
    id: Mapped[UUID] = mapped_column(UuidType, primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(30), default="student")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class RefreshToken(TimestampMixin, Base):
    __tablename__ = "refresh_tokens"
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    user: Mapped[User] = relationship(back_populates="refresh_tokens")


class Course(TimestampMixin, Base):
    __tablename__ = "courses"
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String(30), default="beginner")
    published: Mapped[bool] = mapped_column(Boolean, default=False)
    modules: Mapped[list["Module"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )


class Module(TimestampMixin, Base):
    __tablename__ = "modules"
    course_id: Mapped[UUID] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    position: Mapped[int] = mapped_column(Integer)
    course: Mapped[Course] = relationship(back_populates="modules")
    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="module", cascade="all, delete-orphan"
    )


class Lesson(TimestampMixin, Base):
    __tablename__ = "lessons"
    module_id: Mapped[UUID] = mapped_column(
        ForeignKey("modules.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(120))
    content: Mapped[str] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer)
    module: Mapped[Module] = relationship(back_populates="lessons")
    quizzes: Mapped[list["Quiz"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")


class Enrollment(TimestampMixin, Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("user_id", "course_id"),)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    course_id: Mapped[UUID] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True
    )


class LessonProgress(TimestampMixin, Base):
    __tablename__ = "lesson_progress"
    __table_args__ = (UniqueConstraint("user_id", "lesson_id"),)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    lesson_id: Mapped[UUID] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE"), index=True
    )
    completed: Mapped[bool] = mapped_column(Boolean, default=False)


class Quiz(TimestampMixin, Base):
    __tablename__ = "quizzes"
    lesson_id: Mapped[UUID] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    lesson: Mapped[Lesson] = relationship(back_populates="quizzes")
    questions: Mapped[list["QuizQuestion"]] = relationship(
        back_populates="quiz", cascade="all, delete-orphan"
    )


class QuizQuestion(TimestampMixin, Base):
    __tablename__ = "quiz_questions"
    quiz_id: Mapped[UUID] = mapped_column(ForeignKey("quizzes.id", ondelete="CASCADE"), index=True)
    prompt: Mapped[str] = mapped_column(Text)
    options: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(String(255))
    position: Mapped[int] = mapped_column(Integer)
    quiz: Mapped[Quiz] = relationship(back_populates="questions")


class QuizAttempt(TimestampMixin, Base):
    __tablename__ = "quiz_attempts"
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    quiz_id: Mapped[UUID] = mapped_column(ForeignKey("quizzes.id", ondelete="CASCADE"), index=True)
    score: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)


class CodingProblem(TimestampMixin, Base):
    __tablename__ = "coding_problems"
    lesson_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(200))
    statement: Mapped[str] = mapped_column(Text)
    starter_code: Mapped[str] = mapped_column(Text, default="")


class CodeSubmission(TimestampMixin, Base):
    __tablename__ = "code_submissions"
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    problem_id: Mapped[UUID] = mapped_column(
        ForeignKey("coding_problems.id", ondelete="CASCADE"), index=True
    )
    code: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30))
    stdout: Mapped[str] = mapped_column(Text, default="")
    stderr: Mapped[str] = mapped_column(Text, default="")
