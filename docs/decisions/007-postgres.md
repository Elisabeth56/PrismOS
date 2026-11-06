# 007 Postgres, not a document store

**Context.** A run is read as one whole object, which looks document-shaped.

**Decision.** Postgres (Supabase) with `jsonb` for nested model output.

**Rejected.** MongoDB or Firestore.

**Consequences.** Reading a whole run is one indexed query either way. Postgres also gives the RLS joins
across members, projects and runs, foreign keys from decisions to conflicts, the job queue's exactly-once
claim, and Auth and Realtime on the same data.

## As built

No change. Two more things leaned on Postgres features during the build: unique `(run_id, label)` on
conflicts so a resumed run upserts instead of duplicating, and advisory locks for event ordering.
