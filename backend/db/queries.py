# backend/db/queries.py
"""
Database query helpers for all PrismOS tables.

Every function takes a Supabase client and returns typed results.
All writes exclude None/unset fields so Supabase defaults apply.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from supabase import Client

from db.models import (
    AgentOutputRow,
    BenchmarkRecordRow,
    ConflictLogRow,
    MemoryEntryRow,
    ProductContextRow,
    ProjectRow,
    SessionRow,
)

logger = logging.getLogger("prismos.db.queries")


# =============================================================================
# Sessions
# =============================================================================


async def create_session(db: Client, row: SessionRow) -> Dict[str, Any]:
    """Insert a new session. Returns the created row."""
    data = row.model_dump(exclude_none=True)
    result = db.table("sessions").insert(data).execute()
    return result.data[0] if result.data else {}


async def get_session(db: Client, session_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a single session by ID."""
    result = (
        db.table("sessions")
        .select("*")
        .eq("id", session_id)
        .single()
        .execute()
    )
    return result.data

async def delete_session(db: Client, session_id: str) -> bool:
    """Delete a session."""
    result = db.table("sessions").delete().eq("id", session_id).execute()
    return True

async def list_sessions(
    db: Client,
    session_token: Optional[str] = None,
    project_id: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """List sessions, optionally filtered by anonymous session token and project_id."""
    query = db.table("sessions").select("*").order("created_at", desc=True).limit(limit)
    if session_token:
        query = query.eq("session_token", session_token)
    if project_id:
        query = query.eq("project_id", project_id)
    result = query.execute()
    return result.data or []


async def update_session(
    db: Client,
    session_id: str,
    updates: Dict[str, Any],
) -> Dict[str, Any]:
    """Partial update on a session row."""
    result = (
        db.table("sessions")
        .update(updates)
        .eq("id", session_id)
        .execute()
    )
    return result.data[0] if result.data else {}


# =============================================================================
# Product Contexts
# =============================================================================


async def create_product_context(
    db: Client, row: ProductContextRow
) -> Dict[str, Any]:
    """Insert the Context Analyst output for a session."""
    data = row.model_dump(exclude_none=True)
    result = db.table("product_contexts").insert(data).execute()
    return result.data[0] if result.data else {}


async def get_product_context(
    db: Client, session_id: str
) -> Optional[Dict[str, Any]]:
    """Fetch product context by session ID (1:1 relationship)."""
    result = (
        db.table("product_contexts")
        .select("*")
        .eq("session_id", session_id)
        .single()
        .execute()
    )
    return result.data


# =============================================================================
# Agent Outputs
# =============================================================================


async def create_agent_output(
    db: Client, row: AgentOutputRow
) -> Dict[str, Any]:
    """Insert an agent's completed output."""
    data = row.model_dump(exclude_none=True)
    result = db.table("agent_outputs").insert(data).execute()
    return result.data[0] if result.data else {}


async def get_agent_outputs(
    db: Client, session_id: str
) -> List[Dict[str, Any]]:
    """Fetch all agent outputs for a session, ordered by step."""
    result = (
        db.table("agent_outputs")
        .select("*")
        .eq("session_id", session_id)
        .order("step")
        .execute()
    )
    return result.data or []


async def get_agent_output(
    db: Client, session_id: str, agent: str
) -> Optional[Dict[str, Any]]:
    """Fetch a specific agent's output for a session."""
    result = (
        db.table("agent_outputs")
        .select("*")
        .eq("session_id", session_id)
        .eq("agent", agent)
        .single()
        .execute()
    )
    return result.data


# =============================================================================
# Conflict Logs
# =============================================================================


async def create_conflict_log(
    db: Client, row: ConflictLogRow
) -> Dict[str, Any]:
    """Insert a conflict log entry."""
    data = row.model_dump(exclude_none=True)
    result = db.table("conflict_logs").insert(data).execute()
    return result.data[0] if result.data else {}


async def get_conflict_logs(
    db: Client, session_id: str
) -> List[Dict[str, Any]]:
    """Fetch all conflict logs for a session."""
    result = (
        db.table("conflict_logs")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at")
        .execute()
    )
    return result.data or []


# =============================================================================
# Benchmark Records
# =============================================================================


async def create_benchmark_record(
    db: Client, row: BenchmarkRecordRow
) -> Dict[str, Any]:
    """Insert a benchmark comparison record."""
    data = row.model_dump(exclude_none=True)
    result = db.table("benchmark_records").insert(data).execute()
    return result.data[0] if result.data else {}


async def get_benchmark_record(
    db: Client, session_id: str
) -> Optional[Dict[str, Any]]:
    """Fetch benchmark data for a session (1:1 relationship)."""
    result = (
        db.table("benchmark_records")
        .select("*")
        .eq("session_id", session_id)
        .single()
        .execute()
    )
    return result.data


# =============================================================================
# Projects
# =============================================================================


async def create_project(db: Client, row: ProjectRow) -> Dict[str, Any]:
    """Insert a new project."""
    data = row.model_dump(exclude_none=True)
    result = db.table("projects").insert(data).execute()
    return result.data[0] if result.data else {}


async def get_project(db: Client, project_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a project by ID."""
    result = (
        db.table("projects")
        .select("*")
        .eq("id", project_id)
        .single()
        .execute()
    )
    return result.data


async def list_projects(
    db: Client,
    session_token: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """List projects, optionally filtered by owner token."""
    query = (
        db.table("projects")
        .select("*")
        .order("last_run_at", desc=True, nullsfirst=False)
        .limit(limit)
    )
    if session_token:
        query = query.eq("session_token", session_token)
    result = query.execute()
    return result.data or []


async def update_project(
    db: Client,
    project_id: str,
    updates: Dict[str, Any],
) -> Dict[str, Any]:
    """Partial update on a project row."""
    result = (
        db.table("projects")
        .update(updates)
        .eq("id", project_id)
        .execute()
    )
    return result.data[0] if result.data else {}


# =============================================================================
# Memory Entries
# =============================================================================


async def create_memory_entries(
    db: Client, rows: List[MemoryEntryRow]
) -> List[Dict[str, Any]]:
    """Batch-insert memory entries after a completed run."""
    data = [r.model_dump(exclude_none=True) for r in rows]
    if not data:
        return []
    result = db.table("memory_entries").insert(data).execute()
    return result.data or []


async def get_memory_entries(
    db: Client,
    project_id: str,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """Load project memory entries, most recent first (hackathon: full load)."""
    result = (
        db.table("memory_entries")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


async def get_memory_entries_count(db: Client, project_id: str) -> int:
    """Count total memory entries for a project."""
    result = (
        db.table("memory_entries")
        .select("id", count="exact")
        .eq("project_id", project_id)
        .execute()
    )
    return result.count or 0
