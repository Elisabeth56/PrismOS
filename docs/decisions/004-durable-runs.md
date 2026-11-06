# 004 Postgres job queue, run_events and Supabase Realtime

**Context.** Hackathon runs died on deploy, stayed `running` forever and dropped events sent before the
browser connected.

**Decision.** `POST /runs` inserts a queued run and returns 202. A worker loop in the API process claims runs
with `FOR UPDATE SKIP LOCKED`, keeps `heartbeat_at` fresh and stores each finished step in `run_steps`. Events go
to `run_events` with a per-run `seq`. The browser reads events after the last `seq` it saw, then follows new
rows through Supabase Realtime under RLS. A reaper requeues runs whose heartbeat is stale and fails them after
three attempts. API and worker share one Render free web service; the web app is on Vercel Hobby.

**Rejected.** Server-sent events with replay and polling (same tables, more code). A workflow vendor such as
Inngest (a new dependency for what Postgres does here).

**Consequences.** Runs survive refreshes, late joins, two tabs and restarts, and more than one worker can run.

## As built

- **Events are step-level, about 30 a run**, so the batching and pruning planned for token-level events
  weren't needed. Realtime stays far inside the free quota.
- **A race the tests caught.** The three critics emit events at the same moment, and `max(seq) + 1` collided.
  Inserts now take a per-run advisory lock (`pg_advisory_xact_lock`).
- **Replay plus subscribe has a gap**: events written between the replay and the subscription going live.
  The client fetches once more after `SUBSCRIBED` and drops duplicates by `seq`.
- **Retry from the failed step.** `POST /runs/{id}/retry` requeues a failed or cancelled run; cached steps are
  skipped, so it resumes where it stopped.
- **Cold starts.** Render's free tier sleeps after 15 idle minutes. A GitHub Actions job pings `/health` every
  10 minutes; one always-on service fits inside the free monthly hours.
