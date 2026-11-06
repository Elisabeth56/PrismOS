def test_create_and_list(client, auth_headers):
    client.post("/notes", json={"title": "Groceries", "tags": ["home"]}, headers=auth_headers)
    notes = client.get("/notes", headers=auth_headers).json()
    assert [n["title"] for n in notes] == ["Groceries"]
    assert notes[0]["tags"] == ["home"]


def test_notes_are_private(client, auth_headers):
    note = client.post("/notes", json={"title": "Mine"}, headers=auth_headers).json()
    other = client.post("/auth/signup", json={"email": "eve@example.com", "password": "password123"}).json()
    response = client.get(f"/notes/{note['id']}", headers={"Authorization": f"Bearer {other['access_token']}"})
    assert response.status_code == 404
