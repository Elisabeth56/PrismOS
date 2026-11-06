# Each node reads keys that earlier nodes set; the edges guarantee the order, which pyright cannot see.
# pyright: reportTypedDictNotRequiredAccess=false
"""The run pipeline (ADR-003) as a LangGraph state graph:

    read_repo -> select_files -> plan -> review (3 critics in parallel) -> triage
        -> resolve (only when there are conflicts) -> build -> verify -> (one revision: build -> verify) -> ready

LangGraph gives the conditional edges and a graph we can draw. Durability is not LangGraph's job here:
every model call goes through ctx.cached_step, so a retried run walks the graph again and finished steps
return their stored output (ADR-004). No LangGraph checkpointer is used.
"""

from __future__ import annotations

import asyncio
import json
from collections.abc import Sequence
from typing import Any, Protocol, TypedDict

from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel

from app.ai import llm, prompting
from app.ai.llm import LLMOutputInvalid, Message, Size, Usage
from app.ai.prompting import TEMPERATURE, as_data, render, repo_files
from app.pipeline import persist
from app.pipeline.context import Pipeline, RunContext
from app.pipeline.outputs import BuildOutput, FileChange, FileSelection, ResolverOutput, VerifierOutput
from app.pipeline.repo import RepoFiles, RepoFor, RepoSnapshot
from app.pipeline.review import (
    Critic,
    CriticReview,
    Decision,
    ReviewOutcome,
    Spec,
    decision_problems,
    detect_conflicts,
)

CRITICS: tuple[Critic, ...] = ("architect", "security", "ux")
MAX_BUILDS = 2  # the first build plus at most one revision
SMALL_PROMPT_CHARS = 24_000  # about 6K tokens, inside Groq's free per-minute budget


class Generate(Protocol):
    async def __call__[T: BaseModel](
        self, messages: Sequence[Message], schema: type[T], *, size: Size = "large", temperature: float = 0.2
    ) -> tuple[T, list[Usage]]: ...


class State(TypedDict, total=False):
    snapshot: RepoSnapshot
    files: dict[str, str]
    omitted: list[str]
    spec: Spec
    outcome: ReviewOutcome
    decisions: list[Decision]
    build: BuildOutput
    verdict: VerifierOutput
    builds: int


def fit_to_repo(changes: list[FileChange], paths: set[str]) -> list[FileChange]:
    """Makes the actions agree with the repo: modifying a new file is a create, creating an existing one is a
    modify, deleting a file that isn't there is dropped. Cheaper and more reliable than another model call."""
    fitted: list[FileChange] = []
    for change in changes:
        exists = change.path in paths
        if change.action == "delete" and not exists:
            continue
        if change.action == "modify" and not exists:
            change = change.model_copy(update={"action": "create"})
        elif change.action == "create" and exists:
            change = change.model_copy(update={"action": "modify"})
        fitted.append(change)
    return fitted


def _json(value: Any) -> str:
    return json.dumps(value, indent=2, ensure_ascii=False)


def _decisions(state: State) -> str:
    decisions = state.get("decisions", [])
    return _json([d.model_dump() for d in decisions]) if decisions else "None: the critics raised no conflicts."


def _ask(prompt: str) -> list[Message]:
    return [{"role": "user", "content": prompt}]


def build_pipeline(repo_for: RepoFor, generate: Generate = llm.generate) -> Pipeline:
    async def pipeline(ctx: RunContext) -> None:
        run = ctx.run
        project = await _project(ctx)
        repo = repo_for(project)
        request = as_data("request", run["feature_request"])
        context = "\n\n".join(as_data("context", f["content"], name=f["name"]) for f in run["context_files"] or [])

        def files_block(state: State) -> str:
            omitted = state.get("omitted") or []
            note = f"Not shown (too large or over the context cap): {', '.join(omitted)}" if omitted else ""
            return "\n\n".join(part for part in (repo_files(state["files"]), note, context) if part)

        async def read_repo(state: State) -> State:
            async def produce():
                return await repo.snapshot(run["base_branch"]), []

            return {"snapshot": await ctx.cached_step("read_repo", RepoSnapshot, produce)}

        async def select_files(state: State) -> State:
            snapshot = state["snapshot"]
            prompt = render(
                "file_selector",
                request=request,
                repo=project["repo_full_name"],
                branch=run["base_branch"],
                tree=as_data("repo_file", "\n".join(snapshot.paths), path="(file tree)"),
            )
            # Groq's free tier caps tokens per minute; a big tree goes to Gemini instead (ADR-006)
            size: Size = "small" if len(prompt) <= SMALL_PROMPT_CHARS else "large"
            selection = await ctx.cached_step(
                "select_files",
                FileSelection,
                lambda: generate(_ask(prompt), FileSelection, size=size, temperature=TEMPERATURE["file_selector"]),
            )
            known = set(snapshot.paths)
            paths = [p for p in dict.fromkeys(selection.paths) if p in known]  # models do invent paths

            async def read():
                return await repo.read(snapshot.commit_sha, paths), []

            loaded = await ctx.cached_step("read_files", RepoFiles, read)
            await ctx.emit(
                "files_selected", {"paths": list(loaded.files), "omitted": loaded.omitted, "reason": selection.reason}
            )
            return {"files": loaded.files, "omitted": loaded.omitted}

        async def plan(state: State) -> State:
            async with ctx.pool.connection() as conn:
                memory = await persist.load_memory(conn, str(run["project_id"]))
            prompt = render(
                "planner",
                request=request,
                memory=as_data("memory", _json(memory) if memory else "No earlier runs on this project."),
                files=files_block(state),
            )
            spec = await ctx.cached_step(
                "plan", Spec, lambda: generate(_ask(prompt), Spec, temperature=TEMPERATURE["planner"])
            )
            return {"spec": spec}

        async def review(state: State) -> State:
            spec = state["spec"]
            known = {item.id for item in spec.items}

            async def critique(critic: Critic) -> CriticReview:
                prompt = render(
                    "critic",
                    critic=critic,
                    focus=prompting.load(f"critics/{critic}").strip(),
                    request=request,
                    spec=_json(spec.model_dump()),
                    files=files_block(state),
                )

                async def produce():
                    result, usage = await generate(_ask(prompt), CriticReview, temperature=TEMPERATURE["critic"])
                    # the critic's name is ours to set, and objections to items that don't exist are dropped
                    objections = [o for o in result.objections if o.item_id in known]
                    return CriticReview(critic=critic, objections=objections), usage

                return await ctx.cached_step(f"critic_{critic}", CriticReview, produce)

            reviews = await asyncio.gather(*(critique(c) for c in CRITICS))
            outcome = detect_conflicts(spec, list(reviews))
            async with ctx.pool.connection() as conn:
                await persist.save_conflicts(conn, ctx.run_id, outcome.conflicts)
            await ctx.emit("review_done", {"conflicts": len(outcome.conflicts), "notes": len(outcome.notes)})
            return {"outcome": outcome}

        async def resolve(state: State) -> State:
            conflicts = state["outcome"].conflicts
            prompt = render(
                "resolver",
                request=request,
                spec=_json(state["spec"].model_dump()),
                conflicts=_json([c.model_dump() for c in conflicts]),
            )

            async def produce():
                messages = _ask(prompt)
                result, usage = await generate(messages, ResolverOutput, temperature=TEMPERATURE["resolver"])
                problems = decision_problems(conflicts, result.decisions)
                if problems:
                    # valid JSON that answers the wrong conflicts: one corrective round, like generate's own retry
                    correction: list[Message] = [
                        {"role": "assistant", "content": result.model_dump_json()},
                        {"role": "user", "content": "Fix these and return all decisions:\n- " + "\n- ".join(problems)},
                    ]
                    result, more = await generate(
                        [*messages, *correction], ResolverOutput, temperature=TEMPERATURE["resolver"]
                    )
                    usage = usage + more
                    if decision_problems(conflicts, result.decisions):
                        raise LLMOutputInvalid("resolver decisions don't match the conflicts")
                return result, usage

            decisions = (await ctx.cached_step("resolve", ResolverOutput, produce)).decisions
            async with ctx.pool.connection() as conn:
                await persist.save_decisions(conn, ctx.run_id, decisions)
            return {"decisions": decisions}

        async def build(state: State) -> State:
            attempt = state.get("builds", 0) + 1
            revision = ""
            if attempt > 1:
                failures = [f.model_dump() for f in state["verdict"].failures]
                previous = "\n\n".join(
                    as_data("repo_file", c.content or "(deleted)", path=c.path, action=c.action)
                    for c in state["build"].changes
                )
                revision = (
                    "Revision: the verifier found these problems in your previous build. Fix them and return the "
                    f"complete change set again.\n{_json(failures)}\n\nYour previous build:\n{previous}"
                )
            prompt = render(
                "builder",
                request=request,
                spec=_json(state["spec"].model_dump()),
                decisions=_decisions(state),
                notes=_json([n.model_dump() for n in state["outcome"].notes]) if state["outcome"].notes else "None.",
                revision=revision,
                files=files_block(state),
            )
            output = await ctx.cached_step(
                "build",
                BuildOutput,
                lambda: generate(_ask(prompt), BuildOutput, temperature=TEMPERATURE["builder"]),
                attempt=attempt,
            )
            output = output.model_copy(update={"changes": fit_to_repo(output.changes, set(state["snapshot"].paths))})
            async with ctx.pool.connection() as conn:
                await persist.save_changes(conn, ctx.run_id, output.changes)
            return {"build": output, "builds": attempt}

        async def verify(state: State) -> State:
            changes = "\n\n".join(
                as_data("repo_file", c.content or "(deleted)", path=c.path, action=c.action)
                for c in state["build"].changes
            )
            prompt = render(
                "verifier",
                spec=_json(state["spec"].model_dump()),
                decisions=_decisions(state),
                changes=changes,
            )
            verdict = await ctx.cached_step(
                "verify",
                VerifierOutput,
                lambda: generate(_ask(prompt), VerifierOutput, temperature=TEMPERATURE["verifier"]),
                attempt=state["builds"],
            )
            return {"verdict": verdict}

        async def ready(state: State) -> State:
            async with ctx.pool.connection() as conn:
                handed_over = await persist.mark_ready(conn, ctx.run_id, state["verdict"])
            if handed_over:
                await ctx.emit("awaiting_approval", {"verdict": state["verdict"].verdict})
            return {}

        graph = StateGraph(State)
        for name, node in [
            ("read_repo", read_repo),
            ("select_files", select_files),
            ("plan", plan),
            ("review", review),
            ("resolve", resolve),
            ("build", build),
            ("verify", verify),
            ("ready", ready),
        ]:
            graph.add_node(name, node)
        graph.add_edge(START, "read_repo")
        graph.add_edge("read_repo", "select_files")
        graph.add_edge("select_files", "plan")
        graph.add_edge("plan", "review")
        graph.add_conditional_edges("review", lambda s: "resolve" if s["outcome"].needs_resolver else "build")
        graph.add_edge("resolve", "build")
        graph.add_edge("build", "verify")
        graph.add_conditional_edges(
            "verify",
            lambda s: "build" if s["verdict"].verdict == "needs_revision" and s["builds"] < MAX_BUILDS else "ready",
        )
        graph.add_edge("ready", END)
        await graph.compile().ainvoke({})

    return pipeline


async def _project(ctx: RunContext) -> dict[str, Any]:
    async with ctx.pool.connection() as conn:
        row = await (
            await conn.execute(
                "select repo_full_name, github_installation_id from projects where id = %s", (ctx.run["project_id"],)
            )
        ).fetchone()
    assert row is not None, "runs always belong to a project"
    return dict(row)
