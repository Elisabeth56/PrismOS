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

from config import get_settings

logger = logging.getLogger("prismos.db")


@lru_cache()
def get_supabase() -> Client:
    """Return a cached Supabase client instance."""
    settings = get_settings()

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        logger.warning(
            "Supabase credentials not configured — "
            "DB operations will fail until SUPABASE_URL and "
            "SUPABASE_SERVICE_ROLE_KEY are set in .env"
        )

    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY,
    )
    logger.info("Supabase client initialised for %s", settings.SUPABASE_URL)
    return client
