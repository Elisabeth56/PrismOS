"""Creating, reading and cancelling runs. Every query is scoped to the caller's project memberships."""

from __future__ import annotations

import json
from uuid import UUID

from app.config import Settings
from app.database import Conn
from app.errors import AppError
from app.features.projects.logic import get_project
from app.features.runs.schemas import RunCreate, RunDetail, RunEventOut, RunOut

RUN_COLUMNS = """r.id, r.project_id, r.feature_request, r.base_branch, r.status::text as status, r.current_step,
                 r.verdict, r.pr_url, r.pr_number, r.error, r.tokens_in, r.tokens_out,
                 r.created_at, r.started_at, r.finished_at"""

# a run you can't see doesn't exist for you
MEMBER_RUN = f"""
    select {RUN_COLUMNS} from runs r
    join project_members m on m.project_id = r.project_id and m.user_id = %(user_id)s
    where r.id = %(run_id)s
"""

NOT_FOUND = AppError(404, "run_not_found", "That run doesn't exist or you don't have access to it.")


async def create_run(conn: Conn, user_id: str, body: RunCreate, settings: Settings) -> RunOut:
    """Queues a run and returns it straight away; the worker picks it up (ADR-004)."""
    project = await get_project(conn, user_id, body.project_id)

    # each run costs about 8 model calls on a free tier, so limits are per user and enforced here
    usage = await (
        await conn.execute(
            """select count(*) filter (where created_at > now() - interval '1 hour') as last_hour,
                      count(*) filter (where status in ('queued', 'running')) as active
               from runs where requested_by = %s""",
            (user_id,),
        )
    ).fetchone()
    assert usage is not None
    if usage["active"] >= settings.MAX_ACTIVE_RUNS:
        message = f"You already have {usage['active']} runs going. Wait for one to finish."
        raise AppError(429, "too_many_active_runs", message)
    if usage["last_hour"] >= settings.RUNS_PER_HOUR:
        message = f"You've started {settings.RUNS_PER_HOUR} runs in the last hour. Try again later."
        raise AppError(429, "rate_limited", message)

    files = [f.model_dump() for f in body.context_files]
    row = await (
        await conn.execute(
            f"""insert into runs (project_id, requested_by, feature_request, base_branch, context_files)
                values (%s, %s, %s, %s, %s)
                returning {RUN_COLUMNS.replace("r.", "")}""",
            (project.id, user_id, body.feature_request, body.base_branch or project.default_branch, json.dumps(files)),
        )
    ).fetchone()
    return RunOut.model_validate(row)


async def get_run(conn: Conn, user_id: str, run_id: UUID) -> RunDetail:
    run = await (await conn.execute(MEMBER_RUN, {"user_id": user_id, "run_id": run_id})).fetchone()
    if run is None:
        raise NOT_FOUND

    # latest attempt of each step wins (a revision stores build attempt 2 alongside attempt 1)
    steps = await (
        await conn.execute(
            "select distinct on (step) step, output from run_steps where run_id = %s order by step, attempt desc",
            (run_id,),
        )
    ).fetchall()
    conflicts = await (
        await conn.execute(
            """select c.id, c.label, c.item_id, c.kind, c.objections, d.ruling, d.rationale, d.owner
               from conflicts c left join decisions d on d.conflict_id = c.id
               where c.run_id = %s order by length(c.label), c.label""",
            (run_id,),
        )
    ).fetchall()
    changes = await (
        await conn.execute("select path, action, content from changes where run_id = %s order by path", (run_id,))
    ).fetchall()
    return RunDetail.model_validate(
        {**run, "steps": {s["step"]: s["output"] for s in steps}, "conflicts": conflicts, "changes": changes}
    )


async def list_runs(conn: Conn, user_id: str, project_id: UUID, limit: int = 50) -> list[RunOut]:
    await get_project(conn, user_id, project_id)
    rows = await (
        await conn.execute(
            f"select {RUN_COLUMNS} from runs r where r.project_id = %s order by r.created_at desc limit %s",
            (project_id, limit),
        )
    ).fetchall()
    return [RunOut.model_validate(row) for row in rows]


async def cancel_run(conn: Conn, user_id: str, run_id: UUID) -> RunOut:
    """Stops a queued or running run; the worker notices at its next step boundary."""
    row = await (
        await conn.execute(
            f"""update runs r set status = 'cancelled', finished_at = now()
                from project_members m
                where r.id = %(run_id)s and m.project_id = r.project_id and m.user_id = %(user_id)s
                  and r.status in ('queued', 'running')
                returning {RUN_COLUMNS}""",
            {"user_id": user_id, "run_id": run_id},
        )
    ).fetchone()
    if row is not None:
        return RunOut.model_validate(row)
    existing = await (await conn.execute(MEMBER_RUN, {"user_id": user_id, "run_id": run_id})).fetchone()
    if existing is None:
        raise NOT_FOUND
    raise AppError(409, "run_finished", f"This run is already {existing['status'].replace('_', ' ')}.")


async def list_events(conn: Conn, user_id: str, run_id: UUID, after: int = 0, limit: int = 500) -> list[RunEventOut]:
    """Events after a sequence number: the browser replays these, then follows Realtime for new ones (ADR-004)."""
    rows = await (
        await conn.execute(
            """select e.seq, e.type, e.payload, e.created_at from run_events e
               join runs r on r.id = e.run_id
               join project_members m on m.project_id = r.project_id and m.user_id = %(user_id)s
               where e.run_id = %(run_id)s and e.seq > %(after)s
               order by e.seq limit %(limit)s""",
            {"user_id": user_id, "run_id": run_id, "after": after, "limit": limit},
        )
    ).fetchall()
    if not rows and after == 0:
        # an empty stream is fine for a member, but an unknown or foreign run is a 404
        exists = await (await conn.execute(MEMBER_RUN, {"user_id": user_id, "run_id": run_id})).fetchone()
        if exists is None:
            raise NOT_FOUND
    return [RunEventOut.model_validate(row) for row in rows]
