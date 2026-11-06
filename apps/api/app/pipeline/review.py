"""How critics' objections become conflicts, and the contract the resolver's decisions must meet (ADR-003).

Pure functions, no I/O. The rule is deterministic so the resolver only ever sees real disagreements:
  - two or more critics object to the same spec item      -> a "contested" conflict
  - a single critic marks an objection as blocking          -> a "blocking" conflict
  - anything else                                           -> a note, applied without a ruling
Whether contested changes can be combined is a judgement, so that part is the resolver's job.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Literal

from pydantic import BaseModel, Field, field_validator

Critic = Literal["architect", "security", "ux"]
Severity = Literal["minor", "major", "blocking"]


class SpecItem(BaseModel):
    id: str = Field(pattern=r"^[1-9][0-9]{0,2}$")
    text: str = Field(min_length=1, max_length=600)


class Spec(BaseModel):
    summary: str = Field(min_length=1, max_length=1000)
    items: list[SpecItem] = Field(min_length=1, max_length=30)

    @field_validator("items")
    @classmethod
    def ids_are_unique(cls, items: list[SpecItem]) -> list[SpecItem]:
        ids = [item.id for item in items]
        if len(ids) != len(set(ids)):
            raise ValueError("spec item ids must be unique")
        return items


class Objection(BaseModel):
    item_id: str
    severity: Severity
    concern: str = Field(min_length=1, max_length=600)
    proposed_change: str = Field(min_length=1, max_length=600)


class CriticReview(BaseModel):
    """One critic's output. An empty list is a valid review: critics are never required to object."""

    critic: Critic
    objections: list[Objection] = Field(default_factory=list, max_length=10)


class RaisedObjection(Objection):
    critic: Critic


class Conflict(BaseModel):
    id: str
    item_id: str
    kind: Literal["contested", "blocking"]
    objections: list[RaisedObjection]


class Decision(BaseModel):
    conflict_id: str
    ruling: str = Field(min_length=1, max_length=800)
    rationale: str = Field(min_length=1, max_length=800)
    owners: list[Critic] = Field(default_factory=list)


class ReviewOutcome(BaseModel):
    conflicts: list[Conflict]
    notes: list[RaisedObjection]

    @property
    def needs_resolver(self) -> bool:
        return bool(self.conflicts)


class UnknownSpecItem(ValueError):
    """A critic objected to an item that isn't in the spec; the review is invalid, not a conflict."""


class DecisionsInvalid(ValueError):
    """The resolver's decisions don't cover the conflicts exactly once each."""

    def __init__(self, problems: list[str]):
        super().__init__("; ".join(problems))
        self.problems = problems


def detect_conflicts(spec: Spec, reviews: list[CriticReview]) -> ReviewOutcome:
    """Groups every objection by spec item and classifies each item as contested, blocking or notes only."""
    known = {item.id for item in spec.items}
    by_item: dict[str, list[RaisedObjection]] = defaultdict(list)
    for review in reviews:
        for objection in review.objections:
            if objection.item_id not in known:
                raise UnknownSpecItem(f"{review.critic} objected to unknown spec item {objection.item_id!r}")
            by_item[objection.item_id].append(RaisedObjection(critic=review.critic, **objection.model_dump()))

    conflicts: list[Conflict] = []
    notes: list[RaisedObjection] = []
    # walk items in spec order so conflict ids (c1, c2...) are stable for the same input
    for item in spec.items:
        objections = by_item.get(item.id, [])
        critics = {o.critic for o in objections}
        if len(critics) >= 2:
            kind: Literal["contested", "blocking"] | None = "contested"
        elif any(o.severity == "blocking" for o in objections):
            kind = "blocking"
        else:
            kind = None
        if kind is None:
            notes.extend(objections)
        else:
            conflicts.append(Conflict(id=f"c{len(conflicts) + 1}", item_id=item.id, kind=kind, objections=objections))
    return ReviewOutcome(conflicts=conflicts, notes=notes)


def decision_problems(conflicts: list[Conflict], decisions: list[Decision]) -> list[str]:
    """Everything wrong with a set of decisions, phrased so it can be sent back to the resolver."""
    expected = {c.id for c in conflicts}
    seen: set[str] = set()
    problems: list[str] = []
    for decision in decisions:
        if decision.conflict_id not in expected:
            problems.append(f"decision for unknown conflict {decision.conflict_id!r}")
        elif decision.conflict_id in seen:
            problems.append(f"more than one decision for conflict {decision.conflict_id!r}")
        seen.add(decision.conflict_id)
    problems.extend(f"no decision for conflict {cid!r}" for cid in sorted(expected - seen))
    return problems


def validate_decisions(conflicts: list[Conflict], decisions: list[Decision]) -> dict[str, Decision]:
    """Returns decisions keyed by conflict id, matched by id and never by position."""
    problems = decision_problems(conflicts, decisions)
    if problems:
        raise DecisionsInvalid(problems)
    return {d.conflict_id: d for d in decisions}
