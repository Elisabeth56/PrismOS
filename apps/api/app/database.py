"""Postgres connection pool for the API and worker.

They connect directly rather than through PostgREST: the worker needs row locks and transactions,
and every API query is scoped to the caller's projects in SQL. RLS still guards the browser's reads.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from fastapi import Request
from psycopg import AsyncConnection
from psycopg.rows import DictRow, dict_row
from psycopg_pool import AsyncConnectionPool

Conn = AsyncConnection[DictRow]


def create_pool(url: str) -> AsyncConnectionPool[Conn]:
    """A small pool; free-tier Postgres allows few connections. Opened in the app lifespan."""
    return AsyncConnectionPool(
        url,
        min_size=1,
        max_size=5,
        open=False,
        connection_class=AsyncConnection[DictRow],
        # prepare_threshold=None keeps it working behind Supabase's pooler
        kwargs={"row_factory": dict_row, "autocommit": True, "prepare_threshold": None},
    )


async def get_conn(request: Request) -> AsyncIterator[Conn]:
    """FastAPI dependency: one pooled connection per request."""
    pool: AsyncConnectionPool[Conn] = request.app.state.pool
    async with pool.connection() as conn:
        yield conn
