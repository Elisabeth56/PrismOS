# backend/orchestration/conflict.py
"""
Conflict detection engine.

Scans agent outputs from the parallel debate (Step 3) for conflict markers.
Determines which conflicts require Release Manager resolution vs warnings.

Markers:
  DISAGREES:         → requires resolution
  PUSHBACK:          → requires resolution
  SECURITY FLAG:     → requires resolution (priority)
  INTEGRATION RISK:  → warning only (unless counter-position exists)
  UX FRICTION:       → warning only (unless Engineer DISAGREES)
"""

from __future__ import annotations

import logging
import re
import uuid
from typing import Any, Dict, List, Tuple

logger = logging.getLogger("prismos.conflict")

# Markers that always trigger resolution
RESOLUTION_MARKERS = ["DISAGREES:", "PUSHBACK:", "SECURITY FLAG:"]

# Markers that are warnings unless paired with a counter-position
WARNING_MARKERS = ["INTEGRATION RISK:", "UX FRICTION:"]

ALL_MARKERS = RESOLUTION_MARKERS + WARNING_MARKERS


def _extract_markers(
    output: str, agent_name: str
) -> List[Dict[str, str]]:
    """
    Extract conflict markers from an agent's output.

    Returns list of { marker, agent, context } dicts.
    Context is the text after the marker, looking ahead up to 3 non-empty lines.
    """
    findings = []
    lines = output.split("\n")

    for i, line in enumerate(lines):
        for marker in ALL_MARKERS:
            if marker in line:
                # Grab context: rest of this line
                context = line.split(marker, 1)[1].strip()
                
                # Look ahead for up to 3 non-empty lines to get actual context
                lookahead_lines = []
                j = i + 1
                while j < len(lines) and len(lookahead_lines) < 3:
                    next_line = lines[j].strip()
                    if next_line:
                        lookahead_lines.append(next_line)
                    j += 1
                
                if lookahead_lines:
                    context += (" " if context else "") + " ".join(lookahead_lines)
                
                findings.append({
                    "marker": marker,
                    "agent": agent_name,
                    "context": context[:300].strip(),  # cap length
                })
    return findings


def detect_conflicts(
    architect_output: str,
    engineer_output: str,
    qa_output: str,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Scan all parallel debate outputs and classify findings.

    Returns:
        (conflicts, warnings)
        - conflicts: require Release Manager resolution
        - warnings: logged but don't trigger resolution
    """
    # Extract all markers from each agent
    all_findings = []
    all_findings.extend(_extract_markers(architect_output, "architect"))
    all_findings.extend(_extract_markers(engineer_output, "engineer"))
    all_findings.extend(_extract_markers(qa_output, "qa"))

    if not all_findings:
        logger.info("No conflict markers detected in parallel debate")
        return [], []

    conflicts = []
    warnings = []

    # Separate resolution markers from warning markers
    resolution_findings = [
        f for f in all_findings if f["marker"] in RESOLUTION_MARKERS
    ]
    warning_findings = [
        f for f in all_findings if f["marker"] in WARNING_MARKERS
    ]

    # Resolution markers always create conflicts
    # Group by marker type for cleaner conflict records
    if resolution_findings:
        # Group findings that might be about the same topic
        agents_involved = list({f["agent"] for f in resolution_findings})
        for finding in resolution_findings:
            conflicts.append({
                "conflict_id": f"c-{uuid.uuid4().hex[:8]}",
                "agents_involved": agents_involved,
                "marker": finding["marker"],
                "summary": f"{finding['agent']} flagged {finding['marker']}\n\nContext:\n{finding['context']}",
                "source_agent": finding["agent"],
                "context": finding["context"],
            })

    # Warning markers: check if there's a counter-position
    for finding in warning_findings:
        # INTEGRATION RISK from Engineer alone → warning
        # UX FRICTION from Designer alone → warning
        # But if another agent DISAGREES → promote to conflict
        has_counter = any(
            f["marker"] == "DISAGREES:"
            and f["agent"] != finding["agent"]
            for f in all_findings
        )

        if has_counter:
            conflicts.append({
                "conflict_id": f"c-{uuid.uuid4().hex[:8]}",
                "agents_involved": [finding["agent"]] + [
                    f["agent"] for f in all_findings
                    if f["marker"] == "DISAGREES:" and f["agent"] != finding["agent"]
                ],
                "marker": finding["marker"],
                "summary": f"{finding['agent']} flagged {finding['marker']} and another agent disagrees\n\nContext:\n{finding['context']}",
                "source_agent": finding["agent"],
                "context": finding["context"],
            })
        else:
            warnings.append({
                "marker": finding["marker"],
                "agent": finding["agent"],
                "context": finding["context"],
            })

    logger.info(
        "Conflict detection: %d conflicts, %d warnings",
        len(conflicts),
        len(warnings),
    )
    return conflicts, warnings
