"""What a pipeline step gets to work with, and the step cache that makes a run resumable.

Every finished step is stored in run_steps. When a run is retried after a crash, the pipeline runs from
the top again and each step it already finished returns its stored output instead of calling a model.
So every step must be safe to run twice: an interrupted step simply starts over.
"""

from __future__ import annotations

import json
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from psycopg_pool import AsyncConnectionPool
from pydantic import BaseModel

from app.ai.llm import Usage
from app.database import Conn


async def append_event(conn: Conn, run_id: str, type_: str, payload: dict[str, Any] | None = None) -> None:
    """Appends an event to the run's ordered stream."""
    async with conn.transaction():
        # critics run in parallel, so steps of one run can emit at the same moment: take turns per run
        await conn.execute("select pg_advisory_xact_lock(hashtextextended(%s, 0))", (run_id,))
        await conn.execute(
            """insert into run_events (run_id, seq, type, payload)
               select %s, coalesce(max(seq), 0) + 1, %s, %s from run_events where run_id = %s""",
            (run_id, type_, json.dumps(payload or {}), run_id),
        )


class RunCancelled(Exception):
    """The user cancelled the run; the pipeline stops at the next step boundary."""


@dataclass
class RunContext:
    run: dict[str, Any]
    pool: AsyncConnectionPool[Conn]

    @property
    def run_id(self) -> str:
        return str(self.run["id"])

    async def emit(self, type_: str, payload: dict[str, Any] | None = None) -> None:
        async with self.pool.connection() as conn:
            await append_event(conn, self.run_id, type_, payload)

    async def ensure_not_cancelled(self) -> None:
        async with self.pool.connection() as conn:
            row = await (await conn.execute("select status from runs where id = %s", (self.run_id,))).fetchone()
        if row is None or row["status"] == "cancelled":
            raise RunCancelled()

    async def cached_step[T: BaseModel](
        self,
        step: str,
        schema: type[T],
        produce: Callable[[], Awaitable[tuple[T, list[Usage]]]],
        *,
        attempt: int = 1,
    ) -> T:
        """Returns the stored output for this step, or produces it, stores it and returns it."""
        async with self.pool.connection() as conn:
            row = await (
                await conn.execute(
                    "select output from run_steps where run_id = %s and step = %s and attempt = %s",
                    (self.run_id, step, attempt),
                )
            ).fetchone()
        if row is not None:
            return schema.model_validate(row["output"])

        await self.ensure_not_cancelled()
        async with self.pool.connection() as conn:
            await conn.execute("update runs set current_step = %s where id = %s", (step, self.run_id))
        await self.emit("step_started", {"step": step, "attempt": attempt})

        result, usages = await produce()

        tokens_in, tokens_out = sum(u.tokens_in for u in usages), sum(u.tokens_out for u in usages)
        async with self.pool.connection() as conn, conn.transaction():
            # on conflict: a step that was produced twice (e.g. a duplicate worker) keeps the first output
            await conn.execute(
                """insert into run_steps (run_id, step, attempt, output, model, tokens_in, tokens_out, latency_ms)
                   values (%s, %s, %s, %s, %s, %s, %s, %s) on conflict (run_id, step, attempt) do nothing""",
                (
                    self.run_id,
                    step,
                    attempt,
                    result.model_dump_json(),
                    ",".join(u.model for u in usages) or None,
                    tokens_in,
                    tokens_out,
                    sum(u.latency_ms for u in usages),
                ),
            )
            await conn.execute(
                "update runs set tokens_in = tokens_in + %s, tokens_out = tokens_out + %s where id = %s",
                (tokens_in, tokens_out, self.run_id),
            )
        await self.emit("step_done", {"step": step, "attempt": attempt})
        return result


Pipeline = Callable[[RunContext], Awaitable[None]]
