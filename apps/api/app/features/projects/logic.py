"""Project reads, always scoped to the caller's memberships."""

from __future__ import annotations

from uuid import UUID

from app.database import Conn
from app.errors import AppError
from app.features.projects.schemas import ProjectCreate, ProjectOut
from app.github.app import InstalledRepo

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


async def create_project(conn: Conn, user_id: str, body: ProjectCreate, reachable: list[InstalledRepo]) -> ProjectOut:
    """Attaches a repo the user can reach through an installation, as GitHub reported it with their own token."""
    match = next(
        (
            r
            for r in reachable
            if r.installation_id == body.installation_id and r.full_name.lower() == body.repo_full_name.lower()
        ),
        None,
    )
    if match is None:
        raise AppError(
            403,
            "repo_not_accessible",
            "PrismOS isn't installed on that repository, or your GitHub account can't access it.",
        )
    async with conn.transaction():
        existing = await (
            await conn.execute(
                """select 1 from projects p join project_members m on m.project_id = p.id and m.user_id = %s
                   where lower(p.repo_full_name) = lower(%s)""",
                (user_id, match.full_name),
            )
        ).fetchone()
        if existing:
            raise AppError(409, "project_exists", "You already have a project for that repository.")
        row = await (
            await conn.execute(
                """insert into projects (name, repo_full_name, default_branch, github_installation_id, created_by)
                   values (%s, %s, %s, %s, %s) returning id""",
                (
                    body.name or match.full_name.split("/")[1],
                    match.full_name,
                    match.default_branch,
                    match.installation_id,
                    user_id,
                ),
            )
        ).fetchone()
        assert row is not None
        await conn.execute(
            "insert into project_members (project_id, user_id, role) values (%s, %s, 'owner')", (row["id"], user_id)
        )
    return await get_project(conn, user_id, row["id"])
