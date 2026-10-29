"""Typed settings for the API, read from the environment or apps/api/.env and validated at startup."""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, HttpUrl, SecretStr, ValidationError, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """All API configuration. Fields without a default are required."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")

    # LLM providers (ADR-002): Gemini for large calls, Groq for small fast ones.
    # Free-tier model ids change; check them when deploying and override here.
    GEMINI_API_KEY: SecretStr
    GROQ_API_KEY: SecretStr
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_FALLBACK_MODEL: str = "gemini-2.5-flash-lite"
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    LLM_TIMEOUT_SECONDS: float = Field(default=90, gt=0)

    SUPABASE_URL: HttpUrl
    SUPABASE_SERVICE_ROLE_KEY: SecretStr
    # direct Postgres connection (Supabase session pooler on IPv4 hosts); queries are scoped by membership in SQL
    DATABASE_URL: SecretStr
    # only for projects still on Supabase's legacy HS256 JWT secret; newer projects verify against the JWKS
    SUPABASE_JWT_SECRET: SecretStr | None = None

    # optional: raises GitHub's rate limit for public repo reads
    GITHUB_TOKEN: SecretStr | None = None

    CORS_ORIGINS: Annotated[list[str], NoDecode] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    APP_ENV: Literal["development", "test", "production"] = "development"
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    MAX_FILE_SIZE_BYTES: int = Field(default=100 * 1024, gt=0)
    MAX_FILE_COUNT: int = Field(default=5, gt=0, le=5)

    # run queue and worker (ADR-004)
    RUN_WORKER: bool = True  # off in tests and for API-only processes
    RUNS_PER_HOUR: int = Field(default=10, gt=0)
    MAX_ACTIVE_RUNS: int = Field(default=2, gt=0)
    WORKER_POLL_SECONDS: float = Field(default=2.0, gt=0)
    HEARTBEAT_SECONDS: float = Field(default=15.0, gt=0)
    STALE_RUN_SECONDS: float = Field(default=90.0, gt=0)
    MAX_RUN_ATTEMPTS: int = Field(default=3, gt=0)

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
