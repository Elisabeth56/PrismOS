from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class ProjectOut(BaseModel):
    id: UUID
    name: str
    repo_full_name: str
    default_branch: str
    role: Literal["owner", "member"]
    created_at: datetime
    last_run_at: datetime | None


class ProjectCreate(BaseModel):
    installation_id: int = Field(gt=0)
    repo_full_name: str = Field(max_length=200, pattern=r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
    name: str | None = Field(default=None, min_length=1, max_length=100)
