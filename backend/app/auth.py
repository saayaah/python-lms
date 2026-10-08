from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.dependencies import user_from_token
from app.models import RefreshToken, User
from app.schemas import Envelope, LoginRequest, RefreshRequest, UserCreate, UserRead
from app.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    token_hash,
    verify_password,
)

router = APIRouter()


@router.get("/me", response_model=Envelope)
async def me(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Envelope:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    user = await user_from_token(authorization, db)
    return Envelope(data=UserRead.model_validate(user).model_dump(mode="json"))


def token_response(user: User, refresh: str) -> dict:
    return {
        "access_token": create_access_token(str(user.id)),
        "refresh_token": refresh,
        "user": UserRead.model_validate(user).model_dump(mode="json"),
    }


@router.post("/register", response_model=Envelope, status_code=201)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> Envelope:
    if await db.scalar(select(User).where(User.email == payload.email.lower())):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=payload.email.lower(),
        name=payload.name,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    await db.flush()
    raw, _ = create_refresh_token(str(user.id))
    db.add(RefreshToken(token_hash=token_hash(raw), user_id=user.id))
    await db.commit()
    return Envelope(data=token_response(user, raw))


@router.post("/login", response_model=Envelope)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> Envelope:
    user = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    raw, _ = create_refresh_token(str(user.id))
    db.add(RefreshToken(token_hash=token_hash(raw), user_id=user.id))
    await db.commit()
    return Envelope(data=token_response(user, raw))


@router.post("/refresh", response_model=Envelope)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> Envelope:
    record = await db.scalar(
        select(RefreshToken)
        .options(selectinload(RefreshToken.user))
        .where(
            RefreshToken.token_hash == token_hash(payload.refresh_token),
            RefreshToken.revoked.is_(False),
        )
    )
    if record is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    record.revoked = True
    raw, _ = create_refresh_token(str(record.user_id))
    db.add(RefreshToken(token_hash=token_hash(raw), user_id=record.user_id))
    await db.commit()
    return Envelope(data=token_response(record.user, raw))


@router.post("/logout", response_model=Envelope)
async def logout(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> Envelope:
    record = await db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash(payload.refresh_token))
    )
    if record:
        record.revoked = True
        await db.commit()
    return Envelope(message="Logged out")
