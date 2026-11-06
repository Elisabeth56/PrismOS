# Architecture decisions

Written before the rebuild (Phase 2, 2026-10-29) and updated with what changed once the code met real
providers and real users. Each record keeps the original decision and adds an "As built" section, so the
reasoning and the corrections are both visible.

| # | Decision |
|---|---|
| [000](000-requirements.md) | Requirements, data shape and access patterns |
| [001](001-github-app.md) | Deliver a PR through a GitHub App, behind user approval |
| [002](002-llm-providers.md) | Gemini Flash for large calls, Groq for small ones, one `llm.py` |
| [003](003-pipeline.md) | Spec, review panel, resolve, build, verify |
| [004](004-durable-runs.md) | Postgres job queue, `run_events` and Supabase Realtime |
| [005](005-auth-and-teams.md) | Supabase Auth with GitHub, plus `project_members` |
| [006](006-codebase-grounding.md) | Filtered repo tree and model-picked files |
| [007](007-postgres.md) | Postgres, not a document store |
