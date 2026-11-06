"""Approving a run: the one moment PrismOS writes to the user's repository (ADR-001).

The run row stays locked while the PR is opened, so two clicks (or two tabs) can't open two PRs:
the second waits, then finds the run already has one and returns it.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

import httpx

from app.database import Conn
from app.errors import AppError
from app.features.runs.logic import NOT_FOUND, get_run
from app.features.runs.schemas import RunDetail
from app.github.app import GitHubApp
from app.github.pulls import FileWrite, open_pull_request
from app.pipeline.context import append_event
from app.pipeline.persist import remember_shipped

TITLE_CHARS = 72


async def approve_run(
    conn: Conn,
    user_id: str,
    run_id: UUID,
    github_app: GitHubApp | None,
    transport: httpx.AsyncBaseTransport | None = None,
) -> RunDetail:
    async with conn.transaction():
        run = await (
            await conn.execute(
                """select r.id, r.status::text as status, r.feature_request, r.base_branch, r.verdict,
                          p.repo_full_name, p.github_installation_id
                   from runs r join projects p on p.id = r.project_id
                   join project_members m on m.project_id = r.project_id and m.user_id = %s
                   where r.id = %s for update of r""",
                (user_id, run_id),
            )
        ).fetchone()
        if run is None:
            raise NOT_FOUND
        if run["status"] == "pr_opened":
            return await get_run(conn, user_id, run_id)
        if run["status"] != "awaiting_approval":
            raise AppError(409, "run_not_ready", "Only a run waiting for approval can open a pull request.")
        if github_app is None or run["github_installation_id"] is None:
            raise AppError(
                409, "github_not_connected", "Install the PrismOS GitHub App on this repository to open pull requests."
            )

        detail = await get_run(conn, user_id, run_id)
        if not detail.changes:
            raise AppError(409, "no_changes", "This run has no file changes to open a pull request with.")
        steps = detail.steps
        try:
            token = await github_app.installation_token(run["github_installation_id"], run["repo_full_name"])
            pr = await open_pull_request(
                token,
                run["repo_full_name"],
                base_branch=run["base_branch"],
                base_sha=steps["read_repo"]["commit_sha"],
                branch=f"prismos/run-{str(run_id)[:8]}",
                files=[FileWrite(c.path, None if c.action == "delete" else c.content) for c in detail.changes],
                title=pr_title(run["feature_request"]),
                body=pr_body(run, steps, detail),
                transport=transport,
            )
        except httpx.HTTPStatusError as error:
            status = error.response.status_code
            message = (
                "PrismOS no longer has write access to this repository. Check the app's installation settings."
                if status in (403, 404)
                else "GitHub didn't accept the pull request. Try approving again in a minute."
            )
            raise AppError(502, "github_failed", message, {"github_status": status}) from error

        await conn.execute(
            """update runs set status = 'pr_opened', pr_url = %s, pr_number = %s, finished_at = now()
               where id = %s""",
            (pr.url, pr.number, run_id),
        )
        await append_event(conn, str(run_id), "pr_opened", {"url": pr.url, "number": pr.number})
        await remember_shipped(
            conn,
            str(detail.project_id),
            str(run_id),
            pr_title(run["feature_request"]),
            steps.get("build", {}).get("summary") or run["feature_request"],
            [(c.ruling, c.rationale or "") for c in detail.conflicts if c.ruling],
        )
    return await get_run(conn, user_id, run_id)


def pr_title(request: str) -> str:
    line = " ".join(request.split())
    return line if len(line) <= TITLE_CHARS else line[: TITLE_CHARS - 1].rstrip() + "…"


def pr_body(run: dict[str, Any], steps: dict[str, Any], detail: RunDetail) -> str:
    """What a reviewer needs: the request, what changed, the spec it was built from and how disputes were settled."""
    spec = steps.get("plan", {})
    sections = [
        f"> {run['feature_request'].strip()}",
        "## What changed\n" + (steps.get("build", {}).get("summary") or "See the files below."),
        "## Spec\n" + "\n".join(f"{item['id']}. {item['text']}" for item in spec.get("items", [])),
    ]
    decided = [c for c in detail.conflicts if c.ruling]
    if decided:
        sections.append(
            "## Review decisions\n"
            + "\n".join(f"- **Item {c.item_id}** ({c.kind}): {c.ruling} {c.rationale or ''}".rstrip() for c in decided)
        )
    if run["verdict"] == "verified":
        sections.append("## Verification\nEvery spec item was checked against the changes.")
    else:
        failures = steps.get("verify", {}).get("failures", [])
        sections.append(
            "## Verification\nThe verifier still flagged these after one revision; review them closely:\n"
            + "\n".join(f"- Item {f['item_id']}: {f['problem']}" for f in failures)
        )
    sections.append("---\nOpened by PrismOS after review and approval.")
    return "\n\n".join(sections)
