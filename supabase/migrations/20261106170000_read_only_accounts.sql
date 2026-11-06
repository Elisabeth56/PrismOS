-- Read-only accounts: app_metadata.read_only = true (only the service role can set it).
-- The API refuses their writes; this trigger stops them changing their own sign-in,
-- so a shared account like the public demo can't be locked by one visitor.

create or replace function private.keep_read_only_sign_in()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(old.raw_app_meta_data ->> 'read_only', '') = 'true'
     and (new.encrypted_password is distinct from old.encrypted_password
          or new.email is distinct from old.email
          or coalesce(new.email_change, '') <> coalesce(old.email_change, '')
          or new.raw_user_meta_data is distinct from old.raw_user_meta_data) then
    raise exception 'read-only accounts cannot change their sign-in details' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger keep_read_only_sign_in
  before update on auth.users
  for each row execute function private.keep_read_only_sign_in();
