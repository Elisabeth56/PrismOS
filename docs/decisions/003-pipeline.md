# 003 Spec, review panel, resolve, build, verify

**Context.** The hackathon pipeline ran eight roles in about ten calls. Its "debate" was three independent
opinions with no shared artifact, and its prompts forced every agent to find a conflict.

**Decision.** A LangGraph state graph:

1. **File selector** (Groq) picks up to 15 files from the filtered tree.
2. **Planner** writes one spec with numbered items.
3. **Critics** (Architect, Security/QA, UX) review the same spec in parallel and object to item ids, with a
   severity and a proposed change. Nobody is told to find problems.
4. **Triage in code** turns objections into conflicts and notes.
5. **Resolver**, only when there are conflicts, returns exactly one decision per conflict id.
6. **Builder** returns file changes as path, action and full content.
7. **Verifier** checks the changes against the spec and decisions, with at most one revision back to the builder.

**Rejected.** Keeping eight roles and fixing the wiring. A single tool-using agent (harder to bound and to
evaluate in four days).

**Consequences.** Critics argue about the same items, so a disagreement is real and the resolver's conditional
edge means something.

## As built

- **The conflict rule changed.** The ADR said a conflict is "two critics proposing *incompatible* changes to the
  same item". Code can't judge compatibility, and asking a model would hide the rule in a prompt. As built:
  two or more critics objecting to the same item makes it **contested**, and one blocking objection makes it
  **blocking**; everything else is a note the builder applies. The resolver decides whether contested
  positions combine. This lives in `app/pipeline/review.py`, which has no I/O and is fully unit-tested.
- **Wrong answers get corrected, not trusted.** Decisions for the wrong conflict ids get one corrective round,
  then the step fails. Paths the file selector invents are dropped, objections to items that don't exist are
  dropped, and builder actions are fitted to the repo (modifying a file that doesn't exist becomes a create).
- **No LangGraph checkpointer.** Every model call goes through `ctx.cached_step`, which stores its output in
  `run_steps`. A retried run walks the graph again and finished steps return what they stored, so Postgres is
  the durability layer (ADR-004) and LangGraph only supplies the edges.
- First live run: 0 conflicts, 4 files changed, verified on the first build.
