from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends

from app.auth import User, current_user
from app.database import Conn, get_conn
from app.features.projects import logic
from app.features.projects.schemas import ProjectOut

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
async def list_projects(user: User = Depends(current_user), conn: Conn = Depends(get_conn)):
    """Projects the signed-in user is a member of."""
    return await logic.list_projects(conn, user.id)


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: UUID, user: User = Depends(current_user), conn: Conn = Depends(get_conn)):
    return await logic.get_project(conn, user.id, project_id)
