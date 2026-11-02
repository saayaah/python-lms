from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    secret_key: str = "dev-secret-key-change-me-for-production-32+"
    database_url: str = "sqlite:///./lms.db"
    redis_url: str = "redis://localhost:6379/0"
    access_token_minutes: int = 15
    refresh_token_days: int = 30
    ai_provider: str = "mock"
    ai_api_key: str | None = None
    ai_model: str = "gpt-4o-mini"
    ai_base_url: str = "https://api.openai.com/v1"
    ai_timeout_seconds: float = 30.0

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
