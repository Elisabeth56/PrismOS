from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends

from app.auth import User, current_user
from app.config import get_settings
from app.database import Conn, get_conn
from app.features.runs import logic
from app.features.runs.schemas import RunCreate, RunDetail, RunOut

router = APIRouter(tags=["runs"])


@router.post("/runs", status_code=202, response_model=RunOut)
async def create_run(body: RunCreate, user: User = Depends(current_user), conn: Conn = Depends(get_conn)):
    """Queues a run. 202: accepted, not done; follow it on /runs/{id}."""
    return await logic.create_run(conn, user.id, body, get_settings())


@router.get("/runs/{run_id}", response_model=RunDetail)
async def get_run(run_id: UUID, user: User = Depends(current_user), conn: Conn = Depends(get_conn)):
    return await logic.get_run(conn, user.id, run_id)


@router.post("/runs/{run_id}/cancel", response_model=RunOut)
async def cancel_run(run_id: UUID, user: User = Depends(current_user), conn: Conn = Depends(get_conn)):
    return await logic.cancel_run(conn, user.id, run_id)


@router.get("/projects/{project_id}/runs", response_model=list[RunOut])
async def list_runs(project_id: UUID, user: User = Depends(current_user), conn: Conn = Depends(get_conn)):
    return await logic.list_runs(conn, user.id, project_id)
