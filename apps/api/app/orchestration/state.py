# backend/orchestration/state.py
"""
PrismOSState — the shared state that flows through the LangGraph pipeline.

Every node reads from and writes to this state. LangGraph nodes return
partial dicts to update specific fields.
"""

from __future__ import annotations

from typing import Any, Required

from typing_extensions import TypedDict


class PrismOSState(TypedDict, total=False):
    """
    Full state for a single PrismOS run.

    Fields are optional (total=False) so nodes can return partial updates.
    """

    # ── Identity ─────────────────────────────────────────────────────────
    session_id: Required[str]
    project_id: str | None
    user_input: Required[str]                # raw feature request
    feature_classification: str              # new_feature | enhancement | refactor | bug_fix

    # ── Context ──────────────────────────────────────────────────────────
    context_inputs: dict[str, Any]           # raw ContextInputPayload
    product_context: str                     # Agent 0 raw markdown output
    product_context_summary: dict[str, Any]  # structured ProductContextSummary

    # ── Memory ───────────────────────────────────────────────────────────
    project_memory: list[dict[str, Any]]     # loaded MemoryEntry dicts
    project_memory_text: str                 # formatted for injection into prompts

    # ── Step Tracking ────────────────────────────────────────────────────
    step: int                                # current step (0–7)

    # ── Agent Outputs (raw markdown strings) ─────────────────────────────
    intake_output: str                       # Step 1 — intake classification
    prd_output: str                          # Step 2 — PM PRD
    architect_output: str                    # Step 3 — Architect debate
    engineer_debate_output: str              # Step 3 — Engineer debate
    qa_debate_output: str                    # Step 3 — QA debate
    uiux_output: str                         # Step 4.5 — UI/UX Designer
    engineer_build_output: str               # Step 5 — Engineer final build
    qa_validation_output: str                # Step 6 — QA validation + verdict

    # ── Conflicts ────────────────────────────────────────────────────────
    conflicts: list[dict[str, Any]]          # detected ConflictRecords
    release_decisions: str                   # Step 4 — Release Manager output
    has_conflicts: bool                      # flag for conditional edge

    # ── Final ────────────────────────────────────────────────────────────
    final_code: str
    qa_verdict: str                          # SHIPPABLE | NEEDS_REVISION
    final_package: dict[str, Any]

    # ── Benchmark ────────────────────────────────────────────────────────
    baseline_output: str                     # Mode A single-call output
    benchmark: dict[str, Any]

    # ── Error ────────────────────────────────────────────────────────────
    error: str | None
