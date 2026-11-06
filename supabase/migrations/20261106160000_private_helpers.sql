-- The membership helpers exist only for RLS policies. In the public schema the API exposes them as RPC
-- endpoints, so they move to a schema the API doesn't serve. Policies keep working: they reference the
-- functions themselves, not their names.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

alter function public.is_member(uuid) set schema private;
alter function public.is_run_member(uuid) set schema private;

revoke all on function private.is_member(uuid), private.is_run_member(uuid) from public, anon;
grant execute on function private.is_member(uuid), private.is_run_member(uuid) to authenticated;
