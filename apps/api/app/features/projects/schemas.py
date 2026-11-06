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


BRANCH = Field(default=None, min_length=1, max_length=200, pattern=r"^[A-Za-z0-9._/-]+$")


def _safe_branch(value: str | None) -> str | None:
    if value is not None and (".." in value or value.startswith("/") or value.endswith("/")):
        raise ValueError("not a valid branch name")
    return value


def _clean_name(value: str | None) -> str | None:
    return value.strip() or None if value is not None else None


class ProjectCreate(BaseModel):
    installation_id: int = Field(gt=0)
    repo_full_name: str = Field(max_length=200, pattern=r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
    # both optional: the repo's name and its default branch on GitHub are used when left out
    name: str | None = Field(default=None, min_length=1, max_length=100)
    default_branch: str | None = BRANCH

    _name = field_validator("name")(_clean_name)
    _branch = field_validator("default_branch")(_safe_branch)


class ProjectUpdate(BaseModel):
    """What an owner can change. The repository itself is fixed: attach another repo as a new project."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    default_branch: str | None = BRANCH

    _name = field_validator("name")(_clean_name)
    _branch = field_validator("default_branch")(_safe_branch)


class ActivityItem(BaseModel):
    """One event from any run in the project, newest first: the project's log."""

    run_id: UUID
    run_title: str
    seq: int
    type: str
    payload: dict[str, Any]
    created_at: datetime
