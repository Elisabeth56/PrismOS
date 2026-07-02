# backend/memory/loader.py
"""
Project Memory Loader.

Loads relevant memory entries before Step 0 and formats them
for injection into agent system prompts.

Sorts by recency — most recent decisions are most relevant.
Hackathon: full load of all entries (max 20).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List

from db import queries
from db.supabase import get_supabase

logger = logging.getLogger("prismos.memory.loader")


async def load_memory(project_id: str) -> List[Dict[str, Any]]:
    """
    Load all memory entries for a project.

    Returns list of MemoryEntry dicts, sorted by created_at desc.
    """
    if not project_id:
        return []

    db = get_supabase()
    try:
        entries = await queries.get_memory_entries(db, project_id, limit=20)
        logger.info(
            "Memory loaded: project=%s, entries=%d",
            project_id, len(entries),
        )
        return entries
    except Exception as e:
        logger.warning("Memory load failed: %s", e)
        return []


def format_memory_for_prompt(entries: List[Dict[str, Any]]) -> str:
    """
    Format memory entries into a text block for system prompt injection.

    Groups by entry_type for better readability.
    """
    if not entries:
        return ""

    by_type: Dict[str, List[str]] = {}
    for e in entries:
        etype = e.get("entry_type", "unknown")
        title = e.get("title", "")
        content = e.get("content", "")[:200]
        line = f"- **{title}**: {content}"
        by_type.setdefault(etype, []).append(line)

    sections = []
    type_labels = {
        "architecture_decision": "Architecture Decisions",
        "shipped_feature": "Shipped Features",
        "conflict_resolution": "Past Conflict Resolutions",
        "ux_decision": "UX Decisions",
        "known_constraint": "Known Constraints & Risks",
        "release_record": "Release History",
    }

    for etype, items in by_type.items():
        label = type_labels.get(etype, etype.replace("_", " ").title())
        section = f"### {label}\n" + "\n".join(items[:5])
        sections.append(section)

    return "\n\n".join(sections)
