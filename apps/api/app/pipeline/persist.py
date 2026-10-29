"""Writes pipeline results to the tables the web app reads. Every write is idempotent, because a resumed run
replays its steps from the cache and calls these again.
"""

from __future__ import annotations

import json

from app.database import Conn
from app.pipeline.outputs import FileChange, VerifierOutput
from app.pipeline.review import Conflict, Decision

MEMORY_LIMIT = 10


async def load_memory(conn: Conn, project_id: str) -> list[dict[str, str]]:
    """The project's most recent decisions and shipped features, newest first."""
    rows = await (
        await conn.execute(
            """select kind, title, content from memory_entries where project_id = %s
               order by created_at desc limit %s""",
            (project_id, MEMORY_LIMIT),
        )
    ).fetchall()
    return [dict(row) for row in rows]


async def save_conflicts(conn: Conn, run_id: str, conflicts: list[Conflict]) -> None:
    async with conn.transaction():
        for conflict in conflicts:
            await conn.execute(
                """insert into conflicts (run_id, label, item_id, kind, objections) values (%s, %s, %s, %s, %s)
                   on conflict (run_id, label) do update
                   set item_id = excluded.item_id, kind = excluded.kind, objections = excluded.objections""",
                (
                    run_id,
                    conflict.id,
                    conflict.item_id,
                    conflict.kind,
                    json.dumps([o.model_dump() for o in conflict.objections]),
                ),
            )


async def save_decisions(conn: Conn, run_id: str, decisions: list[Decision]) -> None:
    async with conn.transaction():
        for decision in decisions:
            await conn.execute(
                """insert into decisions (conflict_id, run_id, ruling, rationale, owner)
                   select id, run_id, %s, %s, %s from conflicts where run_id = %s and label = %s
                   on conflict (conflict_id) do update
                   set ruling = excluded.ruling, rationale = excluded.rationale, owner = excluded.owner""",
                (decision.ruling, decision.rationale, ",".join(decision.owners) or None, run_id, decision.conflict_id),
            )


async def save_changes(conn: Conn, run_id: str, changes: list[FileChange]) -> None:
    """Replaces the run's change set with the latest build."""
    async with conn.transaction():
        await conn.execute("delete from changes where run_id = %s", (run_id,))
        for change in changes:
            await conn.execute(
                "insert into changes (run_id, path, action, content) values (%s, %s, %s, %s)",
                (run_id, change.path, change.action, change.content),
            )


async def mark_ready(conn: Conn, run_id: str, verdict: VerifierOutput) -> bool:
    """Hands the run to the user for approval. False when it was cancelled in the meantime."""
    row = await (
        await conn.execute(
            """update runs set status = 'awaiting_approval', verdict = %s, current_step = null
               where id = %s and status = 'running' returning id""",
            (verdict.verdict, run_id),
        )
    ).fetchone()
    return row is not None
