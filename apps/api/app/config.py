"""Typed settings for the API, read from the environment or apps/api/.env and validated at startup."""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, HttpUrl, SecretStr, ValidationError, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """All API configuration. Fields without a default are required."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")

    # LLM provider; replaced by Gemini and Groq in #7
    QWEN_API_KEY: SecretStr
    QWEN_API_BASE: HttpUrl = HttpUrl("https://dashscope-intl.aliyuncs.com/compatible-mode/v1")
    QWEN_REASONING_MODEL: str = "qwen3.7-plus"
    QWEN_CODER_MODEL: str = "qwen3-coder-plus"

    SUPABASE_URL: HttpUrl
    SUPABASE_SERVICE_ROLE_KEY: SecretStr

    # optional: raises GitHub's rate limit for public repo reads
    GITHUB_TOKEN: SecretStr | None = None

    CORS_ORIGINS: Annotated[list[str], NoDecode] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    APP_ENV: Literal["development", "test", "production"] = "development"
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    MAX_FILE_SIZE_BYTES: int = Field(default=500 * 1024, gt=0)
    MAX_FILE_COUNT: int = Field(default=5, gt=0)

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_origins(cls, value: object) -> object:
        """Accept a comma-separated string so hosts can set one plain env var."""
        if isinstance(value, str):
            return [o.strip().strip("\"'") for o in value.split(",") if o.strip()]
        return value


def missing_settings_message(error: ValidationError) -> str:
    """Turns a settings validation error into one line naming every bad variable."""
    problems = [f"{'.'.join(str(p) for p in e['loc'])} ({e['msg'].lower()})" for e in error.errors()]
    return "Invalid or missing environment variables: " + ", ".join(problems) + ". See apps/api/.env.example."


@lru_cache
def get_settings() -> Settings:
    """Cached settings; exits with a readable message when the environment is incomplete."""
    try:
        return Settings()  # pyright: ignore[reportCallIssue]
    except ValidationError as error:
        raise SystemExit(missing_settings_message(error)) from None
