# 005 Supabase Auth with GitHub, plus project_members

**Context.** The hackathon build identified users by an anonymous UUID in localStorage and used the
service-role key for everything.

**Decision.** Supabase Auth with the GitHub provider. `project_members(project_id, user_id, role)` with owner
and member roles. RLS on every table the browser can read checks membership; the API verifies the Supabase
JWT and checks membership again.

**Rejected.** Clerk (a second identity system beside Supabase RLS). Solo-only v1 (adding membership later
rewrites every policy).

**Consequences.** One identity system, one access model, enforced in the database because the anon key ships
to the browser.

## As built

- **The API never uses the service-role key.** It connects to Postgres directly with psycopg and scopes every
  query with a membership join; a project you don't belong to returns 404, so ids can't be probed. The key
  was removed from the config entirely.
- **RLS helpers moved out of the public schema.** `is_member` and `is_run_member` are `SECURITY DEFINER` so
  policies don't recurse, which also made them callable at `/rest/v1/rpc/...`, even by signed-out visitors.
  They now live in a `private` schema the API doesn't serve; Supabase's security advisor is clean.
- **JWTs.** HS256 with the legacy secret if one is configured, otherwise the project's JWKS (ES256/RS256).
- **Roles in the product.** Owners can rename, change the default branch and delete a project; members can
  read and run. Invites are not built yet.
