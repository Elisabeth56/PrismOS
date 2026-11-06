import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr("app.db.DATABASE_PATH", str(tmp_path / "test.db"))
    from app.main import app

    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    token = client.post("/auth/signup", json={"email": "ada@example.com", "password": "correct-horse"}).json()
    return {"Authorization": f"Bearer {token['access_token']}"}
