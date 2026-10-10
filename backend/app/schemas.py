from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Envelope(BaseModel):
    success: bool = True
    data: object | None = None
    message: str | None = None
    errors: list[str] = []


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=120)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: EmailStr
    name: str
    role: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class CourseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    slug: str
    title: str
    description: str
    difficulty: str
    published: bool


class LessonComplete(BaseModel):
    completed: bool = True


class CodeRunRequest(BaseModel):
    code: str = Field(max_length=20_000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4_000)
    mode: str = "socratic"


class QuizAnswerRequest(BaseModel):
    answers: dict[UUID, str]
