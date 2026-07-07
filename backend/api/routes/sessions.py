# backend/api/routes/sessions.py
"""
Session endpoints:
  GET /api/v1/sessions           — List past sessions
  GET /api/v1/sessions/{id}      — Full session detail
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_db, get_session_token
from db import queries
from db.models import (
    ProductContextSummary,
    SessionDetailResponse,
    SessionListResponse,
    SessionSummary,
)

logger = logging.getLogger("prismos.routes.sessions")
router = APIRouter()


@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions(
    project_id: Optional[str] = None,
    db=Depends(get_db),
    session_token: Optional[str] = Depends(get_session_token),
):
    """
    List past sessions, filtered by the anonymous X-Session-Token header
    so each browser only sees its own history, and optionally filtered by project_id.
    """
    rows = await queries.list_sessions(db, session_token=session_token, project_id=project_id)

    session_ids = [r["id"] for r in rows]
    conflict_counts = {}
    if session_ids:
        conflicts = db.table("conflict_logs").select("session_id").in_("session_id", session_ids).execute().data
        for c in (conflicts or []):
            sid = c["session_id"]
            conflict_counts[sid] = conflict_counts.get(sid, 0) + 1

    sessions = []
    for r in rows:
        created_at = r.get("created_at")
        completed_at = r.get("completed_at")
        duration = 0
        if created_at and completed_at:
            from datetime import datetime
            try:
                c = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                f = datetime.fromisoformat(completed_at.replace("Z", "+00:00"))
                duration = int((f - c).total_seconds())
            except Exception:
                pass

        sessions.append(
            SessionSummary(
                id=r["id"],
                feature_request=r["feature_request"],
                feature_classification=r.get("feature_classification"),
                verdict=r.get("verdict"),
                created_at=created_at,
                step_completed=r.get("step_completed", 0),
                context_provided=r.get("context_provided", False),
                conflicts_resolved=conflict_counts.get(r["id"], 0),
                run_duration_seconds=duration,
            )
        )

    return SessionListResponse(sessions=sessions)


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
async def get_session_detail(
    session_id: str,
    db=Depends(get_db),
):
    """
    Full session detail including product context, all agent outputs,
    conflicts, and benchmark data.
    """
    session = await queries.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # ── Fetch related data in parallel-ish (Supabase is sync under the hood) ─
    product_ctx_row = None
    try:
        product_ctx_row = await queries.get_product_context(db, session_id)
    except Exception:
        pass

    agent_outputs = await queries.get_agent_outputs(db, session_id)
    conflict_logs = await queries.get_conflict_logs(db, session_id)

    benchmark_row = None
    try:
        benchmark_row = await queries.get_benchmark_record(db, session_id)
    except Exception:
        pass

    # ── Build product context summary ────────────────────────────────────
    product_context = None
    if product_ctx_row:
        product_context = ProductContextSummary(
            product_type=product_ctx_row.get("product_type") or "",
            core_existing_features=[],
            frontend_stack=product_ctx_row.get("frontend_stack") or "",
            backend_stack=product_ctx_row.get("backend_stack") or "",
            database_models=product_ctx_row.get("database_models") or [],
            current_api_routes=product_ctx_row.get("current_api_routes") or [],
            constraints_and_risks=product_ctx_row.get("constraints_and_risks") or [],
            raw_analysis=product_ctx_row.get("raw_analysis") or "",
        )

    # ── Map agent outputs by agent name ──────────────────────────────────
    outputs_by_agent = {}
    for ao in agent_outputs:
        agent_name = ao["agent"]
        outputs_by_agent[agent_name] = {
            "step": ao["step"],
            "output": ao["output"],
            "created_at": ao.get("created_at"),
        }

    # ── Map conflicts ────────────────────────────────────────────────────
    conflicts = [
        {
            "conflict_id": c["conflict_id"],
            "agents_involved": c["agents_involved"],
            "summary": c["summary"],
            "resolution": c["resolution"],
            "rationale": c["rationale"],
        }
        for c in conflict_logs
    ]

    # ── Benchmark ────────────────────────────────────────────────────────
    benchmark = None
    if benchmark_row:
        benchmark = {
            "baseline_output": benchmark_row.get("baseline_output"),
            "metrics": {
                "requirement_coverage": {
                    "baseline": benchmark_row.get("baseline_issues_count") or 0,
                    "prismos": benchmark_row.get("prismos_issues_count") or 0,
                },
                "conflict_count": benchmark_row.get("prismos_conflict_count") or 0,
                "edge_cases_handled": {
                    "baseline": 0,
                    "prismos": benchmark_row.get("prismos_edge_cases") or 0,
                },
                "verdict_clarity": {
                    "baseline": False,
                    "prismos": benchmark_row.get("verdict_clarity") or False,
                },
            },
        }

    return SessionDetailResponse(
        id=session["id"],
        feature_request=session["feature_request"],
        feature_classification=session.get("feature_classification"),
        product_context=product_context,
        intake=outputs_by_agent.get("context_analyst"),
        prd=outputs_by_agent.get("pm"),
        architect_response=outputs_by_agent.get("architect"),
        uiux_response=outputs_by_agent.get("uiux_designer"),
        engineer_response=outputs_by_agent.get("engineer"),
        qa_response=outputs_by_agent.get("qa"),
        conflicts=conflicts,
        final_package=outputs_by_agent.get("release_manager"),
        benchmark=benchmark,
    )

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    db=Depends(get_db),
):
    """Delete a session."""
    try:
        success = await queries.delete_session(db, session_id)
        return {"success": success}
    except Exception as e:
        logger.error("Failed to delete session: %s", e)
        raise HTTPException(status_code=400, detail=str(e))
