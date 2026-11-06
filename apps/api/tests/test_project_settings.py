"""Editing, removing and reading the activity of a project: owners change it, members only read."""

from collections.abc import AsyncIterator, Iterator

import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg import AsyncConnection
from psycopg.rows import DictRow, dict_row

from app.database import get_conn
from app.main import app
from tests.conftest import needs_db
from tests.factories import bearer, make_project, make_run, make_user

pytestmark = needs_db


@pytest.fixture
def client(migrated_db_url) -> Iterator[TestClient]:
    async def test_conn() -> AsyncIterator[AsyncConnection[DictRow]]:
        connect = AsyncConnection[DictRow].connect
        async with await connect(migrated_db_url, row_factory=dict_row, autocommit=True) as conn:
            yield conn

    app.dependency_overrides[get_conn] = test_conn
    yield TestClient(app)
    app.dependency_overrides.clear()


def add_member(db_url: str, project: str) -> str:
    member = make_user(db_url)
    with psycopg.connect(db_url, autocommit=True) as conn:
        conn.execute(
            "insert into project_members (project_id, user_id, role) values (%s, %s, 'member')", (project, member)
        )
    return member


def test_the_owner_renames_and_changes_the_default_branch(client, migrated_db_url):
    owner = make_user(migrated_db_url)
    project = make_project(migrated_db_url, owner)

    response = client.patch(
        f"/api/v1/projects/{project}",
        json={"name": "  Booking API ", "default_branch": "develop"},
        headers=bearer(owner),
    )

    assert response.status_code == 200
    assert (response.json()["name"], response.json()["default_branch"]) == ("Booking API", "develop")


@pytest.mark.parametrize("branch", ["../main", "/main", "feat//x/", "has space"])
def test_unsafe_branch_names_are_refused(client, migrated_db_url, branch):
    owner = make_user(migrated_db_url)
    project = make_project(migrated_db_url, owner)
    response = client.patch(f"/api/v1/projects/{project}", json={"default_branch": branch}, headers=bearer(owner))
    assert response.status_code == 422


def test_members_can_read_but_not_change_or_remove(client, migrated_db_url):
    owner = make_user(migrated_db_url)
    project = make_project(migrated_db_url, owner)
    member = add_member(migrated_db_url, project)

    assert client.get(f"/api/v1/projects/{project}", headers=bearer(member)).status_code == 200
    assert client.patch(f"/api/v1/projects/{project}", json={"name": "x"}, headers=bearer(member)).status_code == 403
    assert client.delete(f"/api/v1/projects/{project}", headers=bearer(member)).status_code == 403


def test_removing_a_project_removes_its_runs(client, migrated_db_url):
    owner = make_user(migrated_db_url)
    project = make_project(migrated_db_url, owner)
    make_run(migrated_db_url, project, owner)

    assert client.delete(f"/api/v1/projects/{project}", headers=bearer(owner)).status_code == 204
    assert client.get(f"/api/v1/projects/{project}", headers=bearer(owner)).status_code == 404
    with psycopg.connect(migrated_db_url) as conn:
        assert conn.execute("select count(*) from runs where project_id = %s", (project,)).fetchone() == (0,)


def test_activity_lists_events_from_every_run_newest_first(client, migrated_db_url):
    owner = make_user(migrated_db_url)
    project = make_project(migrated_db_url, owner)
    runs = [make_run(migrated_db_url, project, owner) for _ in range(2)]
    with psycopg.connect(migrated_db_url, autocommit=True) as conn:
        for i, run in enumerate(runs):
            conn.execute(
                """insert into run_events (run_id, seq, type, created_at)
                   values (%s, 1, 'step_done', now() + %s * interval '1 second')""",
                (run, i),
            )

    response = client.get(f"/api/v1/projects/{project}/activity", headers=bearer(owner))

    assert response.status_code == 200
    assert [item["run_id"] for item in response.json()] == [runs[1], runs[0]]
    assert (
        client.get(f"/api/v1/projects/{project}/activity", headers=bearer(make_user(migrated_db_url))).status_code
        == 404
    )


def test_projects_report_how_many_runs_they_have(client, migrated_db_url):
    owner = make_user(migrated_db_url)
    project = make_project(migrated_db_url, owner)
    make_run(migrated_db_url, project, owner)
    assert client.get(f"/api/v1/projects/{project}", headers=bearer(owner)).json()["run_count"] == 1
