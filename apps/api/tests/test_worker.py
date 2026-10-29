"""Worker: exactly-once claims, failure handling, reaping and resuming from the last finished step."""

import asyncio
from collections.abc import AsyncIterator

import psycopg
import pytest
from psycopg.rows import DictRow, dict_row
from psycopg_pool import AsyncConnectionPool
from pydantic import BaseModel

from app.ai.llm import LLMUnavailable, Usage
from app.database import Conn, create_pool
from app.pipeline.context import RunContext
from app.worker import Worker
from tests.conftest import needs_db
from tests.factories import make_project, make_run, make_user

pytestmark = needs_db
STALE = "update runs set status = 'running', attempts = %s, heartbeat_at = now() - interval '5 minutes' where id = %s"
USAGE = [Usage(model="test-model", tokens_in=10, tokens_out=5, latency_ms=1)]


class Out(BaseModel):
    value: str


@pytest.fixture
async def pool(migrated_db_url) -> AsyncIterator[AsyncConnectionPool[Conn]]:
    pool = create_pool(migrated_db_url)
    await pool.open()
    # each test sees only its own runs: park anything another test left queued
    async with pool.connection() as conn:
        await conn.execute("update runs set status = 'cancelled' where status in ('queued', 'running')")
    yield pool
    await pool.close()


@pytest.fixture
def run_id(migrated_db_url) -> str:
    user = make_user(migrated_db_url)
    return make_run(migrated_db_url, make_project(migrated_db_url, user), user)


def run_row(db_url: str, run_id: str) -> dict:
    with psycopg.Connection[DictRow].connect(db_url, row_factory=dict_row) as conn:
        row = conn.execute("select * from runs where id = %s", (run_id,)).fetchone()
    assert row is not None
    return row


def events(db_url: str, run_id: str) -> list[str]:
    with psycopg.connect(db_url) as conn:
        return [r[0] for r in conn.execute("select type from run_events where run_id = %s order by seq", (run_id,))]


async def test_two_workers_never_claim_the_same_run(pool, run_id):
    calls: list[str] = []

    async def pipeline(ctx: RunContext) -> None:
        calls.append(ctx.run_id)
        await asyncio.sleep(0.05)

    worked = await asyncio.gather(Worker(pool, pipeline).tick(), Worker(pool, pipeline).tick())

    assert sorted(worked) == [False, True]
    assert calls == [run_id]


async def test_a_failing_step_fails_the_run_with_a_safe_message(pool, run_id, migrated_db_url):
    async def pipeline(ctx: RunContext) -> None:
        await ctx.cached_step("plan", Out, lambda: _raise(RuntimeError("secret internals")))

    await Worker(pool, pipeline).tick()

    run = run_row(migrated_db_url, run_id)
    assert run["status"] == "failed"
    assert run["error"]["code"] == "step_failed"
    assert run["error"]["step"] == "plan"
    assert "secret internals" not in str(run["error"])
    assert events(migrated_db_url, run_id)[-1] == "run_failed"


async def test_provider_outage_is_reported_as_such(pool, run_id, migrated_db_url):
    async def pipeline(ctx: RunContext) -> None:
        raise LLMUnavailable("all down")

    await Worker(pool, pipeline).tick()

    assert run_row(migrated_db_url, run_id)["error"]["code"] == "models_unavailable"


async def test_a_retried_run_resumes_after_its_last_finished_step(pool, run_id, migrated_db_url):
    produced: list[str] = []
    crash_on_build = True

    async def produce(name: str):
        produced.append(name)
        if name == "build" and crash_on_build:
            raise RuntimeError("worker died mid-step")
        return Out(value=name), USAGE

    async def pipeline(ctx: RunContext) -> None:
        for step in ["plan", "review", "build"]:
            await ctx.cached_step(step, Out, lambda step=step: produce(step))

    await Worker(pool, pipeline).tick()
    with psycopg.connect(migrated_db_url, autocommit=True) as conn:
        conn.execute("update runs set status = 'queued' where id = %s", (run_id,))
    crash_on_build = False
    await Worker(pool, pipeline).tick()

    assert produced == ["plan", "review", "build", "build"]
    run = run_row(migrated_db_url, run_id)
    assert (run["attempts"], run["tokens_in"], run["tokens_out"]) == (2, 30, 15)


async def test_stale_runs_are_requeued_then_failed_after_too_many_attempts(pool, run_id, migrated_db_url):
    with psycopg.connect(migrated_db_url, autocommit=True) as conn:
        conn.execute(STALE, (1, run_id))
    worker = Worker(pool, _noop, stale_seconds=90, max_attempts=2)

    await worker.reap()
    assert run_row(migrated_db_url, run_id)["status"] == "queued"

    with psycopg.connect(migrated_db_url, autocommit=True) as conn:
        conn.execute(STALE, (2, run_id))
    await worker.reap()
    run = run_row(migrated_db_url, run_id)
    assert (run["status"], run["error"]["code"]) == ("failed", "worker_lost")


async def test_a_cancelled_run_stops_at_the_next_step(pool, run_id, migrated_db_url):
    produced: list[str] = []

    async def produce(name: str):
        produced.append(name)
        with psycopg.connect(migrated_db_url, autocommit=True) as conn:
            conn.execute("update runs set status = 'cancelled' where id = %s", (run_id,))
        return Out(value=name), USAGE

    async def pipeline(ctx: RunContext) -> None:
        for step in ["plan", "review"]:
            await ctx.cached_step(step, Out, lambda step=step: produce(step))

    await Worker(pool, pipeline).tick()

    assert produced == ["plan"]
    assert run_row(migrated_db_url, run_id)["status"] == "cancelled"


async def _noop(ctx: RunContext) -> None:
    return None


async def _raise(error: Exception):
    raise error


async def test_concurrent_events_get_distinct_ordered_seqs(pool, run_id, migrated_db_url):
    ctx = RunContext(run={"id": run_id}, pool=pool)

    await asyncio.gather(*(ctx.emit("tick", {"n": n}) for n in range(20)))

    with psycopg.connect(migrated_db_url) as conn:
        seqs = [r[0] for r in conn.execute("select seq from run_events where run_id = %s order by seq", (run_id,))]
    assert seqs == list(range(1, 21))
