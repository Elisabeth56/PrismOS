-- Local and preview seed: a demo account, the sample project, and one finished run so every screen has data.
-- Demo sign-in: demo@prismos.dev / prismos-demo (public on purpose; it can only see the sample project).

do $$
declare
  demo uuid := '00000000-0000-4000-8000-00000000d3e0';
  project uuid := '00000000-0000-4000-8000-0000000000a1';
  run uuid := '00000000-0000-4000-8000-0000000007f3';
  conflict uuid := '00000000-0000-4000-8000-00000000c031';
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', demo, 'authenticated', 'authenticated', 'demo@prismos.dev',
          extensions.crypt('prismos-demo', extensions.gen_salt('bf')), now(),
          '{"provider": "email", "providers": ["email"]}', '{"user_name": "demo"}', now(), now());

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), demo, demo::text,
          jsonb_build_object('sub', demo::text, 'email', 'demo@prismos.dev'), 'email', now(), now(), now());

  insert into public.projects (id, name, repo_full_name, default_branch, created_by)
  values (project, 'notes-api', 'prismos-demo/notes-api', 'main', demo);

  insert into public.project_members (project_id, user_id, role) values (project, demo, 'owner');

  insert into public.runs (id, project_id, requested_by, feature_request, base_branch, status, current_step,
                           verdict, tokens_in, tokens_out, started_at, finished_at)
  values (run, project, demo,
          'Add rate limiting to the login endpoint. Five attempts per minute, then return 429 with a Retry-After header.',
          'main', 'awaiting_approval', 'verify', 'verified', 41200, 9800, now() - interval '5 minutes', now());

  insert into public.run_steps (run_id, step, output, model) values
    (run, 'plan', '{"items": [
      {"id": "1", "text": "Add a rate limiter dependency to the API."},
      {"id": "2", "text": "Allow 5 login attempts per minute, then return 429 with Retry-After."},
      {"id": "3", "text": "Apply the limit in the login handler, keyed by client IP."},
      {"id": "4", "text": "Return the same error for a wrong email and a wrong password."},
      {"id": "5", "text": "Add tests for the limit, the reset window and the 429 response."},
      {"id": "6", "text": "Document the limit in the API README."}]}', 'gemini-flash'),
    (run, 'verify', '{"verdict": "verified", "items_checked": ["1","2","3","4","5","6"], "failures": []}', 'gemini-flash');

  insert into public.conflicts (id, run_id, item_id, kind, objections) values
    (conflict, run, '3', 'incompatible', '[
      {"critic": "architect", "item_id": "3", "severity": "major",
       "proposed_change": "Move the limit into middleware on the auth router so every login route shares it."},
      {"critic": "security", "item_id": "3", "severity": "blocking",
       "proposed_change": "Key by account as well as IP, or rotating addresses gets around it."}]');

  insert into public.decisions (conflict_id, run_id, ruling, rationale, owner) values
    (conflict, run, 'Middleware on the auth router, keyed by IP and by account.',
     'Both changes are compatible: placement from Architect, key from Security.', 'architect, security');

  insert into public.changes (run_id, path, action, content) values
    (run, 'app/features/auth/limiter.py', 'create',
     E'"""Login rate limiting, keyed by client IP and account email."""\nfrom slowapi import Limiter\n'),
    (run, 'README.md', 'modify', E'# notes-api\n\nLogin is limited to 5 attempts per minute.\n');
end;
$$;
