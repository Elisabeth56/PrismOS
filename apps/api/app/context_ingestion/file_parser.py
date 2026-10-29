# backend/context_ingestion/file_parser.py
"""
Parse uploaded source files and schemas.

Accepts the file_contents list from ContextInputPayload and extracts
useful information: language, framework hints, structure.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("prismos.context.files")

# File extension → language mapping
EXT_MAP = {
    ".py": "Python",
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".js": "JavaScript",
    ".jsx": "JavaScript (React)",
    ".go": "Go",
    ".rs": "Rust",
    ".java": "Java",
    ".rb": "Ruby",
    ".php": "PHP",
    ".sql": "SQL",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".md": "Markdown",
    ".toml": "TOML",
}


def parse_files(
    file_contents: Optional[List[Dict[str, str]]],
) -> Dict[str, Any]:
    """
    Parse uploaded file contents.

    Returns:
      - languages: detected languages
      - file_summaries: list of { filename, language, preview }
      - total_size: total character count
    """
    if not file_contents:
        return {"languages": [], "file_summaries": [], "total_size": 0}

    languages = set()
    summaries = []
    total_size = 0

    for f in file_contents:
        filename = f.get("filename", "unknown")
        content = f.get("content", "")
        total_size += len(content)

        # Detect language from extension
        ext = "." + filename.rsplit(".", 1)[-1] if "." in filename else ""
        lang = EXT_MAP.get(ext.lower(), "Unknown")
        languages.add(lang)

        summaries.append({
            "filename": filename,
            "language": lang,
            "size": len(content),
            "preview": content[:300],  # first 300 chars
            "full_content": content[:3000],  # cap at 3KB per file for prompt
        })

    logger.info(
        "Files parsed: %d files, %d chars, languages: %s",
        len(summaries), total_size, list(languages),
    )

    return {
        "languages": sorted(languages),
        "file_summaries": summaries,
        "total_size": total_size,
    }
