# 000 Requirements

**What it does.** A solo developer or team member signs in with GitHub, installs the PrismOS GitHub App on
the repos they choose and describes a feature (optionally attaching files). PrismOS reads the relevant code,
writes a numbered spec, has three critics review it, resolves real disagreements, writes the change and
verifies it. The run stops for the user's approval; on approval it opens a PR on a new branch. It never
pushes to the default branch.

**Data shape** (Postgres, `jsonb` for structured model output)

- users ─< project_members >─ projects ─< runs
- runs ─< run_steps (one per step: structured output, model, tokens, latency)
- runs ─< run_events (ordered log: seq, type, payload)
- runs ─< conflicts ── decisions
- runs ─< changes (path, action, full content; becomes the PR)
- projects ─< memory_entries

**Access patterns**

1. Create a run and never lose it: insert `queued`, return 202.
2. A worker claims a run exactly once: `FOR UPDATE SKIP LOCKED`.
3. Append events in order per run.
4. Watch a run after a refresh, in two tabs or joining late: read events after the last seen `seq`, then subscribe.
5. Run page: run, steps, conflicts, decisions and changes in one read.
6. A project's runs, newest first, visible only to members.
7. Approve and open the PR, idempotently.
8. Load project memory: latest entries by kind.

**Scale.** Under 100 runs a day. **Constraints.** Free tiers only, a four-day rebuild, one maintainer, moving
off Alibaba Cloud.
