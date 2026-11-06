from __future__ import annotations

from uuid import UUID

import httpx
from fastapi import APIRouter, Depends

from app.auth import User, current_user
from app.database import Conn, get_conn
from app.features.github.router import github_transport, github_user_token
from app.features.projects import logic
from app.features.projects.schemas import ProjectCreate, ProjectOut
from app.github.app import repos_for_user

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
async def list_projects(user: User = Depends(current_user), conn: Conn = Depends(get_conn)):
    """Projects the signed-in user is a member of."""
    return await logic.list_projects(conn, user.id)


@router.post("", status_code=201, response_model=ProjectOut)
async def create_project(
    body: ProjectCreate,
    user: User = Depends(current_user),
    conn: Conn = Depends(get_conn),
    token: str = Depends(github_user_token),
    transport: httpx.AsyncBaseTransport | None = Depends(github_transport),
):
    """Attaches a repository. The user's GitHub token proves they can access the installation (ADR-001)."""
    return await logic.create_project(conn, user.id, body, await repos_for_user(token, transport))


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: UUID, user: User = Depends(current_user), conn: Conn = Depends(get_conn)):
    return await logic.get_project(conn, user.id, project_id)
