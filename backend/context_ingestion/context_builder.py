# backend/context_ingestion/context_builder.py
"""
Merge all context inputs into a single ContextPayload string.

Runs all ingestion modules in parallel, then combines their outputs
into a formatted text block that is passed to the Context Analyst.

Per Integration Note 1: context ingestion is pre-LLM work.
Target: < 5s total before Agent 0 starts streaming.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict

from context_ingestion.file_parser import parse_files
from context_ingestion.github_reader import fetch_github_repo
from context_ingestion.url_crawler import crawl_url

logger = logging.getLogger("prismos.context.builder")


async def build_context(context_inputs: Dict[str, Any]) -> str:
    """
    Process all context inputs in parallel and merge into a single
    formatted string for the Context Analyst agent.

    Args:
        context_inputs: raw ContextInputPayload as dict

    Returns:
        Formatted context string ready for Agent 0's prompt
    """
    if not context_inputs or not any(context_inputs.values()):
        return (
            "No existing product context provided. "
            "Agents will proceed with no prior system knowledge."
        )

    sections = []

    # ── Run ingestion in parallel ────────────────────────────────────────
    tasks = {}

    if context_inputs.get("github_url"):
        tasks["github"] = fetch_github_repo(context_inputs["github_url"])

    if context_inputs.get("product_url"):
        tasks["url"] = crawl_url(context_inputs["product_url"])

    # File parsing is synchronous but fast
    file_result = parse_files(context_inputs.get("file_contents"))

    # Await async tasks
    results = {}
    if tasks:
        gathered = await asyncio.gather(
            *tasks.values(), return_exceptions=True
        )
        for key, result in zip(tasks.keys(), gathered):
            if isinstance(result, Exception):
                logger.warning("Context task '%s' failed: %s", key, result)
                results[key] = {"error": str(result)}
            else:
                results[key] = result

    # ── Assemble context string ──────────────────────────────────────────

    # GitHub repo
    if "github" in results and "error" not in results["github"]:
        gh = results["github"]
        section = f"### GitHub Repository: {gh['owner']}/{gh['repo']}\n\n"
        section += f"**File count:** {len(gh['tree'])}\n"
        section += f"**Interesting files (routes/models/config):** {len(gh['interesting_files'])}\n"

        if gh["interesting_files"]:
            section += "\n**Detected route/model/schema files:**\n"
            for f in gh["interesting_files"][:20]:
                section += f"- `{f}`\n"

        if gh["key_files"]:
            section += "\n**Key file contents:**\n"
            for path, content in gh["key_files"].items():
                section += f"\n#### `{path}`\n```\n{content[:2000]}\n```\n"

        sections.append(section)

    # Uploaded files
    if file_result["file_summaries"]:
        section = "### Uploaded Files\n\n"
        section += f"**Languages detected:** {', '.join(file_result['languages'])}\n"
        section += f"**Total size:** {file_result['total_size']} chars\n\n"

        for fs in file_result["file_summaries"]:
            section += f"#### `{fs['filename']}` ({fs['language']})\n"
            section += f"```\n{fs['full_content']}\n```\n\n"

        sections.append(section)

    # URL crawl
    if "url" in results and "error" not in results["url"]:
        uc = results["url"]
        section = f"### Product URL: {uc['url']}\n\n"
        section += f"**Status:** {uc['status']}\n"
        if uc["detected_tech"]:
            section += f"**Detected technologies:** {', '.join(uc['detected_tech'])}\n"
        if uc["meta_tags"]:
            section += f"**Page title:** {uc['meta_tags'].get('title', 'N/A')}\n"
            section += f"**Description:** {uc['meta_tags'].get('description', 'N/A')}\n"
        if uc["headers_info"]:
            section += f"**Server headers:** {json.dumps(uc['headers_info'])}\n"
        sections.append(section)

    # Free-text description
    if context_inputs.get("description"):
        sections.append(
            f"### Product Description (user-provided)\n\n"
            f"{context_inputs['description']}"
        )

    # Stack info
    if context_inputs.get("stack_info"):
        sections.append(
            f"### Stack Information (user-provided)\n\n"
            f"{context_inputs['stack_info']}"
        )

    # ── Combine ──────────────────────────────────────────────────────────
    if not sections:
        return (
            "No existing product context provided. "
            "Agents will proceed with no prior system knowledge."
        )

    context_text = "# Context Inputs\n\n" + "\n\n---\n\n".join(sections)

    logger.info(
        "Context built: %d sections, %d chars",
        len(sections), len(context_text),
    )
    return context_text
