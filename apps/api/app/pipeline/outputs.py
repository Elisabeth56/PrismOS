"""What each pipeline step must return. These are the schemas the LLM output is validated against."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.pipeline.review import Decision


class FileSelection(BaseModel):
    paths: list[str] = Field(max_length=15)
    reason: str = Field(max_length=600)


class ResolverOutput(BaseModel):
    decisions: list[Decision]


class FileChange(BaseModel):
    path: str = Field(min_length=1, max_length=300)
    action: Literal["create", "modify", "delete"]
    content: str | None = Field(default=None, description="The whole file after the change. Null only for delete.")
    summary: str = Field(max_length=300)

    @field_validator("path")
    @classmethod
    def path_stays_in_repo(cls, path: str) -> str:
        # same rule as the changes table: relative, no parent segments, never inside .git
        if path.startswith("/") or ".." in path or path.startswith(".git/") or "\0" in path:
            raise ValueError("path must be relative to the repository root and outside .git/")
        return path

    @model_validator(mode="after")
    def content_matches_action(self) -> FileChange:
        if (self.action == "delete") != (self.content is None):
            raise ValueError("content must be null for delete and the full file otherwise")
        return self


class BuildOutput(BaseModel):
    changes: list[FileChange] = Field(min_length=1, max_length=20)
    summary: str = Field(max_length=1000)


class VerifierFailure(BaseModel):
    item_id: str
    problem: str = Field(max_length=600)


class VerifierOutput(BaseModel):
    verdict: Literal["verified", "needs_revision"]
    items_checked: list[str]
    failures: list[VerifierFailure] = Field(default_factory=list)

    @model_validator(mode="after")
    def failures_match_verdict(self) -> VerifierOutput:
        if self.verdict == "verified" and self.failures:
            raise ValueError("a verified build has no failures")
        if self.verdict == "needs_revision" and not self.failures:
            raise ValueError("needs_revision must name at least one failure")
        return self
