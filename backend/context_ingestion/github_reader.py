# backend/context_ingestion/github_reader.py
"""
Fetch and parse a public GitHub repository.

Extracts:
  - Repository file tree
  - Key config files (package.json, requirements.txt, pyproject.toml)
  - Main route/model files (heuristic detection)
  - README content

Uses GITHUB_TOKEN env var for rate limit (60 req/hr without, 5000 with).
Target: < 3s total.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

import httpx

from config import get_settings

logger = logging.getLogger("prismos.context.github")

# Files we always try to fetch
KEY_FILES = [
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    "composer.json",
    "Gemfile",
    "pom.xml",
    "README.md",
    "docker-compose.yml",
    "Dockerfile",
]

# Patterns for route/model/schema files
INTERESTING_PATTERNS = [
    r"routes?[./]",
    r"api[./]",
    r"models?[./]",
    r"schema",
    r"migration",
    r"middleware",
    r"auth",
    r"database",
    r"config",
]


def _parse_repo_url(url: str) -> Optional[tuple[str, str]]:
    """Extract (owner, repo) from a GitHub URL."""
    match = re.match(
        r"https?://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$", url
    )
    if match:
        return match.group(1), match.group(2)
    return None


async def fetch_github_repo(github_url: str) -> Dict[str, Any]:
    """
    Fetch key information from a public GitHub repo.

    Returns a dict with:
      - tree: list of file paths
      - key_files: dict of filename → content
      - interesting_files: list of detected route/model/schema files
    """
    parsed = _parse_repo_url(github_url)
    if not parsed:
        return {"error": f"Could not parse GitHub URL: {github_url}"}

    owner, repo = parsed
    settings = get_settings()
    headers = {"Accept": "application/vnd.github.v3+json"}
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"

    result: Dict[str, Any] = {
        "owner": owner,
        "repo": repo,
        "tree": [],
        "key_files": {},
        "interesting_files": [],
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Fetch file tree
        try:
            tree_resp = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/git/trees/main?recursive=1",
                headers=headers,
            )
            if tree_resp.status_code == 404:
                # Try 'master' branch
                tree_resp = await client.get(
                    f"https://api.github.com/repos/{owner}/{repo}/git/trees/master?recursive=1",
                    headers=headers,
                )

            if tree_resp.status_code == 200:
                tree_data = tree_resp.json()
                paths = [
                    item["path"]
                    for item in tree_data.get("tree", [])
                    if item["type"] == "blob"
                ]
                result["tree"] = paths[:200]  # cap at 200 files

                # Identify interesting files
                for path in paths:
                    for pattern in INTERESTING_PATTERNS:
                        if re.search(pattern, path, re.IGNORECASE):
                            result["interesting_files"].append(path)
                            break
            else:
                logger.warning("GitHub tree fetch failed: %d", tree_resp.status_code)
        except Exception as e:
            logger.warning("GitHub tree fetch error: %s", e)

        # 2. Fetch key files
        for filename in KEY_FILES:
            # Check if file exists in tree
            matching = [p for p in result["tree"] if p.endswith(filename)]
            if not matching:
                continue
            filepath = matching[0]
            try:
                raw_resp = await client.get(
                    f"https://raw.githubusercontent.com/{owner}/{repo}/main/{filepath}",
                    headers={"Accept": "text/plain"},
                )
                if raw_resp.status_code == 404:
                    raw_resp = await client.get(
                        f"https://raw.githubusercontent.com/{owner}/{repo}/master/{filepath}",
                    )
                if raw_resp.status_code == 200:
                    content = raw_resp.text[:5000]  # cap content size
                    result["key_files"][filepath] = content
            except Exception as e:
                logger.warning("Failed to fetch %s: %s", filepath, e)

    logger.info(
        "GitHub fetch complete: %s/%s — %d files, %d key files, %d interesting",
        owner, repo, len(result["tree"]),
        len(result["key_files"]), len(result["interesting_files"]),
    )
    return result
