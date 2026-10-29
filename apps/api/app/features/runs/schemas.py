from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.config import get_settings

RunStatus = Literal["queued", "running", "awaiting_approval", "pr_opened", "failed", "cancelled"]


class ContextFile(BaseModel):
    name: str = Field(min_length=1, max_length=200, pattern=r"^[^/\\]+$")
    content: str

    @field_validator("content")
    @classmethod
    def within_size_limit(cls, content: str) -> str:
        limit = get_settings().MAX_FILE_SIZE_BYTES
        if len(content.encode()) > limit:
            raise ValueError(f"must be at most {limit // 1024} KB")
        return content


class RunCreate(BaseModel):
    project_id: UUID
    feature_request: str = Field(min_length=10, max_length=4000)
    # defaults to the project's default branch; git-safe characters only
    base_branch: str | None = Field(default=None, max_length=100, pattern=r"^[A-Za-z0-9._/-]+$")
    context_files: list[ContextFile] = Field(default_factory=list, max_length=5)

    @field_validator("base_branch")
    @classmethod
    def no_parent_segments(cls, branch: str | None) -> str | None:
        if branch is not None and ".." in branch:
            raise ValueError("branch names can't contain '..'")
        return branch

    @field_validator("feature_request")
    @classmethod
    def strip_request(cls, text: str) -> str:
        stripped = text.strip()
        if len(stripped) < 10:
            raise ValueError("describe the feature in at least 10 characters")
        return stripped


class RunOut(BaseModel):
    id: UUID
    project_id: UUID
    feature_request: str
    base_branch: str
    status: RunStatus
    current_step: str | None
    verdict: Literal["verified", "needs_revision"] | None
    pr_url: str | None
    pr_number: int | None
    error: dict[str, Any] | None
    tokens_in: int
    tokens_out: int
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None


class ChangeOut(BaseModel):
    path: str
    action: Literal["create", "modify", "delete"]
    content: str | None


class ConflictOut(BaseModel):
    id: UUID
    item_id: str
    kind: Literal["contested", "blocking"]
    objections: list[dict[str, Any]]
    ruling: str | None
    rationale: str | None
    owner: str | None


class RunDetail(RunOut):
    """A run with everything it has produced so far, for the run and review pages."""

    steps: dict[str, Any]
    conflicts: list[ConflictOut]
    changes: list[ChangeOut]
