from __future__ import annotations

from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, Query

from app.auth import User, current_user
from app.config import get_settings
from app.database import Conn, get_conn
from app.features.github.router import github_transport
from app.features.runs import logic
from app.features.runs.approve import approve_run
from app.features.runs.schemas import RunCreate, RunDetail, RunEventOut, RunOut, RunSummary
from app.github.app import GitHubApp, get_github_app

router = APIRouter(tags=["runs"])


@router.post("/runs", status_code=202, response_model=RunOut)
async def create_run(body: RunCreate, user: User = Depends(current_user), conn: Conn = Depends(get_conn)):
    """Queues a run. 202: accepted, not done; follow it on /runs/{id}."""
    return await logic.create_run(conn, user.id, body, get_settings())


@router.get("/runs/{run_id}", response_model=RunDetail)
async def get_run(run_id: UUID, user: User = Depends(current_user), conn: Conn = Depends(get_conn)):
    return await logic.get_run(conn, user.id, run_id)


@router.get("/runs/{run_id}/events", response_model=list[RunEventOut])
async def list_events(
    run_id: UUID,
    after: int = Query(default=0, ge=0),
    user: User = Depends(current_user),
    conn: Conn = Depends(get_conn),
):
    """Events with seq > after, oldest first (up to 500)."""
    return await logic.list_events(conn, user.id, run_id, after)


@router.post("/runs/{run_id}/cancel", response_model=RunOut)
async def cancel_run(run_id: UUID, user: User = Depends(current_user), conn: Conn = Depends(get_conn)):
    return await logic.cancel_run(conn, user.id, run_id)


@router.post("/runs/{run_id}/approve", response_model=RunDetail)
async def approve(
    run_id: UUID,
    user: User = Depends(current_user),
    conn: Conn = Depends(get_conn),
    github_app: GitHubApp | None = Depends(get_github_app),
    transport: httpx.AsyncBaseTransport | None = Depends(github_transport),
):
    """Opens the pull request. Safe to repeat: a run gets one PR however many times this is called."""
    return await approve_run(conn, user.id, run_id, github_app, transport)


@router.get("/projects/{project_id}/runs", response_model=list[RunSummary])
async def list_runs(project_id: UUID, user: User = Depends(current_user), conn: Conn = Depends(get_conn)):
    return await logic.list_runs(conn, user.id, project_id)
