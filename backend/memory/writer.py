# backend/memory/writer.py
"""
Project Memory Writer.

After a completed run (Step 7), extracts memory entries from
agent outputs and persists them to the memory_entries table.

Per Integration Note 11:
  Memory write is async and non-blocking. Do NOT block run completion.

What is persisted:
  - Architecture decisions (from Architect)
  - Shipped feature summary (from PM + Engineer)
  - Conflict resolutions (from Release Manager)
  - UX decisions (from UI/UX Designer)
  - Known constraints/risks (from Context Analyst + QA)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from db import queries
from db.models import MemoryEntryRow
from db.supabase import get_supabase
from orchestration.state import PrismOSState
from orchestration.streaming import emit_memory_write_done

logger = logging.getLogger("prismos.memory.writer")


async def write_memory(
    session_id: str,
    project_id: str,
    state: PrismOSState,
) -> int:
    """
    Extract and persist memory entries from a completed run.

    Scans agent outputs for key decisions, shipped features,
    conflicts, and constraints.

    Returns the number of entries written.
    """
    if not project_id:
        logger.info("No project_id — skipping memory write")
        return 0

    entries: List[MemoryEntryRow] = []
    classification = state.get("feature_classification", "")
    feature_req = state.get("user_input", "")[:200]

    # ── 1. Shipped feature (always) ──────────────────────────────────────
    verdict = state.get("qa_verdict", "")
    entries.append(MemoryEntryRow(
        project_id=project_id,
        session_id=session_id,
        entry_type="shipped_feature",
        title=f"Feature: {feature_req[:100]}",
        content=(
            f"Request: {feature_req}\n"
            f"Classification: {classification}\n"
            f"Verdict: {verdict}\n"
            f"Step completed: {state.get('step', 0)}"
        ),
        agents_involved=["pm", "engineer", "qa"],
        feature_classification=classification,
        relevance_tags=["feature", classification],
    ))

    # ── 2. Architecture decisions (from Architect output) ────────────────
    arch_output = state.get("architect_output", "")
    if arch_output:
        entries.append(MemoryEntryRow(
            project_id=project_id,
            session_id=session_id,
            entry_type="architecture_decision",
            title=f"Architecture for: {feature_req[:80]}",
            content=arch_output[:1000],
            agents_involved=["architect"],
            feature_classification=classification,
            relevance_tags=["architecture", "design"],
        ))

    # ── 3. Conflict resolutions (from Release Manager) ───────────────────
    release_output = state.get("release_decisions", "")
    if release_output:
        entries.append(MemoryEntryRow(
            project_id=project_id,
            session_id=session_id,
            entry_type="conflict_resolution",
            title=f"Conflicts resolved for: {feature_req[:80]}",
            content=release_output[:1000],
            agents_involved=["release_manager"],
            feature_classification=classification,
            relevance_tags=["conflict", "resolution"],
        ))

    # ── 4. UX decisions (from UI/UX Designer) ────────────────────────────
    ux_output = state.get("uiux_output", "")
    if ux_output:
        entries.append(MemoryEntryRow(
            project_id=project_id,
            session_id=session_id,
            entry_type="ux_decision",
            title=f"UX decisions for: {feature_req[:80]}",
            content=ux_output[:1000],
            agents_involved=["uiux_designer"],
            feature_classification=classification,
            relevance_tags=["ux", "design", "components"],
        ))

    # ── 5. Known constraints (from QA) ───────────────────────────────────
    qa_output = state.get("qa_validation_output", "")
    if qa_output and "NEEDS" in qa_output.upper():
        entries.append(MemoryEntryRow(
            project_id=project_id,
            session_id=session_id,
            entry_type="known_constraint",
            title=f"QA concerns for: {feature_req[:80]}",
            content=qa_output[:1000],
            agents_involved=["qa"],
            feature_classification=classification,
            relevance_tags=["qa", "risk", "constraint"],
        ))

    # ── Persist ──────────────────────────────────────────────────────────
    db = get_supabase()
    try:
        await queries.create_memory_entries(db, entries)
        logger.info(
            "Memory written: project=%s, entries=%d", project_id, len(entries)
        )
        await emit_memory_write_done(session_id, len(entries))
        return len(entries)
    except Exception as e:
        logger.error("Memory write failed: %s", e)
        return 0
