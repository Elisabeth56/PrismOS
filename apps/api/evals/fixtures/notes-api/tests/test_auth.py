def test_signup_then_login(client):
    client.post("/auth/signup", json={"email": "a@example.com", "password": "password123"})
    response = client.post("/auth/login", json={"email": "a@example.com", "password": "password123"})
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_wrong_password_is_rejected(client):
    client.post("/auth/signup", json={"email": "b@example.com", "password": "password123"})
    response = client.post("/auth/login", json={"email": "b@example.com", "password": "nope-nope"})
    assert response.status_code == 401
