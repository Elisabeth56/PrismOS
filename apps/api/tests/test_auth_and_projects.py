import time
import uuid
from collections.abc import AsyncIterator, Iterator

import jwt
import psycopg
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
from psycopg import AsyncConnection
from psycopg.rows import DictRow, dict_row

from app import auth
from app.database import get_conn
from app.main import app
from tests.conftest import DEMO_PROJECT, DEMO_USER, TEST_ENV, needs_db

SECRET = TEST_ENV["SUPABASE_JWT_SECRET"]


def token(sub: str = DEMO_USER, *, aud: str = "authenticated", expires_in: int = 3600, key: str = SECRET) -> str:
    claims = {"sub": sub, "aud": aud, "exp": int(time.time()) + expires_in, "email": "demo@prismos.dev"}
    return jwt.encode(claims, key, algorithm="HS256")


def bearer(value: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {value}"}


@pytest.fixture
def client(migrated_db_url) -> Iterator[TestClient]:
    async def test_conn() -> AsyncIterator[AsyncConnection[DictRow]]:
        connect = AsyncConnection[DictRow].connect
        async with await connect(migrated_db_url, row_factory=dict_row, autocommit=True) as conn:
            yield conn

    app.dependency_overrides[get_conn] = test_conn
    yield TestClient(app)
    app.dependency_overrides.clear()


# auth -------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("headers", "code"),
    [
        ({}, "not_signed_in"),
        ({"Authorization": "Basic abc"}, "not_signed_in"),
        (bearer("not-a-jwt"), "invalid_token"),
        (bearer(token(expires_in=-60)), "invalid_token"),
        (bearer(token(aud="anon")), "invalid_token"),
        (bearer(token(key="a-different-secret-that-is-32-bytes-long!")), "invalid_token"),
    ],
)
def test_requests_without_a_valid_session_get_401_in_the_shared_shape(headers, code):
    response = TestClient(app).get("/api/v1/projects", headers=headers)

    assert response.status_code == 401
    assert response.json()["error"]["code"] == code
    assert set(response.json()["error"]) == {"code", "message", "details"}


def test_asymmetric_tokens_are_verified_against_the_jwks(monkeypatch):
    private_key = ec.generate_private_key(ec.SECP256R1())

    class FakeJwks:
        def get_signing_key_from_jwt(self, _token):
            return type("Key", (), {"key": private_key.public_key()})()

    monkeypatch.setattr(auth, "_jwks_client", lambda _url: FakeJwks())
    claims = {"sub": DEMO_USER, "aud": "authenticated", "exp": int(time.time()) + 60}
    good = jwt.encode(claims, private_key, algorithm="ES256")
    forged = jwt.encode(claims, ec.generate_private_key(ec.SECP256R1()), algorithm="ES256")

    settings = auth.get_settings()
    assert auth.verify_token(good, settings).id == DEMO_USER
    with pytest.raises(auth.AppError):
        auth.verify_token(forged, settings)


# projects ---------------------------------------------------------------------


@needs_db
def test_member_lists_their_projects(client):
    response = client.get("/api/v1/projects", headers=bearer(token()))

    assert response.status_code == 200
    assert [p["id"] for p in response.json()] == [DEMO_PROJECT]
    assert response.json()[0]["role"] == "owner"
    assert response.json()[0]["last_run_at"] is not None


@needs_db
def test_other_users_get_an_empty_list_and_404s(client, migrated_db_url):
    outsider = str(uuid.uuid4())
    with psycopg.connect(migrated_db_url, autocommit=True) as conn:
        conn.execute("insert into auth.users (id, email) values (%s, %s)", (outsider, f"{outsider}@example.com"))

    assert client.get("/api/v1/projects", headers=bearer(token(outsider))).json() == []
    response = client.get(f"/api/v1/projects/{DEMO_PROJECT}", headers=bearer(token(outsider)))
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "project_not_found"


@needs_db
def test_malformed_project_id_is_a_validation_error(client):
    response = client.get("/api/v1/projects/not-a-uuid", headers=bearer(token()))

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_failed"
    assert "project_id" in response.json()["error"]["details"]["fields"]
