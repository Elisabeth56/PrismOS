# PrismOS: rebuilding a hackathon multi-agent demo into a product

PrismOS takes a feature request for an existing GitHub repo and returns one reviewed pull request. It's for
solo developers and small teams who want a second and third opinion on a change before it lands, without
setting up a review process.

## Where it started

I built the first version for a hackathon. It had eight agents with job titles, a PM, an architect, a
designer, an engineer, QA and a "release manager", and it looked impressive in a demo. When I audited it
afterwards, most of that was theatre:

- The agents never read the user's code. They saw at most 200 file paths.
- The "debate" was three independent opinions about three different documents, and the prompts forced every
  agent to raise a concern, so conflicts were guaranteed whether or not they existed.
- Runs lived in memory. A deploy or a refresh lost them, and some stayed "running" forever.
- There were no users: ownership was an anonymous ID in localStorage, and the server used the database's
  admin key for everything.
- The output was a zip file, not a pull request.

I gave myself four days and free tiers only to turn it into something I'd let touch my own repos.

## Decisions that shaped it

**One spec, three critics, conflicts found in code.** The planner writes a single spec with numbered items.
Architect, Security/QA and UX critics review that same spec in parallel and object to item numbers, with a
severity and a proposed change. A small pure function decides what's a conflict: two critics objecting to the
same item, or one blocking objection. Everything else is a note the builder applies. A resolver only runs
when there's something to resolve, and it must return exactly one decision per conflict or it gets one
correction and then fails. Because the rule is code, I could test every branch of it, and the critics no
longer argue for the sake of it. On the first live run they raised notes but no conflicts, which is the
honest answer for a small change.

**Postgres as the queue, the log and the cache.** Creating a run only inserts a row and returns 202. A worker
claims runs with `FOR UPDATE SKIP LOCKED`, keeps a heartbeat, and a reaper requeues runs whose worker died.
Every model call's output is stored per step, so a retried run skips what already finished. Events go into an
ordered table that the browser replays and then follows over Supabase Realtime. Tests caught a real race
here: the three critics write events at the same instant and their sequence numbers collided, fixed with a
per-run advisory lock.

**A GitHub App, with access proven by GitHub.** Using the user's OAuth token would have been faster, but it
grants write access to every repo they can reach. The app gets per-repo access the owner can revoke, and the
API mints a one-hour token scoped to the single repo for each operation. The tricky part was attaching a
repo safely. Installation ids are small integers, so if the browser could just send one, anyone could attach
someone else's repo. The API only accepts an installation that GitHub lists when asked with the user's own
token.

**Access enforced in the database.** The browser holds Supabase's public key, so row-level security checks
project membership on every table. The API checks membership again in SQL and doesn't hold the admin key at
all.

## What broke in production

Every unit test passed, and the first real sign-in still failed. The bugs that only showed up live were the
useful ones:

- The GitHub App needed permission to read email addresses, or Supabase couldn't create the user.
- With "authorize during installation" on, GitHub ignored my setup page and sent users to the sign-in
  callback, which rejected the request.
- Supabase drops the GitHub token from the session after an hour, so "add a repo" quietly broke. The token
  now lives in an httpOnly cookie that only two server routes can read.
- The first runs stopped at the planning step with a vague error. The cause was a 404: the Gemini model I'd
  configured had been deprecated. Worse, my fallback chain only handled rate limits, so a refusal skipped it
  entirely. Now any provider refusal falls through to the next provider, and if they all refuse, the run
  page shows each provider's own reason.

## Results

The first successful run added an HTML/CSS landing page to a small Bun + Hono API. It used 8 model calls,
16,481 input and 5,495 output tokens, about a third of my pre-build estimate, and roughly 80 seconds of model
time. The verifier passed it on the first build and the approval opened
[PR #10](https://github.com/Elisabeth56/ridgewood-booking-api/pull/10).

The API has 136 tests, including the conflict rules, exactly-once claims, resume after a crash, idempotent PR
opening and the access checks; the web app has 25.

## What I'd do next

The biggest gap is evaluation. One run is a demo, not evidence. The harness I planned scores a set of golden
cases for file-selection recall, spec coverage and verifier agreement, against a single-prompt baseline. Until
it exists I can't say the critics improve the output, only that they behave as designed. After that: an
embedding index for large repos, a reviewer demo account, and bring-your-own-key so private code doesn't go
through a free tier.

What I'd keep: designing the data and the failure modes before the agents. Most of the hackathon version's
problems were about where state lived, not about prompts.
