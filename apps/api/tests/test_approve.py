"""Approving a run opens exactly one pull request, built from the stored changes."""

import json
from collections.abc import AsyncIterator, Iterator

import httpx
import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg import AsyncConnection
from psycopg.rows import DictRow, dict_row

from app.database import get_conn
from app.features.github.router import github_transport
from app.features.runs.approve import pr_title
from app.github.app import GitHubApp, get_github_app
from app.main import app
from tests.conftest import needs_db
from tests.factories import bearer, make_project, make_run, make_user
from tests.test_github_app import PEM

pytestmark = needs_db


class FakeGitHub:
    """Just enough of the Git Data and Pulls APIs, recording what was written."""

    def __init__(self, *, branch_exists: bool = False, fail_pulls: int | None = None):
        self.branch_exists = branch_exists
        self.fail_pulls = fail_pulls
        self.requests: list[tuple[str, str, dict]] = []
        self.pulls_opened = 0

    def __call__(self, request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content) if request.content else {}
        self.requests.append((request.method, request.url.path, body))
        path, method = request.url.path, request.method
        if path.endswith("/access_tokens"):
            return httpx.Response(201, json={"token": "ghs_x", "expires_at": "2999-01-01T00:00:00Z"})
        if method == "GET" and "/git/commits/" in path:
            return httpx.Response(200, json={"sha": "base", "tree": {"sha": "basetree"}})
        if path.endswith("/git/trees"):
            return httpx.Response(201, json={"sha": "newtree"})
        if path.endswith("/git/commits"):
            return httpx.Response(201, json={"sha": "newcommit"})
        if path.endswith("/git/refs"):
            return httpx.Response(422 if self.branch_exists else 201, json={})
        if method == "PATCH":
            return httpx.Response(200, json={})
        if path.endswith("/pulls") and method == "POST":
            if self.fail_pulls:
                return httpx.Response(self.fail_pulls, json={})
            self.pulls_opened += 1
            return httpx.Response(201, json={"html_url": "https://github.com/acme/app/pull/12", "number": 12})
        raise AssertionError(f"unexpected {method} {path}")


@pytest.fixture
def github() -> FakeGitHub:
    return FakeGitHub()


@pytest.fixture
def client(migrated_db_url, github) -> Iterator[TestClient]:
    async def test_conn() -> AsyncIterator[AsyncConnection[DictRow]]:
        connect = AsyncConnection[DictRow].connect
        async with await connect(migrated_db_url, row_factory=dict_row, autocommit=True) as conn:
            yield conn

    app.dependency_overrides[get_conn] = test_conn
    app.dependency_overrides[github_transport] = lambda: httpx.MockTransport(github)
    app.dependency_overrides[get_github_app] = lambda: GitHubApp("1", PEM, transport=httpx.MockTransport(github))
    yield TestClient(app)
    app.dependency_overrides.clear()


def ready_run(db_url: str, *, status: str = "awaiting_approval", installed: bool = True) -> tuple[str, str]:
    user = make_user(db_url)
    project = make_project(db_url, user)
    run = make_run(db_url, project, user, status=status, verdict="verified")
    with psycopg.connect(db_url, autocommit=True) as conn:
        if installed:
            conn.execute("update projects set github_installation_id = 7 where id = %s", (project,))
        for step, output in [
            ("read_repo", {"commit_sha": "base", "paths": ["app.py"]}),
            ("plan", {"summary": "s", "items": [{"id": "1", "text": "Do the thing."}]}),
            ("build", {"summary": "Did the thing.", "changes": []}),
        ]:
            conn.execute(
                "insert into run_steps (run_id, step, attempt, output) values (%s, %s, 1, %s)",
                (run, step, json.dumps(output)),
            )
        conn.execute(
            "insert into changes (run_id, path, action, content) values (%s, 'app.py', 'modify', 'x = 1\n'), "
            "(%s, 'old.py', 'delete', null)",
            (run, run),
        )
    return user, run


def approve(client: TestClient, user: str, run: str):
    return client.post(f"/api/v1/runs/{run}/approve", headers=bearer(user))


def test_approving_commits_the_changes_and_opens_a_pr(client, github, migrated_db_url):
    user, run = ready_run(migrated_db_url)

    response = approve(client, user, run)

    assert response.status_code == 200
    body = response.json()
    assert (body["status"], body["pr_number"]) == ("pr_opened", 12)
    tree = next(b for m, p, b in github.requests if p.endswith("/git/trees"))
    assert tree["base_tree"] == "basetree"
    assert {"path": "app.py", "mode": "100644", "type": "blob", "content": "x = 1\n"} in tree["tree"]
    assert {"path": "old.py", "mode": "100644", "type": "blob", "sha": None} in tree["tree"]
    pull = next(b for m, p, b in github.requests if p.endswith("/pulls"))
    assert pull["head"] == f"prismos/run-{run[:8]}" and "Did the thing." in pull["body"]


def test_approving_twice_opens_one_pr(client, github, migrated_db_url):
    user, run = ready_run(migrated_db_url)

    first, second = approve(client, user, run), approve(client, user, run)

    assert first.json()["pr_url"] == second.json()["pr_url"]
    assert github.pulls_opened == 1


def test_a_retry_after_a_half_finished_attempt_reuses_the_branch(client, migrated_db_url):
    github = FakeGitHub(branch_exists=True)
    app.dependency_overrides[get_github_app] = lambda: GitHubApp("1", PEM, transport=httpx.MockTransport(github))
    app.dependency_overrides[github_transport] = lambda: httpx.MockTransport(github)
    user, run = ready_run(migrated_db_url)

    assert approve(client, user, run).status_code == 200
    assert any(m == "PATCH" for m, _, _ in github.requests)


@pytest.mark.parametrize(
    ("setup", "status", "code"),
    [
        ({"status": "running"}, 409, "run_not_ready"),
        ({"installed": False}, 409, "github_not_connected"),
    ],
)
def test_runs_that_cant_be_approved_say_why(client, migrated_db_url, setup, status, code):
    user, run = ready_run(migrated_db_url, **setup)

    response = approve(client, user, run)

    assert (response.status_code, response.json()["error"]["code"]) == (status, code)


def test_github_refusing_leaves_the_run_approvable(client, migrated_db_url):
    github = FakeGitHub(fail_pulls=403)
    app.dependency_overrides[github_transport] = lambda: httpx.MockTransport(github)
    app.dependency_overrides[get_github_app] = lambda: GitHubApp("1", PEM, transport=httpx.MockTransport(github))
    user, run = ready_run(migrated_db_url)

    response = approve(client, user, run)

    assert (response.status_code, response.json()["error"]["code"]) == (502, "github_failed")
    with psycopg.connect(migrated_db_url) as conn:
        assert conn.execute("select status from runs where id = %s", (run,)).fetchone() == ("awaiting_approval",)


def test_someone_elses_run_is_not_found(client, migrated_db_url):
    _, run = ready_run(migrated_db_url)
    assert approve(client, make_user(migrated_db_url), run).status_code == 404


def test_titles_are_one_line_and_short():
    assert pr_title("Add  rate\nlimiting") == "Add rate limiting"
    assert len(pr_title("x" * 200)) == 72


def test_an_opened_pr_is_remembered_for_the_next_run(client, migrated_db_url):
    user, run = ready_run(migrated_db_url)

    approve(client, user, run)

    with psycopg.connect(migrated_db_url) as conn:
        rows = conn.execute("select kind, content from memory_entries where run_id = %s", (run,)).fetchall()
    assert rows == [("shipped_feature", "Did the thing.")]
