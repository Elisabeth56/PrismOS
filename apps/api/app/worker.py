"""The run worker (ADR-004). Lives in the API process on the free tier, but holds no state of its own:
everything it needs to pick a run back up is in Postgres, so any number of workers can run side by side.
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import logging
from dataclasses import dataclass
from typing import Any

from psycopg_pool import AsyncConnectionPool

from app.ai.llm import LLMOutputInvalid, LLMUnavailable
from app.database import Conn
from app.pipeline.context import Pipeline, RunCancelled, RunContext
from app.pipeline.repo import RepoUnavailable

logger = logging.getLogger("prismos.worker")

# claim the oldest queued run; SKIP LOCKED means two workers can never take the same one
CLAIM_SQL = """
    update runs set status = 'running', attempts = attempts + 1, heartbeat_at = now(),
                    started_at = coalesce(started_at, now()), error = null
    where id = (
        select id from runs where status = 'queued' order by created_at for update skip locked limit 1
    )
    returning *
"""

# runs whose worker stopped sending heartbeats go back in the queue, or fail after too many tries
REAP_SQL = """
    update runs
    set status = case when attempts >= %(max_attempts)s then 'failed'::run_status else 'queued'::run_status end,
        error = case when attempts >= %(max_attempts)s
                     then '{"code": "worker_lost", "message": "The run stopped responding too many times."}'::jsonb
                     else error end,
        finished_at = case when attempts >= %(max_attempts)s then now() else finished_at end
    where status = 'running' and heartbeat_at < now() - make_interval(secs => %(stale)s)
    returning id, status
"""


@dataclass
class Worker:
    pool: AsyncConnectionPool[Conn]
    pipeline: Pipeline
    poll_seconds: float = 2.0
    heartbeat_seconds: float = 15.0
    stale_seconds: float = 90.0
    max_attempts: int = 3

    async def run_forever(self, stop: asyncio.Event) -> None:
        """Reap, claim, process, repeat until stopped. One run at a time per worker."""
        while not stop.is_set():
            try:
                await self.reap()
                worked = await self.tick()
            except Exception:
                logger.exception("worker loop error")
                worked = False
            if not worked:
                with contextlib.suppress(TimeoutError):
                    await asyncio.wait_for(stop.wait(), timeout=self.poll_seconds)

    async def tick(self) -> bool:
        """Claims and processes one run. Returns False when the queue was empty."""
        async with self.pool.connection() as conn:
            run = await (await conn.execute(CLAIM_SQL)).fetchone()
        if run is None:
            return False
        await self.process(run)
        return True

    async def reap(self) -> list[dict[str, Any]]:
        async with self.pool.connection() as conn:
            rows = await (
                await conn.execute(REAP_SQL, {"max_attempts": self.max_attempts, "stale": self.stale_seconds})
            ).fetchall()
        for row in rows:
            logger.warning("reaped stale run %s -> %s", row["id"], row["status"])
        return rows

    async def process(self, run: dict[str, Any]) -> None:
        ctx = RunContext(run=run, pool=self.pool)
        heartbeat = asyncio.create_task(self._heartbeat(ctx.run_id))
        logger.info("run %s started, attempt %d", ctx.run_id, run["attempts"])
        try:
            await self.pipeline(ctx)
        except RunCancelled:
            logger.info("run %s cancelled", ctx.run_id)
        except Exception as error:
            await self._fail(ctx, error)
        finally:
            heartbeat.cancel()

    async def _heartbeat(self, run_id: str) -> None:
        while True:
            await asyncio.sleep(self.heartbeat_seconds)
            async with self.pool.connection() as conn:
                await conn.execute(
                    "update runs set heartbeat_at = now() where id = %s and status = 'running'", (run_id,)
                )

    async def _fail(self, ctx: RunContext, error: Exception) -> None:
        """Marks the run failed with a message the user can act on; details stay in the logs."""
        logger.exception("run %s failed at %s", ctx.run_id, ctx.run.get("current_step"), exc_info=error)
        if isinstance(error, LLMUnavailable):
            body = {"code": "models_unavailable", "message": "The AI providers are rate-limited or down. Retry later."}
        elif isinstance(error, RepoUnavailable):
            body = {
                "code": "repo_unavailable",
                "message": "Couldn't read the repository. Check the branch exists and PrismOS has access to it.",
            }
        elif isinstance(error, LLMOutputInvalid):
            body = {"code": "model_output_invalid", "message": "A step returned unusable output twice. Retry the run."}
        else:
            body = {"code": "step_failed", "message": "A step failed unexpectedly. Retry the run."}
        async with self.pool.connection() as conn:
            row = await (
                await conn.execute(
                    """update runs set status = 'failed', finished_at = now(),
                              error = %s::jsonb || jsonb_build_object('step', current_step)
                       where id = %s and status = 'running' returning current_step""",
                    (json.dumps(body), ctx.run_id),
                )
            ).fetchone()
        if row is not None:
            await ctx.emit("run_failed", {**body, "step": row["current_step"]})
