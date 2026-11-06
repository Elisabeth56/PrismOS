# Notes API

A small notes service: sign up, log in, and keep private notes with tags. FastAPI and SQLite.

## Endpoints

| Method | Path | What it does |
|---|---|---|
| POST | /auth/signup | Create an account |
| POST | /auth/login | Exchange email and password for a token |
| GET | /notes | List your notes, newest first |
| POST | /notes | Create a note |
| GET | /notes/{id} | Read one note |
| PATCH | /notes/{id} | Edit a note |
| DELETE | /notes/{id} | Delete a note |

## Run

    uv sync
    uv run uvicorn app.main:app --reload
    uv run pytest
