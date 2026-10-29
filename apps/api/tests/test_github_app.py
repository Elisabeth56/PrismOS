"""GitHub App auth and attaching a repository: who may attach what, checked with the user's own GitHub token."""

import uuid
from collections.abc import AsyncIterator, Iterator

import httpx
import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from psycopg import AsyncConnection
from psycopg.rows import DictRow, dict_row

from app.database import get_conn
from app.features.github.router import github_transport
from app.github.app import GitHubApp
from app.main import app
from tests.conftest import needs_db
from tests.factories import bearer, make_user

KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
PEM = KEY.private_bytes(
    serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
).decode()


def github(user_token: str = "ghu_ok", repos: list[str] | None = None) -> httpx.MockTransport:
    """GitHub's user endpoints: installation 7 covers `repos` for the holder of `user_token`."""
    repos = repos if repos is not None else ["acme/notes"]

    def handler(request: httpx.Request) -> httpx.Response:
        if request.headers["Authorization"] != f"Bearer {user_token}":
            return httpx.Response(401)
        if request.url.path == "/user/installations":
            return httpx.Response(200, json={"installations": [{"id": 7}]})
        assert request.url.path == "/user/installations/7/repositories"
        return httpx.Response(
            200,
            json={"repositories": [{"full_name": r, "default_branch": "trunk", "private": True} for r in repos]},
        )

    return httpx.MockTransport(handler)


@pytest.fixture
def client(migrated_db_url) -> Iterator[TestClient]:
    async def test_conn() -> AsyncIterator[AsyncConnection[DictRow]]:
        connect = AsyncConnection[DictRow].connect
        async with await connect(migrated_db_url, row_factory=dict_row, autocommit=True) as conn:
            yield conn

    app.dependency_overrides[get_conn] = test_conn
    app.dependency_overrides[github_transport] = lambda: github()
    yield TestClient(app)
    app.dependency_overrides.clear()


def attach(client: TestClient, user: str, *, repo: str | None = None, installation: int = 7, token: str = "ghu_ok"):
    # a unique repo per test keeps tests independent in the shared database
    body = {"installation_id": installation, "repo_full_name": repo or "acme/notes"}
    return client.post("/api/v1/projects", json=body, headers={**bearer(user), "X-GitHub-Token": token})


def test_app_jwt_is_signed_with_the_private_key_and_short_lived():
    claims = jwt.decode(GitHubApp("123", PEM).app_jwt(), KEY.public_key(), algorithms=["RS256"])
    assert claims["iss"] == "123"
    assert 0 < claims["exp"] - claims["iat"] <= 600


async def test_installation_tokens_are_scoped_to_one_repo_and_reused():
    calls: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(201, json={"token": "ghs_1", "expires_at": "2999-01-01T00:00:00Z"})

    gh = GitHubApp("123", PEM, transport=httpx.MockTransport(handler))

    assert await gh.installation_token(7, "acme/notes") == "ghs_1"
    assert await gh.installation_token(7, "acme/notes") == "ghs_1"
    assert len(calls) == 1
    assert calls[0].url.path == "/app/installations/7/access_tokens"
    assert b'"repositories":["notes"]' in calls[0].content


@needs_db
def test_listing_repositories_uses_the_users_github_token(client, migrated_db_url):
    response = client.get(
        "/api/v1/github/repositories", headers={**bearer(make_user(migrated_db_url)), "X-GitHub-Token": "ghu_ok"}
    )
    assert response.status_code == 200
    assert response.json() == [
        {"installation_id": 7, "full_name": "acme/notes", "default_branch": "trunk", "private": True}
    ]


@needs_db
def test_a_reachable_repo_becomes_a_project_owned_by_the_user(client, migrated_db_url):
    repo = f"acme/notes-{uuid.uuid4().hex[:8]}"
    app.dependency_overrides[github_transport] = lambda: github(repos=[repo])

    response = attach(client, make_user(migrated_db_url), repo=repo)

    assert response.status_code == 201
    body = response.json()
    assert (body["repo_full_name"], body["default_branch"], body["role"]) == (repo, "trunk", "owner")


@needs_db
@pytest.mark.parametrize(
    ("kwargs", "status", "code"),
    [
        ({"installation": 8}, 403, "repo_not_accessible"),  # someone else's installation id
        ({"repo": "victim/private"}, 403, "repo_not_accessible"),  # a repo the installation doesn't cover
        ({"token": "ghu_expired"}, 401, "github_token_expired"),
    ],
)
def test_attaching_is_refused_unless_github_confirms_access(client, migrated_db_url, kwargs, status, code):
    response = attach(client, make_user(migrated_db_url), **kwargs)

    assert response.status_code == status
    assert response.json()["error"]["code"] == code


@needs_db
def test_the_same_repo_cant_be_attached_twice(client, migrated_db_url):
    repo = f"acme/notes-{uuid.uuid4().hex[:8]}"
    app.dependency_overrides[github_transport] = lambda: github(repos=[repo])
    user = make_user(migrated_db_url)

    assert attach(client, user, repo=repo).status_code == 201
    assert attach(client, user, repo=repo).json()["error"]["code"] == "project_exists"


@needs_db
def test_a_missing_github_token_says_how_to_fix_it(client, migrated_db_url):
    response = client.get("/api/v1/github/repositories", headers=bearer(make_user(migrated_db_url)))
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "github_token_missing"
