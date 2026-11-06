import os

DATABASE_PATH = os.environ.get("DATABASE_PATH", "notes.db")
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
TOKEN_TTL_SECONDS = 60 * 60 * 24
