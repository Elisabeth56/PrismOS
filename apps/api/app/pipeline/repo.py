"""What the pipeline needs from a repository. The GitHub implementation lives in app/github (#11, #6);
tests pass an in-memory one.
"""

from __future__ import annotations

from typing import Protocol

from pydantic import BaseModel, Field


class RepoSnapshot(BaseModel):
    """The branch pinned to one commit, so every step of a run (and every retry) reads the same code."""

    commit_sha: str
    paths: list[str] = Field(description="Files worth showing the file selector, already filtered.")


class RepoFiles(BaseModel):
    files: dict[str, str]


class RepoSource(Protocol):
    async def snapshot(self, repo: str, branch: str) -> RepoSnapshot: ...

    async def read(self, repo: str, commit_sha: str, paths: list[str]) -> dict[str, str]:
        """Contents of the given paths. Missing, binary or oversized files are left out."""
        ...
