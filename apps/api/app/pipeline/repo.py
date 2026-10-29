"""What the pipeline needs from a repository. The GitHub implementation is app/github/repo.py;
tests pass an in-memory one.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any, Protocol

from pydantic import BaseModel, Field


class RepoSnapshot(BaseModel):
    """The branch pinned to one commit, so every step of a run (and every retry) reads the same code."""

    commit_sha: str
    paths: list[str] = Field(description="Files worth showing the file selector, already filtered.")


class RepoFiles(BaseModel):
    files: dict[str, str]
    omitted: list[str] = Field(
        default_factory=list, description="Selected but left out: too big, binary or over the cap."
    )


class RepoSource(Protocol):
    async def snapshot(self, branch: str) -> RepoSnapshot: ...

    async def read(self, commit_sha: str, paths: list[str]) -> RepoFiles: ...


RepoFor = Callable[[dict[str, Any]], RepoSource]
"""Builds the source for one project row (repo_full_name, github_installation_id)."""


class RepoUnavailable(Exception):
    """The branch doesn't exist or PrismOS can't read the repository."""
