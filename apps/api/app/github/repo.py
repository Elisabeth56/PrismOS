"""Reads a repository through the GitHub REST API (ADR-006): one tree call, then only the files the selector
picked. Nothing is cloned.
"""

from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from pathlib import PurePosixPath
from urllib.parse import quote

import httpx

from app.pipeline.repo import RepoFiles, RepoSnapshot, RepoUnavailable

logger = logging.getLogger("prismos.github")

API = "https://api.github.com"
CONTEXT_CHARS = 60_000  # all selected files together (ADR-006)
MAX_TREE_PATHS = 4_000

SKIP_DIRS = {
    "node_modules", "vendor", "dist", "build", "out", ".next", ".nuxt", ".turbo", ".cache", "coverage",
    "__pycache__", ".venv", "venv", "target", ".git", ".idea", ".vscode",
}  # fmt: skip
SKIP_FILES = {
    "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb", "poetry.lock", "uv.lock", "Pipfile.lock",
    "Cargo.lock", "Gemfile.lock", "composer.lock", "go.sum", ".DS_Store",
}  # fmt: skip
SKIP_SUFFIXES = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg", ".pdf", ".zip", ".gz", ".tar", ".jar", ".woff",
    ".woff2", ".ttf", ".otf", ".eot", ".mp3", ".mp4", ".mov", ".wasm", ".so", ".dylib", ".dll", ".exe", ".bin",
    ".pyc", ".map", ".lock", ".min.js", ".min.css",
}  # fmt: skip

Token = Callable[[], Awaitable[str | None]]


def worth_reading(path: str, size: int, max_bytes: int) -> bool:
    """Source and config a model could learn from; not vendored, generated, binary, lock or huge files."""
    parts = PurePosixPath(path).parts
    name = parts[-1]
    if any(part in SKIP_DIRS for part in parts[:-1]) or name in SKIP_FILES:
        return False
    if any(name.endswith(suffix) for suffix in SKIP_SUFFIXES):
        return False
    return size <= max_bytes


def prioritise(paths: list[str], limit: int = MAX_TREE_PATHS) -> list[str]:
    """For very large repos, keep the shallowest paths: entry points and config sit near the root."""
    if len(paths) <= limit:
        return paths
    return sorted(sorted(paths, key=lambda p: (p.count("/"), p))[:limit])


@dataclass
class GitHubRepo:
    full_name: str
    token: Token
    max_file_bytes: int
    transport: httpx.AsyncBaseTransport | None = None

    async def _client(self) -> httpx.AsyncClient:
        headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
        if token := await self.token():
            headers["Authorization"] = f"Bearer {token}"
        return httpx.AsyncClient(base_url=API, headers=headers, timeout=20, transport=self.transport)

    async def snapshot(self, branch: str) -> RepoSnapshot:
        async with await self._client() as http:
            ref = await http.get(f"/repos/{self.full_name}/commits/{quote(branch, safe='')}")
            if ref.status_code in (404, 422):
                raise RepoUnavailable(f"branch {branch!r} not found in {self.full_name}, or no access")
            ref.raise_for_status()
            sha = ref.json()["sha"]
            tree = await http.get(f"/repos/{self.full_name}/git/trees/{sha}", params={"recursive": "1"})
            tree.raise_for_status()
        body = tree.json()
        if body.get("truncated"):
            logger.warning("tree of %s truncated by GitHub; using the entries returned", self.full_name)
        paths = [
            entry["path"]
            for entry in body["tree"]
            if entry["type"] == "blob" and worth_reading(entry["path"], entry.get("size", 0), self.max_file_bytes)
        ]
        return RepoSnapshot(commit_sha=sha, paths=prioritise(paths))

    async def read(self, commit_sha: str, paths: list[str]) -> RepoFiles:
        """Files in the selector's order until the context cap; whatever doesn't fit is listed as omitted."""
        files: dict[str, str] = {}
        omitted: list[str] = []
        used = 0
        async with await self._client() as http:
            for path in paths:
                response = await http.get(
                    f"/repos/{self.full_name}/contents/{quote(path)}",
                    params={"ref": commit_sha},
                    headers={"Accept": "application/vnd.github.raw+json"},
                )
                if response.status_code == 404:
                    omitted.append(path)
                    continue
                response.raise_for_status()
                try:
                    text = response.content.decode()
                except UnicodeDecodeError:
                    omitted.append(path)
                    continue
                if used + len(text) > CONTEXT_CHARS:
                    omitted.append(path)
                    continue
                files[path] = text
                used += len(text)
        return RepoFiles(files=files, omitted=omitted)


def static_token(token: str | None) -> Token:
    async def get() -> str | None:
        return token

    return get
