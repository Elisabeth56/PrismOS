from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_ok():
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_existing_endpoints_are_registered():
    paths = TestClient(app).get("/openapi.json").json()["paths"]

    assert "/api/v1/runs" in paths
    assert "/api/v1/runs/{session_id}/stream" in paths
    assert "/api/v1/sessions" in paths
    assert "/api/v1/projects" in paths
