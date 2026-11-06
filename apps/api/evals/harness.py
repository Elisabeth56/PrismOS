"""Scoring for the eval: a local repo the pipeline can read, applying a change set, and checking the result.

Pure functions, so the scoring itself is tested without calling any model (evals/test_harness.py).
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from fnmatch import fnmatch
from pathlib import Path

from app.github.repo import worth_reading
from app.pipeline.outputs import FileChange
from app.pipeline.repo import RepoFiles, RepoSnapshot

EVALS = Path(__file__).parent
FIXTURE = EVALS / "fixtures" / "notes-api"


@dataclass
class Check:
    path: str
    pattern: str
    why: str
    absent: bool = False


@dataclass
class Case:
    id: str
    request: str
    must_touch: list[str]
    checks: list[Check]


def load_cases() -> list[Case]:
    raw = json.loads((EVALS / "cases.json").read_text())
    return [Case(c["id"], c["request"], c["must_touch"], [Check(**k) for k in c["checks"]]) for c in raw]


def fixture_files(root: Path = FIXTURE) -> dict[str, str]:
    return {str(p.relative_to(root)): p.read_text() for p in sorted(root.rglob("*")) if p.is_file()}


class LocalRepo:
    """The fixture repo behind the same interface the GitHub reader has."""

    def __init__(self, files: dict[str, str]):
        self.files = files

    async def snapshot(self, branch: str) -> RepoSnapshot:
        paths = [p for p, text in self.files.items() if worth_reading(p, len(text.encode()), 100_000)]
        return RepoSnapshot(commit_sha="fixture", paths=paths)

    async def read(self, commit_sha: str, paths: list[str]) -> RepoFiles:
        return RepoFiles(files={p: self.files[p] for p in paths if p in self.files})


def apply(files: dict[str, str], changes: list[FileChange]) -> dict[str, str]:
    result = dict(files)
    for change in changes:
        if change.action == "delete":
            result.pop(change.path, None)
        else:
            result[change.path] = change.content or ""
    return result


def run_check(files: dict[str, str], check: Check) -> bool:
    matching = [text for path, text in files.items() if fnmatch(path, check.path)]
    found = any(re.search(check.pattern, text, re.IGNORECASE) for text in matching)
    return not found if check.absent else found


@dataclass
class Score:
    checks_passed: int
    checks_total: int
    touched: list[str]
    must_touch_recall: float
    failed: list[str] = field(default_factory=list)


def score(case: Case, before: dict[str, str], changes: list[FileChange]) -> Score:
    after = apply(before, changes)
    results = [(check, run_check(after, check)) for check in case.checks]
    touched = sorted({c.path for c in changes})
    hits = sum(1 for path in case.must_touch if path in touched)
    return Score(
        checks_passed=sum(ok for _, ok in results),
        checks_total=len(results),
        touched=touched,
        must_touch_recall=hits / len(case.must_touch),
        failed=[check.why for check, ok in results if not ok],
    )


def recall(selected: list[str], must_touch: list[str]) -> float:
    return sum(1 for path in must_touch if path in selected) / len(must_touch)
