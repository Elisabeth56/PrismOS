"""Small helpers that create isolated users, projects and runs in the test database."""

from __future__ import annotations

import time
import uuid

import jwt
import psycopg

from tests.conftest import TEST_ENV


def token(sub: str, *, aud: str = "authenticated", expires_in: int = 3600, key: str | None = None) -> str:
    claims = {"sub": sub, "aud": aud, "exp": int(time.time()) + expires_in}
    return jwt.encode(claims, key or TEST_ENV["SUPABASE_JWT_SECRET"], algorithm="HS256")


def bearer(sub: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token(sub)}"}


def make_user(db_url: str) -> str:
    user_id = str(uuid.uuid4())
    with psycopg.connect(db_url, autocommit=True) as conn:
        conn.execute("insert into auth.users (id, email) values (%s, %s)", (user_id, f"{user_id}@example.com"))
    return user_id


def make_project(db_url: str, owner: str, *, default_branch: str = "main") -> str:
    with psycopg.connect(db_url, autocommit=True) as conn:
        row = conn.execute(
            """insert into projects (name, repo_full_name, default_branch, created_by)
               values ('test', 'acme/app', %s, %s) returning id""",
            (default_branch, owner),
        ).fetchone()
        assert row is not None
        conn.execute(
            "insert into project_members (project_id, user_id, role) values (%s, %s, 'owner')", (row[0], owner)
        )
    return str(row[0])


def make_run(db_url: str, project_id: str, user_id: str, *, status: str = "queued", **columns: object) -> str:
    fields = {"project_id": project_id, "requested_by": user_id, "feature_request": "a test feature request",
              "base_branch": "main", "status": status, **columns}
    names = ", ".join(fields)
    placeholders = ", ".join(["%s"] * len(fields))
    with psycopg.connect(db_url, autocommit=True) as conn:
        row = conn.execute(
            f"insert into runs ({names}) values ({placeholders}) returning id",  # pyright: ignore[reportArgumentType]
            tuple(fields.values()),
        ).fetchone()
    assert row is not None
    return str(row[0])
