# backend/api/routes/projects.py
"""
Project endpoints:
  POST /api/v1/projects                    — Create a new project
  GET  /api/v1/projects                    — List all projects
  PUT  /api/v1/projects/{id}               — Update project
  GET  /api/v1/projects/{id}/memory        — Project memory entries
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_db, get_session_token
from db import queries
from db.models import (
    CreateProjectRequest,
    CreateProjectResponse,
    MemoryEntry,
    ProjectMemoryResponse,
    ProjectRow,
    UpdateProjectRequest,
    UpdateProjectResponse,
)

logger = logging.getLogger("prismos.routes.projects")
router = APIRouter()


@router.post("/projects", status_code=201, response_model=CreateProjectResponse)
async def create_project(
    body: CreateProjectRequest,
    db=Depends(get_db),
    session_token: Optional[str] = Depends(get_session_token),
):
    """Create a new project (memory namespace for related runs)."""
    row = ProjectRow(
        name=body.name,
        description=body.description,
        session_token=session_token,
    )

    try:
        created = await queries.create_project(db, row)
    except Exception as e:
        logger.error("Failed to create project: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create project")

    return CreateProjectResponse(
        id=created["id"],
        name=created["name"],
        created_at=created["created_at"],
    )


@router.get("/projects")
async def list_projects(
    db=Depends(get_db),
    session_token: Optional[str] = Depends(get_session_token),
):
    """List all projects, filtered by the anonymous session token."""
    rows = await queries.list_projects(db, session_token=session_token)

    projects = []
    for r in rows:
        # Get memory entry count for each project
        mem_count = await queries.get_memory_entries_count(db, r["id"])
        projects.append({
            "id": r["id"],
            "name": r["name"],
            "description": r.get("description"),
            "created_at": r.get("created_at"),
            "last_run_at": r.get("last_run_at"),
            "memory_entry_count": mem_count,
        })

    return {"projects": projects}


@router.put("/projects/{project_id}", response_model=UpdateProjectResponse)
async def update_project(
    project_id: str,
    body: UpdateProjectRequest,
    db=Depends(get_db),
):
    """Update project name and/or description."""
    existing = await queries.get_project(db, project_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")

    updates = {"name": body.name}
    if body.description is not None:
        updates["description"] = body.description

    try:
        updated = await queries.update_project(db, project_id, updates)
    except Exception as e:
        logger.error("Failed to update project: %s", e)
        raise HTTPException(status_code=500, detail="Failed to update project")

    return UpdateProjectResponse(
        id=updated["id"],
        name=updated["name"],
        description=updated.get("description"),
    )


@router.get(
    "/projects/{project_id}/memory",
    response_model=ProjectMemoryResponse,
)
async def get_project_memory(
    project_id: str,
    db=Depends(get_db),
):
    """Retrieve all memory entries for a project (for dashboard display)."""
    # Verify project exists
    project = await queries.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    rows = await queries.get_memory_entries(db, project_id, limit=20)

    entries = [
        MemoryEntry(
            id=r["id"],
            project_id=r["project_id"],
            session_id=r.get("session_id"),
            entry_type=r["entry_type"],
            title=r["title"],
            content=r["content"],
            agents_involved=r.get("agents_involved", []),
            feature_classification=r.get("feature_classification"),
            relevance_tags=r.get("relevance_tags", []),
            created_at=r.get("created_at"),
        )
        for r in rows
    ]

    return ProjectMemoryResponse(
        project_id=project_id,
        entry_count=len(entries),
        entries=entries,
    )

@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    db=Depends(get_db),
):
    """Delete a project."""
    try:
        success = await queries.delete_project(db, project_id)
        return {"success": success}
    except Exception as e:
        logger.error("Failed to delete project: %s", e)
        raise HTTPException(status_code=400, detail=str(e))
