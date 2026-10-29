from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class ProjectOut(BaseModel):
    id: UUID
    name: str
    repo_full_name: str
    default_branch: str
    role: Literal["owner", "member"]
    created_at: datetime
    last_run_at: datetime | None
