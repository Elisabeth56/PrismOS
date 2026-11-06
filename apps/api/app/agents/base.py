"""BaseAgent for the pre-remodel pipeline: prompt assembly and streamed output. Replaced by the graph rewrite in #13."""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any

from app.ai import llm
from app.ai.llm import Message

logger = logging.getLogger("prismos.agents")

class BaseAgent:
    """
    Base class for all PrismOS agents.

    Subclasses set `name` and `system_prompt` and can override
    `build_context_blocks()` to customise what gets injected.

    Usage:
        agent = PMAgent()
        output = await agent.run(context, stream_callback)
    """

    name: str = "base"
    system_prompt: str = "You are a helpful assistant."

    # ── Context Assembly ─────────────────────────────────────────────────

    def build_system_prompt(self, context: dict[str, Any]) -> str:
        """
        Assemble the full system prompt with injected context.

        Block order (per Integration Note 9):
          [ProductContext] → [ProjectMemory] → [base system prompt]

        ProductContextSummary is injected at the system prompt level,
        not as a user message (per spec §11 note 3).
        """
        blocks: list[str] = []

        # 1. Product context (Agent 0 output)
        if context.get("product_context"):
            blocks.append(
                "## EXISTING PRODUCT CONTEXT\n\n"
                f"{context['product_context']}"
            )

        # 2. Project memory (condensed top entries)
        if context.get("project_memory"):
            blocks.append(
                "## PROJECT MEMORY (previous decisions and shipped features)\n\n"
                f"{context['project_memory']}"
            )

        # 3. Agent's own role prompt
        blocks.append(self.system_prompt)

        return "\n\n---\n\n".join(blocks)

    def build_messages(self, context: dict[str, Any]) -> list[Message]:
        """
        Build the messages array for the Qwen API call.

        System prompt: role + injected context
        User messages: prior agent outputs (if any) + task
        """
        system = self.build_system_prompt(context)
        messages: list[Message] = [
            {"role": "system", "content": system}
        ]

        # Prior agent outputs as user context (e.g. PRD for Architect)
        if context.get("prior_outputs"):
            messages.append({
                "role": "user",
                "content": (
                    "Here are the outputs from previous agents in this run. "
                    "Use them as context for your work:\n\n"
                    f"{context['prior_outputs']}"
                ),
            })

        # The actual task / feature request
        if context.get("task"):
            messages.append({
                "role": "user",
                "content": context["task"],
            })

        return messages

    # ── Execution ────────────────────────────────────────────────────────

    async def run(
        self,
        context: dict[str, Any],
        stream_callback: Callable[[str], Any],
    ) -> str:
        """Streams the agent's answer token by token through stream_callback and returns the full text.

        Failures propagate so the run stops; an error message is never passed on as an agent's output.
        """
        messages = self.build_messages(context)
        logger.info("Agent '%s' starting with %d messages", self.name, len(messages))
        parts: list[str] = []
        async for token in llm.stream_text(messages):
            parts.append(token)
            await stream_callback(token)
        output = "".join(parts)
        logger.info("Agent '%s' done, %d chars", self.name, len(output))
        return output
