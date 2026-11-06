"""The eval: every case through the real pipeline and through a single-prompt baseline, scored the same way.

Calls real models, so it only runs when EVAL=1 (the `evals` GitHub Actions workflow sets it, with the API keys
as secrets). Results go to evals/results/latest.json and latest.md, and to the job summary.

    EVAL=1 TEST_DATABASE_URL=... uv run pytest evals/test_eval.py -s
"""

from __future__ import annotations

import asyncio
import json
import os
import time
from dataclasses import asdict
from pathlib import Path

import psycopg
import pytest
from psycopg.rows import DictRow, dict_row

from app.ai import llm
from app.ai.prompting import as_data, repo_files
from app.database import create_pool
from app.pipeline.graph import build_pipeline
from app.pipeline.outputs import BuildOutput, FileChange
from app.worker import Worker
from evals.harness import EVALS, Case, LocalRepo, fixture_files, load_cases, recall, score
from tests.conftest import needs_db
from tests.factories import make_project, make_run, make_user

pytestmark = [needs_db, pytest.mark.skipif(os.environ.get("EVAL") != "1", reason="set EVAL=1 to call real models")]

PAUSE_SECONDS = float(os.environ.get("EVAL_PAUSE_SECONDS", "20"))  # stay inside free per-minute limits

BASELINE = """You are a senior engineer. Implement the feature request below in this repository.
Return every file you create, modify or delete, with each changed file's complete new content.

{request}

{files}"""


async def run_pipeline(db_url: str, case: Case, files: dict[str, str]) -> dict:
    user = make_user(db_url)
    run_id = make_run(db_url, make_project(db_url, user), user, feature_request=case.request)
    pool = create_pool(db_url)
    await pool.open()
    started = time.monotonic()
    try:
        await Worker(pool, build_pipeline(lambda project: LocalRepo(files))).tick()
    finally:
        await pool.close()
    seconds = time.monotonic() - started

    with psycopg.Connection[DictRow].connect(db_url, row_factory=dict_row) as conn:
        run = conn.execute("select * from runs where id = %s", (run_id,)).fetchone()
        steps = {
            r["step"]: r["output"]
            for r in conn.execute("select step, output from run_steps where run_id = %s", (run_id,))
        }
        changes = conn.execute("select path, action, content from changes where run_id = %s", (run_id,)).fetchall()
        conflicts = conn.execute("select count(*) as n from conflicts where run_id = %s", (run_id,)).fetchone()
    assert run is not None and conflicts is not None
    change_set = [FileChange(path=c["path"], action=c["action"], content=c["content"], summary="") for c in changes]
    selected = (steps.get("select_files") or {}).get("paths", [])
    return {
        "status": run["status"],
        "error": run["error"],
        "verdict": run["verdict"],
        "conflicts": conflicts["n"],
        "file_recall": recall(selected, case.must_touch),
        "tokens": run["tokens_in"] + run["tokens_out"],
        "seconds": round(seconds, 1),
        "score": asdict(score(case, files, change_set)),
    }


async def run_baseline(case: Case, files: dict[str, str]) -> dict:
    # the baseline sees the whole repo, which the pipeline doesn't: on a 14-file fixture that's its advantage
    prompt = BASELINE.format(request=as_data("request", case.request), files=repo_files(files))
    started = time.monotonic()
    try:
        output, usage = await llm.generate([{"role": "user", "content": prompt}], BuildOutput, temperature=0.2)
    except (llm.LLMUnavailable, llm.LLMOutputInvalid) as error:
        return {"status": "failed", "error": str(error), "tokens": 0, "seconds": 0, "score": None}
    return {
        "status": "done",
        "tokens": sum(u.tokens_in + u.tokens_out for u in usage),
        "seconds": round(time.monotonic() - started, 1),
        "score": asdict(score(case, files, output.changes)),
    }


def pct(numerator: float, denominator: float) -> str:
    return f"{round(100 * numerator / denominator)}%" if denominator else "n/a"


def report(results: list[dict]) -> str:
    def totals(system: str) -> tuple[int, int, int, float, int, float]:
        rows = [r[system] for r in results]
        scored = [r["score"] for r in rows if r["score"]]
        return (
            sum(s["checks_passed"] for s in scored),
            sum(len(load_case(r["case"]).checks) for r in results),
            sum(1 for r in rows if r["status"] in ("awaiting_approval", "done")),
            sum(s["must_touch_recall"] for s in scored) / len(results),
            sum(r["tokens"] for r in rows) // len(results),
            sorted(r["seconds"] for r in rows)[len(rows) // 2],
        )

    p, b = totals("pipeline"), totals("baseline")
    lines = [
        f"Cases: {len(results)} · models: {llm.model_chain('large')[0].name} (large), {llm.model_chain('small')[0].name} (small)",
        "",
        "| | PrismOS pipeline | Single prompt |",
        "|---|---|---|",
        f"| Acceptance checks passed | {p[0]}/{p[1]} ({pct(p[0], p[1])}) | {b[0]}/{b[1]} ({pct(b[0], b[1])}) |",
        f"| Runs that finished | {p[2]}/{len(results)} | {b[2]}/{len(results)} |",
        f"| Changed the files that must change | {round(100 * p[3])}% | {round(100 * b[3])}% |",
        f"| File selection recall | {pct(sum(r['pipeline']['file_recall'] for r in results), len(results))} | sees every file |",
        f"| Verified by the verifier | {sum(r['pipeline']['verdict'] == 'verified' for r in results)}/{len(results)} | no verifier |",
        f"| Conflicts raised | {sum(r['pipeline']['conflicts'] for r in results)} | none |",
        f"| Tokens per case | {p[4]:,} | {b[4]:,} |",
        f"| Median seconds per case | {p[5]} | {b[5]} |",
        "",
        "| Case | Pipeline | Single prompt | Pipeline missed |",
        "|---|---|---|---|",
    ]
    for r in results:
        ps, bs = r["pipeline"]["score"], r["baseline"]["score"]
        cell = lambda s, run: f"{s['checks_passed']}/{s['checks_total']}" if s else f"failed ({run['status']})"  # noqa: E731
        lines.append(
            f"| {r['case']} | {cell(ps, r['pipeline'])} | {cell(bs, r['baseline'])} | {', '.join(ps['failed']) if ps else ''} |"
        )
    return "\n".join(lines) + "\n"


def load_case(case_id: str) -> Case:
    return next(c for c in load_cases() if c.id == case_id)


async def test_eval(migrated_db_url):
    files = fixture_files()
    only = os.environ.get("EVAL_CASES")
    cases = [c for c in load_cases() if not only or c.id in only.split(",")]
    results = []
    for i, case in enumerate(cases):
        if i:
            await asyncio.sleep(PAUSE_SECONDS)
        pipeline = await run_pipeline(migrated_db_url, case, files)
        await asyncio.sleep(PAUSE_SECONDS)
        baseline = await run_baseline(case, files)
        results.append({"case": case.id, "pipeline": pipeline, "baseline": baseline})
        print(
            f"{case.id}: pipeline {pipeline['score'] and pipeline['score']['checks_passed']} · baseline {baseline['score'] and baseline['score']['checks_passed']}"
        )

    out = EVALS / "results"
    out.mkdir(exist_ok=True)
    (out / "latest.json").write_text(json.dumps(results, indent=2, default=str))
    markdown = report(results)
    (out / "latest.md").write_text(markdown)
    if summary := os.environ.get("GITHUB_STEP_SUMMARY"):
        Path(summary).write_text("## PrismOS eval\n\n" + markdown)
    print(markdown)
