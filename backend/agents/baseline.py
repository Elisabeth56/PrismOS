# backend/agents/baseline.py
"""
Baseline Agent — Mode A single-call comparison.

Makes a single LLM call with just the feature request (no context,
no multi-agent coordination). Used for the benchmark comparison
to demonstrate PrismOS's advantage.
"""

from __future__ import annotations

from agents.base import BaseAgent


class BaselineAgent(BaseAgent):
    name = "baseline"
    system_prompt = """You are a general-purpose AI coding assistant.

A user will give you a feature request. Produce your best implementation including:
1. Requirements analysis
2. Technical approach
3. Code implementation
4. Test plan

Provide everything in a single response. You have no knowledge of the existing codebase — work from the feature request alone."""
