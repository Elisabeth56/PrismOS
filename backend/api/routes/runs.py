# backend/api/routes/runs.py
"""
Run endpoints:
  POST /api/v1/runs              — Start a new agent run
  GET  /api/v1/runs/{id}/stream  — SSE stream for a running session
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request
from fastapi.responses import StreamingResponse

from api.deps import get_db, get_session_token
from config import get_settings
from db import queries
from db.models import (
    CreateRunRequest,
    CreateRunResponse,
    SessionRow,
)
from orchestration.graph import run_pipeline
from orchestration.streaming import (
    event_bus,
    format_sse,
    KEEPALIVE_COMMENT,
)

logger = logging.getLogger("prismos.routes.runs")
router = APIRouter()
settings = get_settings()


@router.post("/runs", status_code=202, response_model=CreateRunResponse)
async def create_run(
    body: CreateRunRequest,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
    session_token: Optional[str] = Depends(get_session_token),
):
    """
    Start a new agent run.

    1. Validate context inputs (file count / size limits)
    2. Create session row in Supabase
    3. Kick off orchestration in background (Phase 6)
    4. Return session_id + stream_url immediately
    """
    # ── Validate context inputs ──────────────────────────────────────────
    ctx = body.context_inputs
    if ctx and ctx.file_contents:
        if len(ctx.file_contents) > settings.MAX_FILE_COUNT:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum {settings.MAX_FILE_COUNT} files allowed",
            )
        for f in ctx.file_contents:
            if len(f.content.encode("utf-8")) > settings.MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=400,
                    detail=f"File '{f.filename}' exceeds {settings.MAX_FILE_SIZE_BYTES // 1024}KB limit",
                )

    # ── Determine if context was provided ────────────────────────────────
    context_provided = bool(
        ctx
        and any([
            ctx.github_url,
            ctx.file_contents,
            ctx.screenshot_urls,
            ctx.product_url,
            ctx.description,
            ctx.stack_info,
        ])
    )

    # ── Create session ───────────────────────────────────────────────────
    session_id = str(uuid.uuid4())
    row = SessionRow(
        id=session_id,
        project_id=body.project_id,
        session_token=session_token,
        feature_request=body.feature_request,
        feature_classification=body.feature_classification,
        context_provided=context_provided,
        step_completed=0,
        status="running",
    )

    try:
        await queries.create_session(db, row)
    except Exception as e:
        logger.error("Failed to create session: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create session")

    # ── Update project last_run_at ───────────────────────────────────────
    if body.project_id:
        try:
            await queries.update_project(
                db,
                body.project_id,
                {"last_run_at": "now()"},
            )
        except Exception:
            logger.warning("Failed to update project last_run_at")

    # ── Kick off orchestration ────────────────────────────────────────────
    background_tasks.add_task(
        run_pipeline,
        session_id=session_id,
        user_input=body.feature_request,
        feature_classification=body.feature_classification,
        context_inputs=(
            body.context_inputs.model_dump() if body.context_inputs else {}
        ),
        project_id=body.project_id,
        mode=body.mode,
    )
    logger.info("Run created and pipeline launched: session_id=%s", session_id)

    stream_url = f"/api/v1/runs/{session_id}/stream"
    return CreateRunResponse(session_id=session_id, stream_url=stream_url)


@router.get("/runs/{session_id}/stream")
async def stream_run(request: Request, session_id: str, db=Depends(get_db)):
    """
    SSE stream endpoint. Frontend connects with EventSource.

    Subscribes to the session's event bus queue and yields formatted
    SSE frames. Sends a keepalive comment every 15 seconds to prevent
    proxy/browser timeouts. Cleans up on client disconnect.
    """
    # Verify session exists
    session = await queries.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    async def event_generator():
        queue = event_bus.subscribe(session_id)
        try:
            while True:
                try:
                    # Wait for next event with a 15s timeout for keepalive
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                except asyncio.TimeoutError:
                    # Send keepalive comment to keep connection alive
                    yield KEEPALIVE_COMMENT
                    continue

                if event is None:
                    # Stream complete sentinel
                    break

                yield format_sse(event["event"], event["data"])
        except asyncio.CancelledError:
            # Client disconnected
            logger.info("SSE client disconnected: session=%s", session_id)
        finally:
            event_bus.unsubscribe(session_id, queue)

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    origin = request.headers.get("origin")
    if origin and (origin in settings.cors_origins_list or "*" in settings.cors_origins_list):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers=headers,
    )
