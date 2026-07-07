# backend/orchestration/graph.py
"""
LangGraph StateGraph for PrismOS — the orchestration brain.

Pipeline:
  memory_load → context_analyst → pm → parallel_debate → conflict_check
  → [conditional: resolution | skip] → uiux_design → build
  → qa_validation → final_package

Each node:
  1. Emits SSE start event
  2. Runs the agent with streaming
  3. Saves output to DB
  4. Emits SSE done event
  5. Updates session step
  6. Returns state update
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from agents.architect import ArchitectAgent
from agents.baseline import BaselineAgent
from agents.context_analyst import ContextAnalystAgent
from agents.engineer import EngineerAgent
from agents.pm import PMAgent
from agents.qa import QAAgent
from agents.release_manager import ReleaseManagerAgent
from agents.uiux_designer import UIUXDesignerAgent
from context_ingestion.context_builder import build_context
from db import queries
from db.models import AgentOutputRow, BenchmarkRecordRow, ConflictLogRow
from db.supabase import get_supabase
from memory.loader import format_memory_for_prompt, load_memory
from memory.writer import write_memory
from orchestration.conflict import detect_conflicts
from orchestration.state import PrismOSState
from orchestration.streaming import (
    emit_agent_done,
    emit_agent_start,
    emit_agent_token,
    emit_conflict_done,
    emit_conflict_start,
    emit_context_analyst_done,
    emit_context_analyst_start,
    emit_context_analyst_token,
    emit_memory_load_done,
    emit_memory_load_start,
    emit_memory_write_done,
    emit_run_complete,
    emit_run_error,
    emit_run_start,
    emit_uiux_designer_done,
    emit_uiux_designer_start,
    emit_uiux_designer_token,
    make_stream_callback,
)

logger = logging.getLogger("prismos.graph")

# ── Agent singletons ─────────────────────────────────────────────────────────
context_analyst_agent = ContextAnalystAgent()
pm_agent = PMAgent()
architect_agent = ArchitectAgent()
engineer_agent = EngineerAgent()
qa_agent = QAAgent()
release_manager_agent = ReleaseManagerAgent()
uiux_designer_agent = UIUXDesignerAgent()
baseline_agent = BaselineAgent()


# =============================================================================
# Helper: save agent output to DB and update session step
# =============================================================================

async def _save_output(session_id: str, agent: str, step: int, output: str):
    """Persist agent output and advance the session step."""
    db = get_supabase()
    try:
        await queries.create_agent_output(
            db,
            AgentOutputRow(session_id=session_id, agent=agent, step=step, output=output),
        )
        await queries.update_session(db, session_id, {"step_completed": step})
    except Exception as e:
        logger.error("Failed to save output for %s: %s", agent, e)


def _build_prior_outputs(**sections: str) -> str:
    """Concatenate prior agent outputs into a single context string."""
    parts = []
    for label, content in sections.items():
        if content:
            parts.append(f"## {label}\n\n{content}")
    return "\n\n---\n\n".join(parts)


# =============================================================================
# Node: Memory Load (pre-Step 0)
# =============================================================================

async def memory_load_node(state: PrismOSState) -> Dict[str, Any]:
    """Load project memory before anything else runs."""
    sid = state["session_id"]
    pid = state.get("project_id")

    if not pid:
        return {"project_memory": [], "project_memory_text": "", "step": 0}

    await emit_memory_load_start(sid, pid)

    entries = await load_memory(pid)
    memory_text = format_memory_for_prompt(entries)

    await emit_memory_load_done(sid, len(entries))

    return {
        "project_memory": entries,
        "project_memory_text": memory_text,
        "step": 0,
    }


# =============================================================================
# Node: Context Analyst (Step 0)
# =============================================================================

async def context_analyst_node(state: PrismOSState) -> Dict[str, Any]:
    """Agent 0 — analyse existing product from context inputs."""
    sid = state["session_id"]

    await emit_run_start(sid, 0)
    await emit_context_analyst_start(sid)

    # Pre-process context inputs through ingestion pipeline (< 5s)
    ctx_inputs = state.get("context_inputs", {})
    context_text = await build_context(ctx_inputs)

    # Save context inputs to product_contexts table
    db = get_supabase()
    from db.models import ProductContextRow
    try:
        await queries.create_product_context(
            db,
            ProductContextRow(
                session_id=sid,
                context_inputs=ctx_inputs,
            ),
        )
    except Exception as e:
        logger.warning("Failed to save context inputs: %s", e)

    context = {
        "project_memory": state.get("project_memory_text", ""),
        "task": (
            f"Analyse the following context inputs and produce a structured "
            f"Existing Product Analysis.\n\n"
            f"{context_text}\n\n"
            f"**Feature request (for reference only — do not plan this):**\n"
            f"{state.get('user_input', '')}"
        ),
    }

    callback = make_stream_callback(sid, "context_analyst")
    output = await context_analyst_agent.run(context, callback)

    summary = {"raw_analysis": output}
    await emit_context_analyst_done(sid, summary)
    await _save_output(sid, "context_analyst", 0, output)

    return {
        "product_context": output,
        "product_context_summary": summary,
        "step": 0,
    }


# =============================================================================
# Node: PM (Steps 1 + 2 — intake + PRD)
# =============================================================================

async def pm_node(state: PrismOSState) -> Dict[str, Any]:
    """PM Agent — feature classification + PRD."""
    sid = state["session_id"]

    await emit_agent_start(sid, "pm", 2)

    context = {
        "product_context": state.get("product_context", ""),
        "project_memory": state.get("project_memory_text", ""),
        "task": (
            f"Feature request: {state['user_input']}\n\n"
            f"Requested classification: {state.get('feature_classification', 'new_feature')}\n\n"
            f"1. Validate or correct the feature classification\n"
            f"2. Restate the request in structured form\n"
            f"3. Produce a complete PRD with user stories and MVP boundary"
        ),
    }

    callback = make_stream_callback(sid, "pm")
    output = await pm_agent.run(context, callback)

    await emit_agent_done(sid, "pm", output)
    await _save_output(sid, "pm", 2, output)

    return {"prd_output": output, "intake_output": output, "step": 2}


# =============================================================================
# Node: Parallel Debate (Step 3)
# =============================================================================

async def parallel_debate_node(state: PrismOSState) -> Dict[str, Any]:
    """Architect, Engineer, and QA debate independently in parallel."""
    sid = state["session_id"]
    prior = _build_prior_outputs(
        **{"Product Context": state.get("product_context", ""),
           "PRD": state.get("prd_output", "")}
    )

    async def run_agent(agent, agent_name):
        await emit_agent_start(sid, agent_name, 3)
        context = {
            "product_context": state.get("product_context", ""),
            "project_memory": state.get("project_memory_text", ""),
            "prior_outputs": prior,
            "task": (
                f"Feature request: {state['user_input']}\n\n"
                f"Classification: {state.get('feature_classification', 'new_feature')}\n\n"
                f"Respond independently with your analysis. You MUST surface "
                f"at least one concern using your conflict markers."
            ),
        }
        callback = make_stream_callback(sid, agent_name)
        output = await agent.run(context, callback)
        await emit_agent_done(sid, agent_name, output)
        await _save_output(sid, agent_name, 3, output)
        return output

    # Run all three in parallel
    architect_out, engineer_out, qa_out = await asyncio.gather(
        run_agent(architect_agent, "architect"),
        run_agent(engineer_agent, "engineer"),
        run_agent(qa_agent, "qa"),
    )

    return {
        "architect_output": architect_out,
        "engineer_debate_output": engineer_out,
        "qa_debate_output": qa_out,
        "step": 3,
    }


# =============================================================================
# Node: Conflict Check (between Step 3 and Step 4)
# =============================================================================

async def conflict_check_node(state: PrismOSState) -> Dict[str, Any]:
    """Detect conflict markers and decide if Release Manager is needed."""
    conflicts, warnings = detect_conflicts(
        state.get("architect_output", ""),
        state.get("engineer_debate_output", ""),
        state.get("qa_debate_output", ""),
    )

    # Log warnings to conflict log (non-blocking)
    if warnings:
        sid = state["session_id"]
        db = get_supabase()
        for w in warnings:
            try:
                await queries.create_conflict_log(
                    db,
                    ConflictLogRow(
                        session_id=sid,
                        conflict_id=f"warn-{w['agent']}",
                        agents_involved=[w["agent"]],
                        summary=f"[WARNING] {w['marker']}\n\nContext:\n{w['context']}",
                        resolution="No resolution required — warning only",
                        rationale=f"{w['marker']} from {w['agent']} alone does not trigger resolution",
                    ),
                )
            except Exception as e:
                logger.warning("Failed to log warning: %s", e)

    return {
        "conflicts": conflicts,
        "has_conflicts": len(conflicts) > 0,
    }


# =============================================================================
# Node: Resolution (Step 4 — conditional)
# =============================================================================

async def resolution_node(state: PrismOSState) -> Dict[str, Any]:
    """Release Manager resolves conflicts between agents."""
    sid = state["session_id"]
    conflicts = state.get("conflicts", [])

    await emit_agent_start(sid, "release_manager", 4)

    # Build conflict summary for Release Manager
    conflict_text = "\n\n".join(
        f"### Conflict: {c['summary']}\n"
        f"Source: {c['source_agent']} ({c['marker']})\n"
        f"Context: {c['context']}"
        for c in conflicts
    )

    prior = _build_prior_outputs(
        **{
            "Product Context": state.get("product_context", ""),
            "PRD": state.get("prd_output", ""),
            "Architect Response": state.get("architect_output", ""),
            "Engineer Response": state.get("engineer_debate_output", ""),
            "QA Response": state.get("qa_debate_output", ""),
        }
    )

    context = {
        "product_context": state.get("product_context", ""),
        "project_memory": state.get("project_memory_text", ""),
        "prior_outputs": prior,
        "task": (
            f"The following conflicts were detected during the parallel debate. "
            f"Review all agent positions and issue binding decisions.\n\n"
            f"{conflict_text}"
        ),
    }

    callback = make_stream_callback(sid, "release_manager")
    output = await release_manager_agent.run(context, callback)

    # Parse output to extract better summary, resolution, and rationale
    import re
    blocks = re.split(r'### Conflict \d+:', output)[1:]
    parsed_conflicts = []
    for block in blocks:
        summary_match = re.search(r'\*\*Summary:\*\*\s*(.*?)(?=\*\*|$)', block, re.DOTALL)
        decision_match = re.search(r'\*\*Decision:\*\*\s*(.*?)(?=\*\*|$)', block, re.DOTALL)
        rationale_match = re.search(r'\*\*Rationale:\*\*\s*(.*?)(?=\*\*|$)', block, re.DOTALL)
        
        parsed_conflicts.append({
            "summary": summary_match.group(1).strip() if summary_match else None,
            "resolution": decision_match.group(1).strip() if decision_match else None,
            "rationale": rationale_match.group(1).strip() if rationale_match else None,
        })

    # Emit conflict SSE events
    for i, c in enumerate(conflicts):
        parsed = parsed_conflicts[i] if i < len(parsed_conflicts) else {}
        summary = parsed.get("summary") or c["summary"]
        resolution = parsed.get("resolution") or "See Release Manager output"
        rationale = parsed.get("rationale") or output[:200]

        await emit_conflict_start(sid, c["conflict_id"])
        await emit_conflict_done(
            sid,
            c["conflict_id"],
            c["agents_involved"],
            summary,
            resolution=resolution,
            rationale=rationale,
        )

    await emit_agent_done(sid, "release_manager", output)
    await _save_output(sid, "release_manager", 4, output)

    # Save conflict logs to DB
    db = get_supabase()
    for i, c in enumerate(conflicts):
        parsed = parsed_conflicts[i] if i < len(parsed_conflicts) else {}
        summary = parsed.get("summary") or c["summary"]
        resolution = parsed.get("resolution") or output[:500]
        rationale = parsed.get("rationale") or output[:500]

        try:
            await queries.create_conflict_log(
                db,
                ConflictLogRow(
                    session_id=sid,
                    conflict_id=c["conflict_id"],
                    agents_involved=c["agents_involved"],
                    summary=summary,
                    resolution=resolution,
                    rationale=rationale,
                ),
            )
        except Exception as e:
            logger.warning("Failed to save conflict log: %s", e)

    return {"release_decisions": output, "step": 4}


# =============================================================================
# Node: UI/UX Design (Step 4.5)
# =============================================================================

async def uiux_design_node(state: PrismOSState) -> Dict[str, Any]:
    """UI/UX Designer produces full UX spec."""
    sid = state["session_id"]

    await emit_uiux_designer_start(sid)

    prior = _build_prior_outputs(
        **{
            "Product Context": state.get("product_context", ""),
            "PRD": state.get("prd_output", ""),
            "Architecture Design": state.get("architect_output", ""),
            "Release Manager Decisions": state.get("release_decisions", ""),
        }
    )

    context = {
        "product_context": state.get("product_context", ""),
        "project_memory": state.get("project_memory_text", ""),
        "prior_outputs": prior,
        "task": (
            f"Feature request: {state['user_input']}\n\n"
            f"Produce a complete UI/UX specification for this feature. "
            f"The Engineer will implement code based on YOUR spec — "
            f"be specific about every screen, component, and interaction state."
        ),
    }

    callback = make_stream_callback(sid, "uiux_designer")
    output = await uiux_designer_agent.run(context, callback)

    await emit_uiux_designer_done(sid, output)
    await _save_output(sid, "uiux_designer", 4, output)

    return {"uiux_output": output, "step": 4}


# =============================================================================
# Node: Build (Step 5)
# =============================================================================

async def build_node(state: PrismOSState) -> Dict[str, Any]:
    """Engineer writes final implementation informed by all prior outputs."""
    sid = state["session_id"]

    await emit_agent_start(sid, "engineer", 5)

    # System prompt block order per Integration Note 9:
    # [ProductContext] → [ProjectMemory] → [PRD] → [ArchitectDesign]
    # → [UXSpec] → [ReleaseDecisions] → [task]
    prior = _build_prior_outputs(
        **{
            "PRD": state.get("prd_output", ""),
            "Architecture Design": state.get("architect_output", ""),
            "UX Specification": state.get("uiux_output", ""),
            "Release Manager Decisions": state.get("release_decisions", ""),
        }
    )

    context = {
        "product_context": state.get("product_context", ""),
        "project_memory": state.get("project_memory_text", ""),
        "prior_outputs": prior,
        "task": (
            f"Feature request: {state['user_input']}\n\n"
            f"Classification: {state.get('feature_classification', 'new_feature')}\n\n"
            f"Implement the complete feature as production-ready code. "
            f"Follow the architecture design and UX specification exactly. "
            f"Include a Change Manifest documenting all file changes."
        ),
    }

    callback = make_stream_callback(sid, "engineer")
    output = await engineer_agent.run(context, callback)

    await emit_agent_done(sid, "engineer", output)
    await _save_output(sid, "engineer", 5, output)

    return {"engineer_build_output": output, "final_code": output, "step": 5}


# =============================================================================
# Node: QA Validation (Step 6)
# =============================================================================

async def qa_validation_node(state: PrismOSState) -> Dict[str, Any]:
    """QA validates the implementation and issues verdict."""
    sid = state["session_id"]

    await emit_agent_start(sid, "qa", 6)

    prior = _build_prior_outputs(
        **{
            "PRD": state.get("prd_output", ""),
            "Architecture Design": state.get("architect_output", ""),
            "UX Specification": state.get("uiux_output", ""),
            "Engineer Implementation": state.get("engineer_build_output", ""),
            "Release Manager Decisions": state.get("release_decisions", ""),
        }
    )

    context = {
        "product_context": state.get("product_context", ""),
        "project_memory": state.get("project_memory_text", ""),
        "prior_outputs": prior,
        "task": (
            f"Feature request: {state['user_input']}\n\n"
            f"Validate the Engineer's implementation against the PRD, "
            f"architecture design, and UX specification. Run all test scenarios "
            f"including frontend-specific checks. Issue your verdict: "
            f"SHIPPABLE or NEEDS REVISION."
        ),
    }

    callback = make_stream_callback(sid, "qa")
    output = await qa_agent.run(context, callback)

    # Extract verdict from output
    verdict = "NEEDS_REVISION"
    if "SHIPPABLE" in output.upper():
        verdict = "SHIPPABLE"

    await emit_agent_done(sid, "qa", output)
    await _save_output(sid, "qa", 6, output)

    return {"qa_validation_output": output, "qa_verdict": verdict, "step": 6}


# =============================================================================
# Node: Final Package (Step 7)
# =============================================================================

async def final_package_node(state: PrismOSState) -> Dict[str, Any]:
    """Assemble final package, run baseline, compute benchmark."""
    sid = state["session_id"]
    db = get_supabase()

    # ── Run baseline (Mode A) in parallel with package assembly ──────────
    async def run_baseline():
        context = {"task": state["user_input"]}
        # Baseline doesn't stream to frontend — silent run
        output = await baseline_agent.run(context, lambda t: asyncio.sleep(0))
        return output

    baseline_output = await run_baseline()

    # ── Assemble final package ───────────────────────────────────────────
    verdict = state.get("qa_verdict", "NEEDS_REVISION")
    package = {
        "session_id": sid,
        "feature_request": state["user_input"],
        "feature_classification": state.get("feature_classification", ""),
        "code": state.get("final_code", ""),
        "tests": state.get("qa_validation_output", ""),
        "verdict": verdict,
        "architecture_summary": state.get("architect_output", "")[:500],
        "ux_spec": state.get("uiux_output", ""),
    }

    # ── Compute benchmark metrics ────────────────────────────────────────
    benchmark = {
        "baseline_output": baseline_output,
        "metrics": {
            "requirement_coverage": {
                "baseline": baseline_output.lower().count("user story"),
                "prismos": state.get("prd_output", "").lower().count("given"),
            },
            "conflict_count": len(state.get("conflicts", [])),
            "edge_cases_handled": {
                "baseline": baseline_output.lower().count("edge case"),
                "prismos": state.get("qa_validation_output", "").lower().count("edge"),
            },
            "verdict_clarity": {
                "baseline": "shippable" in baseline_output.lower(),
                "prismos": True,
            },
        },
    }

    # ── Save to DB ───────────────────────────────────────────────────────
    try:
        await queries.create_benchmark_record(
            db,
            BenchmarkRecordRow(
                session_id=sid,
                baseline_output=baseline_output,
                baseline_issues_count=benchmark["metrics"]["requirement_coverage"]["baseline"],
                prismos_issues_count=benchmark["metrics"]["requirement_coverage"]["prismos"],
                prismos_conflict_count=benchmark["metrics"]["conflict_count"],
                prismos_edge_cases=benchmark["metrics"]["edge_cases_handled"]["prismos"],
                verdict_clarity=benchmark["metrics"]["verdict_clarity"]["prismos"],
            ),
        )
    except Exception as e:
        logger.warning("Failed to save benchmark: %s", e)

    # ── Update session as complete ───────────────────────────────────────
    try:
        await queries.update_session(db, sid, {
            "step_completed": 7,
            "status": "complete",
            "verdict": verdict,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.warning("Failed to update session status: %s", e)

    # ── Upload to OSS ─────────────────────────────────────────────────────
    from storage.oss import upload_package
    oss_url = await upload_package(sid, package)
    if oss_url:
        try:
            await queries.update_session(db, sid, {"oss_artefact_url": oss_url})
        except Exception:
            pass

    # ── Emit completion ──────────────────────────────────────────────────
    await emit_run_complete(sid, verdict, package)

    # ── Write project memory (async, non-blocking per Integration Note 11)
    pid = state.get("project_id")
    if pid:
        try:
            await write_memory(sid, pid, state)
        except Exception as e:
            logger.warning("Memory write failed (non-blocking): %s", e)

    return {
        "final_package": package,
        "baseline_output": baseline_output,
        "benchmark": benchmark,
        "step": 7,
    }


# =============================================================================
# Conditional: should we run Release Manager?
# =============================================================================

def route_after_conflict_check(state: PrismOSState) -> str:
    """Conditional edge: resolution if conflicts, else skip to UX design."""
    if state.get("has_conflicts"):
        return "resolution"
    return "uiux_design"


# =============================================================================
# Build the Graph
# =============================================================================

def build_graph() -> CompiledStateGraph:
    """Construct and compile the PrismOS LangGraph pipeline."""
    graph = StateGraph(PrismOSState)

    # Add all nodes
    graph.add_node("memory_load", memory_load_node)
    graph.add_node("context_analyst", context_analyst_node)
    graph.add_node("pm", pm_node)
    graph.add_node("parallel_debate", parallel_debate_node)
    graph.add_node("conflict_check", conflict_check_node)
    graph.add_node("resolution", resolution_node)
    graph.add_node("uiux_design", uiux_design_node)
    graph.add_node("build", build_node)
    graph.add_node("qa_validation", qa_validation_node)
    graph.add_node("final_package", final_package_node)

    # Linear edges
    graph.add_edge(START, "memory_load")
    graph.add_edge("memory_load", "context_analyst")
    graph.add_edge("context_analyst", "pm")
    graph.add_edge("pm", "parallel_debate")
    graph.add_edge("parallel_debate", "conflict_check")

    # Conditional: Resolution or skip
    graph.add_conditional_edges(
        "conflict_check",
        route_after_conflict_check,
        {"resolution": "resolution", "uiux_design": "uiux_design"},
    )

    # After resolution → UX design
    graph.add_edge("resolution", "uiux_design")

    # Continue linear
    graph.add_edge("uiux_design", "build")
    graph.add_edge("build", "qa_validation")
    graph.add_edge("qa_validation", "final_package")
    graph.add_edge("final_package", END)

    return graph.compile()


# Compiled graph singleton
prismos_graph = build_graph()


# =============================================================================
# Entry point: run the full pipeline
# =============================================================================

async def run_pipeline(
    session_id: str,
    user_input: str,
    feature_classification: str,
    context_inputs: dict,
    project_id: str | None = None,
    mode: str = "full",
) -> None:
    """
    Execute the full PrismOS pipeline for a session.

    Called as a background task from POST /runs.
    All SSE events are emitted during execution.
    """
    initial_state: PrismOSState = {
        "session_id": session_id,
        "project_id": project_id,
        "user_input": user_input,
        "feature_classification": feature_classification,
        "mode": mode,
        "context_inputs": context_inputs,
        "step": 0,
        "conflicts": [],
        "has_conflicts": False,
    }

    try:
        logger.info("Pipeline starting: session=%s", session_id)
        await prismos_graph.ainvoke(initial_state)
        logger.info("Pipeline complete: session=%s", session_id)

    except Exception as e:
        logger.error("Pipeline error: session=%s, error=%s", session_id, e)
        await emit_run_error(session_id, str(e))

        # Update session status to error
        db = get_supabase()
        try:
            await queries.update_session(db, session_id, {
                "status": "error",
                "completed_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception:
            pass
