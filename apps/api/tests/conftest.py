"""Test environment: placeholder settings so the app boots without real credentials, and a migrated test database."""

import os
import uuid
from collections.abc import Iterator
from pathlib import Path

import pytest

TEST_ENV = {
    "APP_ENV": "test",
    "RUN_WORKER": "false",
    "GEMINI_API_KEY": "test-gemini-key",
    "GROQ_API_KEY": "test-groq-key",
    "SUPABASE_URL": "http://localhost:54321",
    "SUPABASE_SERVICE_ROLE_KEY": "test-service-role-key",
    "DATABASE_URL": "postgresql://localhost/unused",
    "SUPABASE_JWT_SECRET": "test-jwt-secret-that-is-at-least-32-bytes-long",
}

# set before any app module is imported, since modules read settings at import time
for key, value in TEST_ENV.items():
    os.environ.setdefault(key, value)

ROOT = Path(__file__).resolve().parents[3]
SHIM = Path(__file__).parent / "db" / "supabase_shim.sql"

# ids from supabase/seed.sql
DEMO_USER = "00000000-0000-4000-8000-00000000d3e0"
DEMO_PROJECT = "00000000-0000-4000-8000-0000000000a1"
DEMO_RUN = "00000000-0000-4000-8000-0000000007f3"
DEMO_CONFLICT = "00000000-0000-4000-8000-00000000c031"

ADMIN_URL = os.environ.get("TEST_DATABASE_URL")
needs_db = pytest.mark.skipif(not ADMIN_URL, reason="TEST_DATABASE_URL not set")


@pytest.fixture(scope="session")
def migrated_db_url() -> Iterator[str]:
    """A throwaway database with the Supabase shim, every migration and the seed applied."""
    import psycopg
    from psycopg import sql
    from psycopg.conninfo import make_conninfo

    if not ADMIN_URL:
        pytest.skip("TEST_DATABASE_URL not set")
    db_name = f"prismos_test_{uuid.uuid4().hex[:8]}"
    with psycopg.connect(ADMIN_URL, autocommit=True) as admin:
        admin.execute(sql.SQL("create database {}").format(sql.Identifier(db_name)))
    url = make_conninfo(ADMIN_URL, dbname=db_name)
    try:
        with psycopg.connect(url, autocommit=True) as conn:
            migrations = sorted((ROOT / "supabase" / "migrations").glob("*.sql"))
            for path in [SHIM, *migrations, ROOT / "supabase" / "seed.sql"]:
                conn.execute(path.read_bytes())
        yield url
    finally:
        with psycopg.connect(ADMIN_URL, autocommit=True) as admin:
            admin.execute(sql.SQL("drop database if exists {} with (force)").format(sql.Identifier(db_name)))
