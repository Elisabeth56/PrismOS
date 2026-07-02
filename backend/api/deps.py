# backend/api/deps.py
"""
Shared FastAPI dependencies used across route modules.
"""

from __future__ import annotations

from typing import Optional

from fastapi import Header

from db.supabase import get_supabase


async def get_db():
    """Provide the Supabase client to route handlers."""
    return get_supabase()


async def get_session_token(
    x_session_token: Optional[str] = Header(None),
) -> Optional[str]:
    """
    Extract the anonymous session token from the request header.
    Frontend stores a random UUID in localStorage and sends it as
    X-Session-Token so the dashboard can show 'your' past sessions.
    """
    return x_session_token
