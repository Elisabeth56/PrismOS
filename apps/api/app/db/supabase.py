# backend/db/supabase.py
"""
Supabase client — singleton for the backend.

Uses the SERVICE_ROLE_KEY (not anon key) so we have full read/write
access without RLS restrictions. Safe for backend-only use.
"""

from __future__ import annotations

import logging
from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings

logger = logging.getLogger("prismos.db")


@lru_cache
def get_supabase() -> Client:
    """Return a cached Supabase client instance."""
    settings = get_settings()

    url = str(settings.SUPABASE_URL).rstrip("/")
    client = create_client(url, settings.SUPABASE_SERVICE_ROLE_KEY.get_secret_value())
    logger.info("Supabase client initialised for %s", url)
    return client
