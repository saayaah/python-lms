import hashlib
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from app.config import get_settings

password_hash = PasswordHash.recommended()


def hash_password(value: str) -> str:
    return password_hash.hash(value)


def verify_password(value: str, hashed: str) -> bool:
    return password_hash.verify(value, hashed)


def token_hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def create_access_token(subject: str) -> str:
    settings = get_settings()
    expires = datetime.now(UTC) + timedelta(minutes=settings.access_token_minutes)
    return jwt.encode(
        {"sub": subject, "type": "access", "exp": expires}, settings.secret_key, algorithm="HS256"
    )


def create_refresh_token(subject: str) -> tuple[str, str]:
    settings = get_settings()
    raw = secrets.token_urlsafe(48)
    expires = datetime.now(UTC) + timedelta(days=settings.refresh_token_days)
    # The opaque token is stored only as a hash; its expiry is enforced by the API token record lifecycle.
    return raw, jwt.encode(
        {"sub": subject, "type": "refresh", "exp": expires}, settings.secret_key, algorithm="HS256"
    )


def decode_access_token(value: str) -> dict:
    return jwt.decode(value, get_settings().secret_key, algorithms=["HS256"])
