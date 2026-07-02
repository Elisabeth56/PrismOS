# backend/agents/base.py
"""
BaseAgent — foundation for all PrismOS agents.

Handles:
  - Qwen Cloud API connection (OpenAI-compatible via Dashscope)
  - System prompt assembly with context injection
  - Streaming token emission via callback
  - Error handling and output collection
"""

from __future__ import annotations

import logging
from typing import Any, Callable, Dict, List, Optional

from openai import AsyncOpenAI

from config import get_settings

logger = logging.getLogger("prismos.agents")

# Lazy-initialised shared client
_client: Optional[AsyncOpenAI] = None


def _get_client() -> AsyncOpenAI:
    """Return a shared AsyncOpenAI client pointed at Qwen Cloud."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncOpenAI(
            api_key=settings.QWEN_API_KEY,
            base_url=settings.QWEN_API_BASE,
        )
        logger.info("Qwen client initialised: model=%s", settings.QWEN_MODEL)
    return _client


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

    def build_system_prompt(self, context: Dict[str, Any]) -> str:
        """
        Assemble the full system prompt with injected context.

        Block order (per Integration Note 9):
          [ProductContext] → [ProjectMemory] → [base system prompt]

        ProductContextSummary is injected at the system prompt level,
        not as a user message (per spec §11 note 3).
        """
        blocks: List[str] = []

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

    def build_messages(self, context: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Build the messages array for the Qwen API call.

        System prompt: role + injected context
        User messages: prior agent outputs (if any) + task
        """
        system = self.build_system_prompt(context)
        messages: List[Dict[str, str]] = [
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
        context: Dict[str, Any],
        stream_callback: Callable[[str], Any],
    ) -> str:
        """
        Execute the agent:
          1. Build messages from context
          2. Call Qwen API with streaming
          3. Emit tokens via stream_callback
          4. Return full output string

        Args:
            context: Dict with keys like 'task', 'product_context',
                     'project_memory', 'prior_outputs'
            stream_callback: async callable — called with each token string

        Returns:
            The complete output string
        """
        settings = get_settings()
        client = _get_client()
        messages = self.build_messages(context)

        logger.info("Agent '%s' starting — %d messages, model=%s",
                     self.name, len(messages), settings.QWEN_MODEL)

        full_output = ""

        try:
            stream = await client.chat.completions.create(
                model=settings.QWEN_MODEL,
                messages=messages,
                stream=True,
                temperature=0.7,
                max_tokens=4096,
            )

            async for chunk in stream:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                if delta.content:
                    token = delta.content
                    full_output += token
                    await stream_callback(token)

        except Exception as e:
            error_msg = f"[AGENT ERROR: {self.name}] {type(e).__name__}: {e}"
            logger.error(error_msg)
            if not full_output:
                full_output = error_msg
            await stream_callback(f"\n\n{error_msg}")

        logger.info("Agent '%s' done — %d chars output",
                     self.name, len(full_output))
        return full_output
