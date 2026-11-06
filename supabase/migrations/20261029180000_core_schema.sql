-- PrismOS core schema (ADR-000, 004, 005, 007).
-- Clients (the browser, with a user's JWT) only ever SELECT, and only rows in projects they belong to.
-- Every write goes through the API or the worker, which use the service role.

create type public.member_role as enum ('owner', 'member');
create type public.run_status as enum ('queued', 'running', 'awaiting_approval', 'pr_opened', 'failed', 'cancelled');

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- projects and membership ---------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  repo_full_name text not null check (repo_full_name ~ '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$'),
  default_branch text not null default 'main',
  github_installation_id bigint,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
-- "which projects am I in" is the lookup every policy makes
create index project_members_user_idx on public.project_members (user_id);

-- runs and everything a run produces ---------------------------------------

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  requested_by uuid references auth.users (id) on delete set null,
  feature_request text not null check (char_length(feature_request) between 10 and 4000),
  base_branch text not null,
  status public.run_status not null default 'queued',
  current_step text,
  verdict text check (verdict in ('verified', 'needs_revision')),
  pr_url text,
  pr_number integer,
  error jsonb,
  attempts integer not null default 0,
  heartbeat_at timestamptz,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  -- an opened PR always has its link
  check (status <> 'pr_opened' or pr_url is not null)
);
create index runs_project_created_idx on public.runs (project_id, created_at desc);
-- partial indexes keep the worker's claim and the reaper's scan small
create index runs_queued_idx on public.runs (created_at) where status = 'queued';
create index runs_running_heartbeat_idx on public.runs (heartbeat_at) where status = 'running';

-- one row per agent call; the structured output is what the next step reads back on resume
create table public.run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs (id) on delete cascade,
  step text not null,
  attempt integer not null default 1,
  output jsonb not null,
  model text,
  tokens_in integer,
  tokens_out integer,
  latency_ms integer,
  created_at timestamptz not null default now(),
  unique (run_id, step, attempt)
);

-- ordered stream log; the browser replays seq > last_seen, then follows Realtime
create table public.run_events (
  run_id uuid not null references public.runs (id) on delete cascade,
  seq bigint not null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (run_id, seq)
);

create table public.conflicts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs (id) on delete cascade,
  item_id text not null,
  kind text not null check (kind in ('contested', 'blocking')),
  objections jsonb not null,
  created_at timestamptz not null default now()
);
create index conflicts_run_idx on public.conflicts (run_id);

-- the primary key enforces exactly one decision per conflict
create table public.decisions (
  conflict_id uuid primary key references public.conflicts (id) on delete cascade,
  run_id uuid not null references public.runs (id) on delete cascade,
  ruling text not null,
  rationale text not null,
  owner text,
  created_at timestamptz not null default now()
);
create index decisions_run_idx on public.decisions (run_id);

-- the files a run will commit; becomes the PR
create table public.changes (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs (id) on delete cascade,
  path text not null check (path !~ '(^/|\.\.|^\.git/)'),
  action text not null check (action in ('create', 'modify', 'delete')),
  content text,
  created_at timestamptz not null default now(),
  unique (run_id, path),
  -- deletions carry no content; everything else carries the whole file
  check ((action = 'delete') = (content is null))
);

create table public.memory_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  run_id uuid references public.runs (id) on delete set null,
  kind text not null check (kind in ('decision', 'shipped_feature', 'constraint')),
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index memory_entries_project_kind_idx on public.memory_entries (project_id, kind, created_at desc);

create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger runs_updated_at before update on public.runs
  for each row execute function public.set_updated_at();

-- access ------------------------------------------------------------------

-- security definer so policies can read project_members without recursing into its own policy
create or replace function public.is_member(target_project uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = target_project and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_run_member(target_run uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.runs r
    join public.project_members m on m.project_id = r.project_id
    where r.id = target_run and m.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_member(uuid), public.is_run_member(uuid) from public;
grant execute on function public.is_member(uuid), public.is_run_member(uuid) to authenticated;

do $$
declare t text;
begin
  foreach t in array array['projects', 'project_members', 'runs', 'run_steps', 'run_events',
                           'conflicts', 'decisions', 'changes', 'memory_entries'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
  end loop;
end;
$$;

create policy "members read projects" on public.projects
  for select to authenticated using (public.is_member(id));
create policy "members read membership" on public.project_members
  for select to authenticated using (public.is_member(project_id));
create policy "members read runs" on public.runs
  for select to authenticated using (public.is_member(project_id));
create policy "members read memory" on public.memory_entries
  for select to authenticated using (public.is_member(project_id));
create policy "members read run steps" on public.run_steps
  for select to authenticated using (public.is_run_member(run_id));
create policy "members read run events" on public.run_events
  for select to authenticated using (public.is_run_member(run_id));
create policy "members read conflicts" on public.conflicts
  for select to authenticated using (public.is_run_member(run_id));
create policy "members read decisions" on public.decisions
  for select to authenticated using (public.is_run_member(run_id));
create policy "members read changes" on public.changes
  for select to authenticated using (public.is_run_member(run_id));

-- the browser follows run_events over Realtime (only on Supabase, where the publication exists)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.run_events;
  end if;
end;
$$;
