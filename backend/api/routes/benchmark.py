# backend/api/routes/benchmark.py
"""
Benchmark endpoint:
  GET /api/v1/benchmark/{sessionId}  — Benchmark comparison data
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_db
from db import queries
from db.models import BenchmarkMetrics, BenchmarkResponse

logger = logging.getLogger("prismos.routes.benchmark")
router = APIRouter()


@router.get("/benchmark/{session_id}", response_model=BenchmarkResponse)
async def get_benchmark(session_id: str, db=Depends(get_db)):
    """
    Return benchmark comparison data for a completed session.
    Compares Mode A (single-call baseline) vs Mode B (PrismOS 7-agent).
    """
    # Verify session exists
    session = await queries.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Fetch benchmark record
    record = None
    try:
        record = await queries.get_benchmark_record(db, session_id)
    except Exception:
        pass

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Benchmark data not available for this session",
        )

    metrics = BenchmarkMetrics(
        requirement_coverage={
            "baseline": record.get("baseline_issues_count", 0),
            "prismos": record.get("prismos_issues_count", 0),
        },
        conflict_count=record.get("prismos_conflict_count", 0),
        edge_cases_handled={
            "baseline": 0,
            "prismos": record.get("prismos_edge_cases", 0),
        },
        verdict_clarity={
            "baseline": False,
            "prismos": record.get("verdict_clarity", False),
        },
    )

    return BenchmarkResponse(
        session_id=session_id,
        baseline_output=record.get("baseline_output"),
        metrics=metrics,
    )
