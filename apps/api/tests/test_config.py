import pytest

from app.config import Settings, get_settings


def test_missing_required_variable_exits_naming_it(monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.setattr(Settings, "model_config", {**Settings.model_config, "env_file": None})
    get_settings.cache_clear()

    with pytest.raises(SystemExit) as exit_info:
        get_settings()

    assert "SUPABASE_URL" in str(exit_info.value)
    get_settings.cache_clear()


def test_cors_origins_accepts_comma_separated_string(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "https://prismos.dev, http://localhost:3000")

    settings = Settings(_env_file=None)  # pyright: ignore[reportCallIssue]

    assert settings.CORS_ORIGINS == ["https://prismos.dev", "http://localhost:3000"]


def test_secrets_are_not_printed(monkeypatch):
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "super-secret")

    settings = Settings(_env_file=None)  # pyright: ignore[reportCallIssue]

    assert "super-secret" not in repr(settings)
