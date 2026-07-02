# backend/orchestration/streaming.py
"""
SSE event streaming system for PrismOS.

Architecture:
  - SSEEventBus holds per-session subscriber queues (asyncio.Queue)
  - Orchestration and agents push events via typed emit_* helpers
  - The /runs/{id}/stream endpoint subscribes, reads the queue, and yields SSE frames
  - Multiple clients can subscribe to the same session simultaneously

Event format (SSE spec):
  event: <event_type>
  data: <json_payload>
  \\n
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("prismos.streaming")


# =============================================================================
# Event Bus
# =============================================================================


class SSEEventBus:
    """
    Per-session publish/subscribe event bus for SSE streaming.

    Thread-safe via asyncio primitives. Supports multiple concurrent
    subscribers per session (e.g. multiple browser tabs).
    """

    def __init__(self) -> None:
        self._queues: Dict[str, List[asyncio.Queue]] = {}

    def subscribe(self, session_id: str) -> asyncio.Queue:
        """Create and return a new subscriber queue for a session."""
        queue: asyncio.Queue = asyncio.Queue()
        self._queues.setdefault(session_id, []).append(queue)
        logger.debug("SSE subscribe: session=%s, subscribers=%d",
                      session_id, len(self._queues[session_id]))
        return queue

    def unsubscribe(self, session_id: str, queue: asyncio.Queue) -> None:
        """Remove a subscriber queue. Clean up if last subscriber."""
        if session_id in self._queues:
            try:
                self._queues[session_id].remove(queue)
            except ValueError:
                pass
            if not self._queues[session_id]:
                del self._queues[session_id]
            logger.debug("SSE unsubscribe: session=%s, remaining=%d",
                          session_id, len(self._queues.get(session_id, [])))

    async def emit(
        self, session_id: str, event_type: str, data: Dict[str, Any]
    ) -> None:
        """Emit an event to all subscribers of a session."""
        if session_id not in self._queues:
            return
        frame = {"event": event_type, "data": data}
        for queue in self._queues[session_id]:
            await queue.put(frame)

    async def close_stream(self, session_id: str) -> None:
        """Signal all subscribers that the stream is complete."""
        if session_id not in self._queues:
            return
        for queue in self._queues[session_id]:
            await queue.put(None)  # sentinel

    def has_subscribers(self, session_id: str) -> bool:
        """Check if anyone is listening for this session."""
        return bool(self._queues.get(session_id))


# Global singleton — imported by orchestration and route modules
event_bus = SSEEventBus()


# =============================================================================
# SSE Frame Formatter
# =============================================================================


def format_sse(event_type: str, data: Any) -> str:
    """Format a single SSE frame as per the spec."""
    # The frontend EventSource.onmessage only listens to unnamed events,
    # and expects the 'type' to be inside the JSON payload.
    if isinstance(data, dict):
        data["type"] = event_type
    
    payload = json.dumps(data, ensure_ascii=False)
    return f"data: {payload}\n\n"


KEEPALIVE_COMMENT = ": keepalive\n\n"


# =============================================================================
# Typed Emit Helpers — match the frontend SSE event schema exactly
# =============================================================================


# ── Memory Events ────────────────────────────────────────────────────────────

async def emit_memory_load_start(session_id: str, project_id: str) -> None:
    await event_bus.emit(session_id, "memory_load_start", {
        "projectId": project_id,
    })


async def emit_memory_load_done(session_id: str, entries_loaded: int) -> None:
    await event_bus.emit(session_id, "memory_load_done", {
        "entriesLoaded": entries_loaded,
    })


async def emit_memory_write_done(session_id: str, entries_written: int) -> None:
    await event_bus.emit(session_id, "memory_write_done", {
        "entriesWritten": entries_written,
    })


# ── Context Analyst (Agent 0) ───────────────────────────────────────────────

async def emit_context_analyst_start(session_id: str) -> None:
    await event_bus.emit(session_id, "context_analyst_start", {
        "sessionId": session_id,
    })


async def emit_context_analyst_token(session_id: str, token: str) -> None:
    await event_bus.emit(session_id, "context_analyst_token", {
        "token": token,
    })


async def emit_context_analyst_done(
    session_id: str, summary: Dict[str, Any]
) -> None:
    await event_bus.emit(session_id, "context_analyst_done", {
        "summary": summary,
    })


# ── UI/UX Designer (Agent 3.5) ──────────────────────────────────────────────

async def emit_uiux_designer_start(session_id: str) -> None:
    await event_bus.emit(session_id, "uiux_designer_start", {
        "sessionId": session_id,
    })


async def emit_uiux_designer_token(session_id: str, token: str) -> None:
    await event_bus.emit(session_id, "uiux_designer_token", {
        "token": token,
    })


async def emit_uiux_designer_done(session_id: str, output: str) -> None:
    await event_bus.emit(session_id, "uiux_designer_done", {
        "output": output,
    })


# ── Run Lifecycle ────────────────────────────────────────────────────────────

async def emit_run_start(session_id: str, step: int) -> None:
    await event_bus.emit(session_id, "run_start", {
        "sessionId": session_id,
        "step": step,
    })


async def emit_run_complete(
    session_id: str,
    verdict: str,
    package: Dict[str, Any],
) -> None:
    await event_bus.emit(session_id, "run_complete", {
        "verdict": verdict,
        "package": package,
    })
    # Close the stream after run completes
    await event_bus.close_stream(session_id)


async def emit_run_error(session_id: str, message: str) -> None:
    await event_bus.emit(session_id, "run_error", {
        "message": message,
    })
    await event_bus.close_stream(session_id)


# ── Generic Agent Events (PM, Architect, Engineer, QA) ───────────────────────

async def emit_agent_start(
    session_id: str, agent: str, step: int
) -> None:
    await event_bus.emit(session_id, "agent_start", {
        "agent": agent,
        "step": step,
    })


async def emit_agent_token(
    session_id: str, agent: str, token: str
) -> None:
    await event_bus.emit(session_id, "agent_token", {
        "agent": agent,
        "token": token,
    })


async def emit_agent_done(
    session_id: str, agent: str, output: str
) -> None:
    await event_bus.emit(session_id, "agent_done", {
        "agent": agent,
        "output": output,
    })


# ── Conflict Events ─────────────────────────────────────────────────────────

async def emit_conflict_start(session_id: str, conflict_id: str) -> None:
    await event_bus.emit(session_id, "conflict_start", {
        "conflictId": conflict_id,
    })


async def emit_conflict_token(
    session_id: str, conflict_id: str, token: str
) -> None:
    await event_bus.emit(session_id, "conflict_token", {
        "conflictId": conflict_id,
        "token": token,
    })


async def emit_conflict_done(
    session_id: str,
    conflict_id: str,
    agents_involved: List[str],
    resolution: str,
    rationale: str,
) -> None:
    await event_bus.emit(session_id, "conflict_done", {
        "conflictId": conflict_id,
        "agents": agents_involved,
        "resolution": resolution,
        "rationale": rationale,
    })


# =============================================================================
# Stream Callback Factory
# =============================================================================


def make_stream_callback(session_id: str, agent: str):
    """
    Create a stream_callback closure for a specific agent.
    Passed into BaseAgent.run() — the agent calls it on each token.

    Usage inside an agent:
        async for token in qwen_stream(...):
            await stream_callback(token)
    """
    async def callback(token: str) -> None:
        # Route to the correct event emitter based on agent type
        if agent == "context_analyst":
            await emit_context_analyst_token(session_id, token)
        elif agent == "uiux_designer":
            await emit_uiux_designer_token(session_id, token)
        else:
            await emit_agent_token(session_id, agent, token)

    return callback
