"""Runs API: create, read, list and cancel, scoped by membership and rate-limited per user."""

from collections.abc import AsyncIterator, Iterator

import pytest
from fastapi.testclient import TestClient
from psycopg import AsyncConnection
from psycopg.rows import DictRow, dict_row

from app.database import get_conn
from app.main import app
from tests.conftest import needs_db
from tests.factories import bearer, make_project, make_run, make_user

pytestmark = needs_db

REQUEST = "Add rate limiting to the login endpoint"


@pytest.fixture
def client(migrated_db_url) -> Iterator[TestClient]:
    async def test_conn() -> AsyncIterator[AsyncConnection[DictRow]]:
        connect = AsyncConnection[DictRow].connect
        async with await connect(migrated_db_url, row_factory=dict_row, autocommit=True) as conn:
            yield conn

    app.dependency_overrides[get_conn] = test_conn
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def owner(migrated_db_url) -> tuple[str, str]:
    user = make_user(migrated_db_url)
    return user, make_project(migrated_db_url, user, default_branch="develop")


def test_creating_a_run_queues_it_and_returns_202(client, owner):
    user, project = owner

    body = {"project_id": project, "feature_request": REQUEST}
    response = client.post("/api/v1/runs", json=body, headers=bearer(user))

    assert response.status_code == 202
    run = response.json()
    assert (run["status"], run["base_branch"], run["feature_request"]) == ("queued", "develop", REQUEST)


def test_non_members_cannot_start_runs_on_a_project(client, owner, migrated_db_url):
    _, project = owner
    outsider = make_user(migrated_db_url)

    response = client.post(
        "/api/v1/runs", json={"project_id": project, "feature_request": REQUEST}, headers=bearer(outsider)
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "project_not_found"


@pytest.mark.parametrize(
    ("patch", "field"),
    [
        ({"feature_request": "too short"}, "feature_request"),
        ({"feature_request": "          padded   "}, "feature_request"),
        ({"base_branch": "../main"}, "base_branch"),
        ({"context_files": [{"name": "a.md", "content": "x"}] * 6}, "context_files"),
        ({"context_files": [{"name": "big.md", "content": "x" * (100 * 1024 + 1)}]}, "context_files.0.content"),
        ({"context_files": [{"name": "../../etc/passwd", "content": "x"}]}, "context_files.0.name"),
    ],
)
def test_bad_input_is_rejected_with_the_field_named(client, owner, patch, field):
    user, project = owner

    response = client.post(
        "/api/v1/runs", json={"project_id": project, "feature_request": REQUEST, **patch}, headers=bearer(user)
    )

    assert response.status_code == 422
    assert field in response.json()["error"]["details"]["fields"]


def test_a_user_can_have_two_active_runs_at_most(client, owner):
    user, project = owner
    body = {"project_id": project, "feature_request": REQUEST}

    assert [client.post("/api/v1/runs", json=body, headers=bearer(user)).status_code for _ in range(2)] == [202, 202]
    response = client.post("/api/v1/runs", json=body, headers=bearer(user))

    assert response.status_code == 429
    assert response.json()["error"]["code"] == "too_many_active_runs"


def test_hourly_limit_counts_finished_runs_too(client, owner, migrated_db_url):
    user, project = owner
    for _ in range(10):
        make_run(migrated_db_url, project, user, status="failed")

    body = {"project_id": project, "feature_request": REQUEST}
    response = client.post("/api/v1/runs", json=body, headers=bearer(user))

    assert response.status_code == 429
    assert response.json()["error"]["code"] == "rate_limited"


def test_members_read_run_detail_and_outsiders_get_404(client, owner, migrated_db_url):
    user, project = owner
    run = make_run(migrated_db_url, project, user)

    detail = client.get(f"/api/v1/runs/{run}", headers=bearer(user))
    assert detail.status_code == 200
    assert (detail.json()["steps"], detail.json()["conflicts"], detail.json()["changes"]) == ({}, [], [])

    outsider = make_user(migrated_db_url)
    assert client.get(f"/api/v1/runs/{run}", headers=bearer(outsider)).json()["error"]["code"] == "run_not_found"


def test_project_runs_are_listed_newest_first(client, owner, migrated_db_url):
    user, project = owner
    first = make_run(migrated_db_url, project, user, status="failed")
    second = make_run(migrated_db_url, project, user, status="failed")

    ids = [r["id"] for r in client.get(f"/api/v1/projects/{project}/runs", headers=bearer(user)).json()]

    assert ids == [second, first]


def test_cancelling_stops_a_queued_run_once(client, owner, migrated_db_url):
    user, project = owner
    run = make_run(migrated_db_url, project, user)

    first = client.post(f"/api/v1/runs/{run}/cancel", headers=bearer(user))
    again = client.post(f"/api/v1/runs/{run}/cancel", headers=bearer(user))

    assert first.json()["status"] == "cancelled"
    assert again.status_code == 409
    assert again.json()["error"]["code"] == "run_finished"


def test_events_replay_after_a_sequence_number(client, owner, migrated_db_url):
    import psycopg

    user, project = owner
    run = make_run(migrated_db_url, project, user)
    with psycopg.connect(migrated_db_url, autocommit=True) as conn:
        for seq, kind in enumerate(["run_started", "step_started", "step_done"], start=1):
            conn.execute("insert into run_events (run_id, seq, type) values (%s, %s, %s)", (run, seq, kind))

    everything = client.get(f"/api/v1/runs/{run}/events", headers=bearer(user)).json()
    after_first = client.get(f"/api/v1/runs/{run}/events?after=1", headers=bearer(user)).json()

    assert [e["seq"] for e in everything] == [1, 2, 3]
    assert [e["type"] for e in after_first] == ["step_started", "step_done"]
    outsider = make_user(migrated_db_url)
    assert client.get(f"/api/v1/runs/{run}/events", headers=bearer(outsider)).status_code == 404
