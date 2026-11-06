"""Project reads, always scoped to the caller's memberships."""

from __future__ import annotations

from uuid import UUID

from app.database import Conn
from app.errors import AppError
from app.features.projects.schemas import ProjectOut

# the membership join is the access check: a project you don't belong to doesn't exist for you
_SELECT = """
    select p.id, p.name, p.repo_full_name, p.default_branch, m.role::text as role, p.created_at,
           (select max(r.created_at) from runs r where r.project_id = p.id) as last_run_at
    from projects p
    join project_members m on m.project_id = p.id and m.user_id = %(user_id)s
"""


async def list_projects(conn: Conn, user_id: str) -> list[ProjectOut]:
    """The caller's projects, most recently used first."""
    rows = await (
        await conn.execute(_SELECT + " order by last_run_at desc nulls last, p.created_at desc", {"user_id": user_id})
    ).fetchall()
    return [ProjectOut.model_validate(row) for row in rows]


async def get_project(conn: Conn, user_id: str, project_id: UUID) -> ProjectOut:
    """One project; 404 (not 403) for non-members so ids can't be probed."""
    row = await (
        await conn.execute(_SELECT + " where p.id = %(project_id)s", {"user_id": user_id, "project_id": project_id})
    ).fetchone()
    if row is None:
        raise AppError(404, "project_not_found", "That project doesn't exist or you don't have access to it.")
    return ProjectOut.model_validate(row)
