"""The scoring rules, checked without any model."""

from app.pipeline.outputs import FileChange
from evals.harness import Case, Check, LocalRepo, fixture_files, load_cases, recall, score


def test_every_case_is_well_formed_and_its_files_exist():
    files = fixture_files()
    cases = load_cases()
    assert len({c.id for c in cases}) == len(cases) >= 6
    for case in cases:
        assert all(path in files for path in case.must_touch), case.id


def test_changing_nothing_never_scores_full_marks():
    """Otherwise a case would reward a system that did nothing."""
    files = fixture_files()
    for case in load_cases():
        result = score(case, files, [])
        assert result.checks_passed < result.checks_total, case.id
        assert result.must_touch_recall == 0, case.id


def test_a_change_that_meets_the_checks_scores_full_marks():
    case = Case(
        "x", "r", ["app/a.py"], [Check("app/a.py", "429", "429"), Check("app/a.py", "old", "gone", absent=True)]
    )
    change = FileChange(path="app/a.py", action="modify", content="raise HTTPException(429)", summary="s")
    result = score(case, {"app/a.py": "old"}, [change])
    assert (result.checks_passed, result.must_touch_recall, result.failed) == (2, 1.0, [])


def test_recall_counts_only_the_files_that_matter():
    assert recall(["app/a.py", "README.md"], ["app/a.py", "app/b.py"]) == 0.5


async def test_the_local_repo_filters_like_github():
    repo = LocalRepo({"app/a.py": "x", "node_modules/x.js": "y", "uv.lock": "z"})
    assert (await repo.snapshot("main")).paths == ["app/a.py"]
