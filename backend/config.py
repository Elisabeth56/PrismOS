# backend/config.py
"""
Centralised settings loaded from environment variables / .env file.
Uses pydantic-settings for validation and type coercion.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """All PrismOS backend configuration lives here."""

    # ── Qwen Cloud API ───────────────────────────────────────────────────
    QWEN_API_KEY: str = ""
    QWEN_API_BASE: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    QWEN_REASONING_MODEL: str = "qwen-plus"
    QWEN_CODER_MODEL: str = "qwen-coder-plus"

    # ── Supabase ─────────────────────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # ── Alibaba OSS ──────────────────────────────────────────────────────
    OSS_ACCESS_KEY_ID: str = ""
    OSS_ACCESS_KEY_SECRET: str = ""
    OSS_BUCKET: str = "prismos-artefacts"
    OSS_ENDPOINT: str = "https://oss-cn-hangzhou.aliyuncs.com"

    # ── GitHub (public repo reads) ───────────────────────────────────────
    GITHUB_TOKEN: str = ""

    # ── CORS ─────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "https://prismos.app,http://localhost:3000,http://127.0.0.1:3000"

    # ── App ──────────────────────────────────────────────────────────────
    APP_ENV: str = "development"  # development | staging | production
    LOG_LEVEL: str = "INFO"

    # ── File upload limits (hackathon) ───────────────────────────────────
    MAX_FILE_SIZE_BYTES: int = 500 * 1024  # 500 KB per file
    MAX_FILE_COUNT: int = 5

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [o.strip().strip('"').strip("'") for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    model_config = {
        "env_file": (".env", ".env.local"),
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached singleton — call this instead of constructing Settings() directly."""
    return Settings()
