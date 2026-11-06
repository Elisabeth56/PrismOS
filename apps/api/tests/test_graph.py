"""The pipeline end to end against the test database, with a fake repo and scripted model answers."""

from collections import Counter
from collections.abc import Callable, Sequence
from typing import Any

import psycopg
import pytest
from pydantic import BaseModel

from app.ai.llm import Message, Usage
from app.database import create_pool
from app.pipeline.graph import build_pipeline, fit_to_repo
from app.pipeline.outputs import BuildOutput, FileChange, FileSelection, ResolverOutput, VerifierOutput
from app.pipeline.repo import RepoSnapshot
from app.pipeline.review import CriticReview, Decision, Objection, Spec, SpecItem
from app.worker import Worker
from tests.conftest import needs_db
from tests.factories import make_project, make_run, make_user

USAGE = [Usage(model="fake", tokens_in=1, tokens_out=1, latency_ms=1)]
SPEC = Spec(summary="Add a limit.", items=[SpecItem(id="1", text="Limit logins."), SpecItem(id="2", text="Test it.")])
BUILD = BuildOutput(
    changes=[FileChange(path="app/auth.py", action="modify", content="limited = True\n", summary="limit")],
    summary="Adds the limit.",
)
VERIFIED = VerifierOutput(verdict="verified", items_checked=["1", "2"])
NEEDS_WORK = VerifierOutput.model_validate(
    {"verdict": "needs_revision", "items_checked": ["1", "2"], "failures": [{"item_id": "2", "problem": "no test"}]}
)


def objection(item_id: str = "1", severity: str = "major") -> Objection:
    return Objection.model_validate({"item_id": item_id, "severity": severity, "concern": "c", "proposed_change": "p"})


class FakeRepo:
    async def snapshot(self, repo: str, branch: str) -> RepoSnapshot:
        return RepoSnapshot(commit_sha="abc123", paths=["app/auth.py", "tests/test_auth.py"])

    async def read(self, repo: str, commit_sha: str, paths: list[str]) -> dict[str, str]:
        return {path: f"# {path}\n" for path in paths}


class FakeModels:
    """Answers by schema; critics by name. Each answer can be a value or a list consumed in order."""

    def __init__(self, **answers: Any):
        self.answers = {
            "FileSelection": FileSelection(paths=["app/auth.py", "invented.py"], reason="r"),
            "Spec": SPEC,
            "architect": CriticReview(critic="architect"),
            "security": CriticReview(critic="security"),
            "ux": CriticReview(critic="ux"),
            "BuildOutput": BUILD,
            "VerifierOutput": VERIFIED,
            **answers,
        }
        self.calls: Counter[str] = Counter()
        self.prompts: dict[str, str] = {}

    async def __call__(self, messages: Sequence[Message], schema: type[BaseModel], **_: Any):
        prompt = str(messages[0].get("content"))
        key = schema.__name__
        if schema is CriticReview:
            key = next(c for c in ("architect", "security", "ux") if f"You are the {c} critic" in prompt)
        self.calls[key] += 1
        self.prompts[key] = prompt
        answer = self.answers[key]
        if isinstance(answer, list):
            answer = answer.pop(0)
        if isinstance(answer, Exception):
            raise answer
        return answer, USAGE


@pytest.fixture
async def pool(migrated_db_url):
    pool = create_pool(migrated_db_url)
    await pool.open()
    async with pool.connection() as conn:
        await conn.execute("update runs set status = 'cancelled' where status in ('queued', 'running')")
    yield pool
    await pool.close()


@pytest.fixture
def run_id(migrated_db_url) -> str:
    user = make_user(migrated_db_url)
    return make_run(migrated_db_url, make_project(migrated_db_url, user), user)


def query(db_url: str, sql: str, run_id: str) -> list[tuple]:
    with psycopg.connect(db_url) as conn:
        return conn.execute(sql, (run_id,)).fetchall()  # pyright: ignore[reportArgumentType]


async def run(pool, models: Callable) -> None:
    await Worker(pool, build_pipeline(FakeRepo(), models)).tick()  # pyright: ignore[reportArgumentType]


@needs_db
async def test_a_contested_item_is_resolved_built_verified_and_handed_over(pool, run_id, migrated_db_url):
    models = FakeModels(
        architect=CriticReview(critic="architect", objections=[objection()]),
        security=CriticReview(critic="security", objections=[objection(severity="blocking")]),
        ResolverOutput=ResolverOutput(
            decisions=[Decision(conflict_id="c1", ruling="Both.", rationale="They combine.", owners=["architect"])]
        ),
    )

    await run(pool, models)

    status, verdict = query(migrated_db_url, "select status, verdict from runs where id = %s", run_id)[0]
    assert (status, verdict) == ("awaiting_approval", "verified")
    assert query(
        migrated_db_url,
        "select c.label, c.kind, d.ruling, d.owner from conflicts c join decisions d on d.conflict_id = c.id "
        "where c.run_id = %s",
        run_id,
    ) == [("c1", "contested", "Both.", "architect")]
    assert query(migrated_db_url, "select path, action from changes where run_id = %s", run_id) == [
        ("app/auth.py", "modify")
    ]
    types = [r[0] for r in query(migrated_db_url, "select type from run_events where run_id = %s order by seq", run_id)]
    assert "review_done" in types and types[-1] == "awaiting_approval"
    # the invented path never reaches the builder
    assert 'path="app/auth.py"' in models.prompts["BuildOutput"]
    assert "invented.py" not in models.prompts["BuildOutput"]


@needs_db
async def test_without_conflicts_the_resolver_is_skipped(pool, run_id, migrated_db_url):
    models = FakeModels(ux=CriticReview(critic="ux", objections=[objection(severity="minor")]))

    await run(pool, models)

    assert "ResolverOutput" not in models.calls
    assert query(migrated_db_url, "select count(*) from conflicts where run_id = %s", run_id) == [(0,)]
    assert '"critic": "ux"' in models.prompts["BuildOutput"]  # the note still reaches the builder


@needs_db
async def test_a_failed_verification_gets_exactly_one_revision(pool, run_id, migrated_db_url):
    models = FakeModels(VerifierOutput=[NEEDS_WORK, NEEDS_WORK])

    await run(pool, models)

    assert (models.calls["BuildOutput"], models.calls["VerifierOutput"]) == (2, 2)
    assert "no test" in models.prompts["BuildOutput"]
    assert query(migrated_db_url, "select status, verdict from runs where id = %s", run_id) == [
        ("awaiting_approval", "needs_revision")
    ]


@needs_db
async def test_decisions_for_the_wrong_conflicts_get_one_correction(pool, run_id, migrated_db_url):
    wrong = ResolverOutput(decisions=[Decision(conflict_id="c9", ruling="r", rationale="r")])
    right = ResolverOutput(decisions=[Decision(conflict_id="c1", ruling="r", rationale="r")])
    models = FakeModels(
        security=CriticReview(critic="security", objections=[objection(severity="blocking")]),
        ResolverOutput=[wrong, right],
    )

    await run(pool, models)

    assert models.calls["ResolverOutput"] == 2
    assert query(migrated_db_url, "select status from runs where id = %s", run_id) == [("awaiting_approval",)]


@needs_db
async def test_a_retried_run_does_not_call_models_for_finished_steps(pool, run_id, migrated_db_url):
    models = FakeModels(BuildOutput=[RuntimeError("worker died"), BUILD])

    await run(pool, models)
    assert query(migrated_db_url, "select status from runs where id = %s", run_id) == [("failed",)]
    with psycopg.connect(migrated_db_url, autocommit=True) as conn:
        conn.execute("update runs set status = 'queued' where id = %s", (run_id,))
    await run(pool, models)

    assert models.calls["Spec"] == 1 and models.calls["architect"] == 1
    assert models.calls["BuildOutput"] == 2
    assert query(migrated_db_url, "select status from runs where id = %s", run_id) == [("awaiting_approval",)]


def test_actions_are_fitted_to_what_the_repo_has():
    changes = [
        FileChange(path="new.py", action="modify", content="x", summary="s"),
        FileChange(path="old.py", action="create", content="x", summary="s"),
        FileChange(path="gone.py", action="delete", summary="s"),
    ]
    fitted = fit_to_repo(changes, {"old.py"})
    assert [(c.path, c.action) for c in fitted] == [("new.py", "create"), ("old.py", "modify")]
