import pytest
from pydantic import ValidationError

from app.pipeline.review import (
    CriticReview,
    Decision,
    DecisionsInvalid,
    Objection,
    Spec,
    SpecItem,
    UnknownSpecItem,
    decision_problems,
    detect_conflicts,
    validate_decisions,
)

SPEC = Spec(
    summary="Rate limit the login endpoint",
    items=[SpecItem(id=str(i), text=f"item {i}") for i in range(1, 7)],
)


def objection(item_id: str, severity: str = "major", change: str = "change it") -> Objection:
    return Objection(item_id=item_id, severity=severity, concern="concern", proposed_change=change)  # pyright: ignore[reportArgumentType]


def review(critic: str, *objections: Objection) -> CriticReview:
    return CriticReview(critic=critic, objections=list(objections))  # pyright: ignore[reportArgumentType]


# detection --------------------------------------------------------------------


def test_no_objections_means_no_conflicts_and_no_resolver():
    outcome = detect_conflicts(SPEC, [review("architect"), review("security"), review("ux")])

    assert outcome.conflicts == []
    assert outcome.notes == []
    assert not outcome.needs_resolver


def test_one_uncontested_objection_is_a_note():
    outcome = detect_conflicts(SPEC, [review("architect", objection("2")), review("security"), review("ux")])

    assert outcome.conflicts == []
    assert [(n.critic, n.item_id) for n in outcome.notes] == [("architect", "2")]


def test_two_critics_on_one_item_is_a_contested_conflict():
    outcome = detect_conflicts(
        SPEC, [review("architect", objection("3")), review("security", objection("3")), review("ux")]
    )

    assert len(outcome.conflicts) == 1
    conflict = outcome.conflicts[0]
    assert (conflict.id, conflict.item_id, conflict.kind) == ("c1", "3", "contested")
    assert {o.critic for o in conflict.objections} == {"architect", "security"}
    assert outcome.notes == []


def test_a_blocking_objection_alone_is_a_blocking_conflict():
    outcome = detect_conflicts(SPEC, [review("security", objection("4", "blocking"))])

    assert [(c.item_id, c.kind) for c in outcome.conflicts] == [("4", "blocking")]


def test_one_critic_objecting_twice_to_the_same_item_is_still_notes():
    outcome = detect_conflicts(SPEC, [review("ux", objection("5"), objection("5", "minor"))])

    assert outcome.conflicts == []
    assert len(outcome.notes) == 2


def test_mixed_review_splits_into_conflicts_and_notes_in_spec_order():
    outcome = detect_conflicts(
        SPEC,
        [
            review("architect", objection("6"), objection("3")),
            review("security", objection("3", "blocking"), objection("1", "blocking")),
            review("ux", objection("2", "minor")),
        ],
    )

    assert [(c.id, c.item_id, c.kind) for c in outcome.conflicts] == [("c1", "1", "blocking"), ("c2", "3", "contested")]
    assert sorted(n.item_id for n in outcome.notes) == ["2", "6"]


def test_objection_to_an_unknown_item_is_rejected():
    with pytest.raises(UnknownSpecItem, match="'9'"):
        detect_conflicts(SPEC, [review("architect", objection("9"))])


def test_spec_item_ids_must_be_unique():
    with pytest.raises(ValidationError):
        Spec(summary="s", items=[SpecItem(id="1", text="a"), SpecItem(id="1", text="b")])


# decisions --------------------------------------------------------------------

CONFLICTS = detect_conflicts(
    SPEC,
    [review("architect", objection("3")), review("security", objection("3"), objection("4", "blocking"))],
).conflicts


def decision(conflict_id: str) -> Decision:
    return Decision(conflict_id=conflict_id, ruling="do this", rationale="because", owners=["architect"])


def test_decisions_are_matched_by_id_not_position():
    decided = validate_decisions(CONFLICTS, [decision("c2"), decision("c1")])

    assert list(decided) == ["c2", "c1"]
    assert decided["c1"].conflict_id == "c1"


@pytest.mark.parametrize(
    ("decisions", "problem"),
    [
        (["c1"], "no decision for conflict 'c2'"),
        (["c1", "c2", "c2"], "more than one decision for conflict 'c2'"),
        (["c1", "c2", "c7"], "decision for unknown conflict 'c7'"),
    ],
)
def test_decisions_must_cover_every_conflict_exactly_once(decisions, problem):
    assert problem in decision_problems(CONFLICTS, [decision(d) for d in decisions])
    with pytest.raises(DecisionsInvalid):
        validate_decisions(CONFLICTS, [decision(d) for d in decisions])
