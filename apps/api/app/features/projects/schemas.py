from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ProjectOut(BaseModel):
    id: UUID
    name: str
    repo_full_name: str
    default_branch: str
    role: Literal["owner", "member"]
    created_at: datetime
    last_run_at: datetime | None
    run_count: int


class ProjectCreate(BaseModel):
    installation_id: int = Field(gt=0)
    repo_full_name: str = Field(max_length=200, pattern=r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
    name: str | None = Field(default=None, min_length=1, max_length=100)


class ProjectUpdate(BaseModel):
    """What an owner can change. The repository itself is fixed: attach another repo as a new project."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    default_branch: str | None = Field(default=None, min_length=1, max_length=200, pattern=r"^[A-Za-z0-9._/-]+$")

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None

    @field_validator("default_branch")
    @classmethod
    def no_parent_refs(cls, value: str | None) -> str | None:
        if value is not None and (".." in value or value.startswith("/") or value.endswith("/")):
            raise ValueError("not a valid branch name")
        return value


class ActivityItem(BaseModel):
    """One event from any run in the project, newest first: the project's log."""

    run_id: UUID
    run_title: str
    seq: int
    type: str
    payload: dict[str, Any]
    created_at: datetime
