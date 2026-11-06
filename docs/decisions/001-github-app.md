# 001 Deliver a PR through a GitHub App, behind user approval

**Context.** The product promise is a PR on the user's repo. Opening one is public and hard to undo, and both
solo developers and teams use the product.

**Decision.** A PrismOS GitHub App with Contents read/write, Pull requests read/write and Metadata read. Users
install it on the repos they pick. The API signs a JWT with the app's private key and mints an installation
token per operation, scoped to the one repository and valid for an hour; only `github_installation_id` is
stored. A run ends at `awaiting_approval`. Approving creates `prismos/run-<id>`, commits full file contents
with the Git Data API and opens the PR. Repeated approvals return the same PR.

**Rejected.** The user's OAuth token with `repo` scope (write access to every repo they can reach, plus a
long-lived stored token). Download a patch instead (drops the core promise).

**Consequences.** Least privilege per repo, revocable by the repo owner, free. PRs are authored by the app, so
the body records who approved.

## As built

- **Proving installation access.** Installation ids are small integers, so trusting one from the browser
  would let anyone attach another account's repo. Supabase's GitHub provider uses the app's own OAuth
  credentials; the user's token then calls `GET /user/installations` and only installations GitHub lists are
  accepted. The planned fallback (a signed `state` on the setup callback) was dropped: it proves the user
  started an install, not that they can access the id they send back.
- **Keeping that token.** Supabase hands over the GitHub token once, at sign-in, and drops it when the session
  refreshes, which broke "add a repo" an hour after signing in. The auth callback now keeps it in an
  httpOnly cookie scoped to `/api/github` for its 8-hour life, and two Next route handlers forward it.
  Page scripts never see it.
- **App settings learned in production.** Account permission *Email addresses: read-only* is required, or
  Supabase can't create the user. *Request user authorization during installation* must be off, or GitHub
  ignores the Setup URL and sends the install redirect to the sign-in callback.
- **Idempotency.** The run row is locked while the PR opens; a branch left by a half-finished attempt is moved,
  and an already open PR for the branch is reused. GitHub refusing leaves the run approvable.
- First live result: PR #10 on `Elisabeth56/ridgewood-booking-api`, opened from an approved, verified run.
