import pytest
from pydantic import ValidationError

from app.pipeline.outputs import FileChange, VerifierOutput


@pytest.mark.parametrize("path", ["/etc/passwd", "../secrets", "a/../../b", ".git/config"])
def test_change_paths_stay_inside_the_repo(path):
    with pytest.raises(ValidationError):
        FileChange(path=path, action="create", content="x", summary="s")


def test_delete_has_no_content_and_everything_else_does():
    FileChange(path="a.py", action="delete", content=None, summary="s")
    with pytest.raises(ValidationError):
        FileChange(path="a.py", action="delete", content="left over", summary="s")
    with pytest.raises(ValidationError):
        FileChange(path="a.py", action="modify", content=None, summary="s")


def test_verdict_and_failures_must_agree():
    VerifierOutput(verdict="verified", items_checked=["1"])
    with pytest.raises(ValidationError):
        VerifierOutput(verdict="verified", items_checked=["1"], failures=[{"item_id": "1", "problem": "p"}])  # pyright: ignore[reportArgumentType]
    with pytest.raises(ValidationError):
        VerifierOutput(verdict="needs_revision", items_checked=["1"])
