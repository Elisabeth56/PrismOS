"""Memory reads stay inside their budget."""

import psycopg

from app.database import create_pool
from app.pipeline.persist import MEMORY_CHARS, load_memory
from tests.conftest import needs_db
from tests.factories import make_project, make_user


@needs_db
async def test_memory_is_capped_and_newest_first(migrated_db_url):
    project = make_project(migrated_db_url, make_user(migrated_db_url))
    with psycopg.connect(migrated_db_url, autocommit=True) as conn:
        for n in range(8):
            conn.execute(
                """insert into memory_entries (project_id, kind, title, content, created_at)
                   values (%s, 'decision', %s, %s, now() - make_interval(mins => %s))""",
                (project, f"rule {n}", "x" * 3000, n),
            )
    pool = create_pool(migrated_db_url)
    await pool.open()
    async with pool.connection() as conn:
        entries = await load_memory(conn, project)
    await pool.close()

    assert [e["title"] for e in entries] == ["rule 0", "rule 1"]
    assert sum(len(e["title"]) + len(e["content"]) for e in entries) <= MEMORY_CHARS
