-- Run queue support (ADR-004): extra context the user attached, and the index the per-user rate limit reads.

alter table public.runs
  add column context_files jsonb not null default '[]'::jsonb
    check (jsonb_typeof(context_files) = 'array' and jsonb_array_length(context_files) <= 5);

create index runs_requested_by_created_idx on public.runs (requested_by, created_at desc);
