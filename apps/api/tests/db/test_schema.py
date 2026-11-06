"""Schema and access tests against the migrated database: RLS, grants and constraints."""

import json
import uuid
from collections.abc import Iterator
from typing import LiteralString

import psycopg
import pytest
from psycopg import errors, sql

from tests.conftest import DEMO_CONFLICT, DEMO_RUN, DEMO_USER, needs_db

RUN_TABLES = ["run_steps", "run_events", "conflicts", "decisions", "changes"]
pytestmark = needs_db


@pytest.fixture(scope="module")
def db(migrated_db_url) -> Iterator[psycopg.Connection]:
    with psycopg.connect(migrated_db_url, autocommit=True) as conn:
        yield conn


def as_user(
    conn: psycopg.Connection, user_id: str | None, query: LiteralString | sql.Composed, params: tuple = ()
) -> list[tuple]:
    """Runs one query the way PostgREST would for a signed-in user (or anon when user_id is None)."""
    with conn.transaction(force_rollback=True), conn.cursor() as cur:
        if user_id is None:
            cur.execute("set local role anon")
        else:
            cur.execute("set local role authenticated")
            cur.execute("select set_config('request.jwt.claims', %s, true)", (json.dumps({"sub": user_id}),))
        cur.execute(query, params)
        return cur.fetchall() if cur.description else []


def new_user(conn: psycopg.Connection) -> str:
    user_id = str(uuid.uuid4())
    conn.execute("insert into auth.users (id, email) values (%s, %s)", (user_id, f"{user_id}@example.com"))
    return user_id


def test_member_reads_their_run_and_everything_in_it(db):
    assert as_user(db, DEMO_USER, "select id::text from runs") == [(DEMO_RUN,)]
    assert as_user(db, DEMO_USER, "select count(*) from run_steps")[0][0] == 2
    assert as_user(db, DEMO_USER, "select count(*) from conflicts")[0][0] == 1
    assert as_user(db, DEMO_USER, "select count(*) from decisions")[0][0] == 1
    assert as_user(db, DEMO_USER, "select count(*) from changes")[0][0] == 2


def test_non_member_sees_nothing(db):
    outsider = new_user(db)

    for table in ["projects", "project_members", "runs", "memory_entries", *RUN_TABLES]:
        query = sql.SQL("select count(*) from {}").format(sql.Identifier(table))
        assert as_user(db, outsider, query)[0][0] == 0, table


def test_anon_has_no_access(db):
    with pytest.raises(errors.InsufficientPrivilege):
        as_user(db, None, "select * from runs")


def test_clients_cannot_write(db):
    with pytest.raises(errors.InsufficientPrivilege):
        as_user(
            db,
            DEMO_USER,
            "insert into runs (project_id, feature_request, base_branch) "
            "select id, 'a feature request', 'main' from projects",
        )
    with pytest.raises(errors.InsufficientPrivilege):
        as_user(db, DEMO_USER, "update runs set status = 'pr_opened', pr_url = 'x'")


@pytest.mark.parametrize(
    ("query", "error"),
    [
        (
            "insert into changes (run_id, path, action, content) values (%s, 'x.py', 'delete', 'leftover')",
            errors.CheckViolation,
        ),
        (
            "insert into changes (run_id, path, action, content) values (%s, '../etc/passwd', 'create', 'x')",
            errors.CheckViolation,
        ),
        (
            "insert into changes (run_id, path, action, content) values (%s, '.git/config', 'create', 'x')",
            errors.CheckViolation,
        ),
        ("update runs set status = 'pr_opened' where id = %s", errors.CheckViolation),
        ("update runs set verdict = 'shippable' where id = %s", errors.CheckViolation),
    ],
)
def test_constraints_reject_bad_rows(db, query, error):
    with pytest.raises(error), db.transaction(force_rollback=True):
        db.execute(query, (DEMO_RUN,))


def test_one_decision_per_conflict(db):
    with pytest.raises(errors.UniqueViolation), db.transaction(force_rollback=True):
        db.execute(
            "insert into decisions (conflict_id, run_id, ruling, rationale) values (%s, %s, 'again', 'again')",
            (DEMO_CONFLICT, DEMO_RUN),
        )
