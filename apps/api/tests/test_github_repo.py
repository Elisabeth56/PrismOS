"""The GitHub repo reader against a mocked API: filtering, the context cap, and access errors."""

import httpx
import pytest

from app.github.repo import CONTEXT_CHARS, GitHubRepo, prioritise, static_token, worth_reading
from app.pipeline.repo import RepoUnavailable

SHA = "deadbeef"


def repo(handler, token: str | None = "tok") -> GitHubRepo:
    return GitHubRepo("acme/app", static_token(token), max_file_bytes=100_000, transport=httpx.MockTransport(handler))


def tree(*entries: tuple[str, int]) -> dict:
    return {"truncated": False, "tree": [{"path": p, "type": "blob", "size": s} for p, s in entries]}


@pytest.mark.parametrize(
    ("path", "size", "expected"),
    [
        ("src/app.py", 10, True),
        ("node_modules/react/index.js", 10, False),
        ("apps/web/.next/server.js", 10, False),
        ("pnpm-lock.yaml", 10, False),
        ("public/logo.png", 10, False),
        ("static/app.min.js", 10, False),
        ("src/huge.py", 200_000, False),
    ],
)
def test_only_readable_source_is_offered(path, size, expected):
    assert worth_reading(path, size, max_bytes=100_000) is expected


def test_huge_trees_keep_the_shallowest_paths():
    paths = [f"deep/a/b/c/{i}.py" for i in range(5000)] + ["README.md", "src/main.py"]
    kept = prioritise(paths, limit=100)
    assert len(kept) == 100 and "README.md" in kept and "src/main.py" in kept


async def test_snapshot_pins_the_commit_and_filters_the_tree():
    seen: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        if request.url.path == "/repos/acme/app/commits/main":
            return httpx.Response(200, json={"sha": SHA})
        assert request.url.path == f"/repos/acme/app/git/trees/{SHA}"
        return httpx.Response(200, json=tree(("src/app.py", 50), ("yarn.lock", 50), ("dist/app.js", 50)))

    snapshot = await repo(handler).snapshot("main")

    assert snapshot.commit_sha == SHA and snapshot.paths == ["src/app.py"]
    assert seen[0].headers["Authorization"] == "Bearer tok"


async def test_works_on_a_repo_with_thousands_of_files():
    entries = [(f"pkg{i // 100}/mod{i}.py", 100) for i in range(6000)]

    def handler(request: httpx.Request) -> httpx.Response:
        if "/commits/" in request.url.path:
            return httpx.Response(200, json={"sha": SHA})
        return httpx.Response(200, json=tree(*entries))

    snapshot = await repo(handler).snapshot("main")

    assert 0 < len(snapshot.paths) <= 4000


async def test_a_missing_branch_is_reported_clearly():
    snapshot = repo(lambda request: httpx.Response(404, json={"message": "Not Found"})).snapshot("nope")
    with pytest.raises(RepoUnavailable):
        await snapshot


async def test_reading_stops_at_the_context_cap_and_lists_what_was_left_out():
    big = "x" * (CONTEXT_CHARS - 3)  # nothing else fits after this

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["ref"] == SHA
        name = request.url.path.rsplit("/", 1)[-1]
        if name == "missing.py":
            return httpx.Response(404)
        if name == "logo.bin":
            return httpx.Response(200, content=b"\xff\xfe\x00")
        return httpx.Response(200, text=big if name == "big.py" else "small")

    files = await repo(handler, token=None).read(SHA, ["big.py", "next.py", "missing.py", "logo.bin", "tiny.py"])

    assert list(files.files) == ["big.py"]
    assert files.omitted == ["next.py", "missing.py", "logo.bin", "tiny.py"]
