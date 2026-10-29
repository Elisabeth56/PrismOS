-- The parts of Supabase the migrations and seed rely on, for testing on plain Postgres.
-- Mirrors Supabase's names (auth.users, auth.uid(), the anon/authenticated/service_role roles).

create schema if not exists extensions;
-- Supabase ships pgcrypto in the extensions schema; minimal Postgres builds may not have it,
-- and the seed only needs crypt() to produce some hash
do $$
begin
  create extension if not exists pgcrypto with schema extensions;
exception when others then
  create function extensions.gen_salt(text) returns text language sql as 'select ''test-salt''';
  create function extensions.crypt(text, text) returns text language sql as 'select md5($1 || $2)';
end;
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end;
$$;

create schema if not exists auth;
grant usage on schema auth, public, extensions to anon, authenticated, service_role;

create table if not exists auth.users (
  instance_id uuid,
  id uuid primary key,
  aud text,
  role text,
  email text unique,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

create table if not exists auth.identities (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete cascade,
  provider_id text,
  identity_data jsonb,
  provider text,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
);

-- Supabase reads the caller's id from the verified JWT claims PostgREST sets per request
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(current_setting('request.jwt.claim.sub', true),
                         current_setting('request.jwt.claims', true)::jsonb ->> 'sub'), '')::uuid;
$$;
grant execute on function auth.uid() to anon, authenticated, service_role;
