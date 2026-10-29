"""Turns an approved run into a pull request with the Git Data API: one tree, one commit, one branch, one PR.
Nothing is cloned. Every call can be repeated: an existing branch is moved to the new commit, and an open
PR for the branch is reused.
"""

from __future__ import annotations

from collections.abc import Awaitable
from dataclasses import dataclass
from typing import Any

import httpx

from app.github.app import API, HEADERS


@dataclass
class FileWrite:
    path: str
    content: str | None  # None deletes the file


@dataclass
class PullRequest:
    url: str
    number: int


async def open_pull_request(
    token: str,
    repo: str,
    *,
    base_branch: str,
    base_sha: str,
    branch: str,
    files: list[FileWrite],
    title: str,
    body: str,
    transport: httpx.AsyncBaseTransport | None = None,
) -> PullRequest:
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(base_url=API, headers=headers, timeout=30, transport=transport) as http:
        base = await _ok(http.get(f"/repos/{repo}/git/commits/{base_sha}"))
        # inline content creates the blobs; sha=None removes a path from the tree
        entries = [
            {"path": f.path, "mode": "100644", "type": "blob", "content": f.content}
            if f.content is not None
            else {"path": f.path, "mode": "100644", "type": "blob", "sha": None}
            for f in files
        ]
        tree = await _ok(
            http.post(f"/repos/{repo}/git/trees", json={"base_tree": base["tree"]["sha"], "tree": entries})
        )
        commit = await _ok(
            http.post(f"/repos/{repo}/git/commits", json={"message": title, "tree": tree["sha"], "parents": [base_sha]})
        )

        created = await http.post(f"/repos/{repo}/git/refs", json={"ref": f"refs/heads/{branch}", "sha": commit["sha"]})
        if created.status_code == 422:  # the branch is ours from an earlier attempt: point it at this commit
            await _ok(http.patch(f"/repos/{repo}/git/refs/heads/{branch}", json={"sha": commit["sha"], "force": True}))
        else:
            created.raise_for_status()

        opened = await http.post(
            f"/repos/{repo}/pulls", json={"title": title, "head": branch, "base": base_branch, "body": body}
        )
        if opened.status_code == 422:  # already open for this branch
            owner = repo.split("/")[0]
            existing = await _ok(
                http.get(f"/repos/{repo}/pulls", params={"head": f"{owner}:{branch}", "state": "open"})
            )
            if existing:
                return PullRequest(url=existing[0]["html_url"], number=existing[0]["number"])
        opened.raise_for_status()
        pr = opened.json()
        return PullRequest(url=pr["html_url"], number=pr["number"])


async def _ok(request: Awaitable[httpx.Response]) -> Any:
    response = await request
    response.raise_for_status()
    return response.json()
