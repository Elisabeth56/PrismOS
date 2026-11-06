# backend/api/deps.py
"""
Shared FastAPI dependencies used across route modules.
"""

from __future__ import annotations

from fastapi import Header

from app.db.supabase import get_supabase


async def get_db():
    """Provide the Supabase client to route handlers."""
    return get_supabase()


async def get_session_token(
    x_session_token: str | None = Header(None),
) -> str | None:
    """
    Extract the anonymous session token from the request header.
    Frontend stores a random UUID in localStorage and sends it as
    X-Session-Token so the dashboard can show 'your' past sessions.
    """
    return x_session_token
