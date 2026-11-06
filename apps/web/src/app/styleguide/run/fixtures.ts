import type { RunDetail } from '@/lib/api'

// the sample-repo run from supabase/seed.sql, in two moments: mid-review and ready to approve
const AUTH_BEFORE = `@router.post("/login")
async def login(body: LoginIn):
    user = await authenticate(body)
    return issue_session(user)
`
const AUTH_AFTER = `@router.post("/login")
@limiter.limit(settings.LOGIN_RATE_LIMIT)
async def login(request: Request, body: LoginIn):
    request.state.login_email = body.email.lower()
    user = await authenticate(body)
    return issue_session(user)
`
const spec = {
  summary: 'Limit login attempts and return 429 with Retry-After.',
  items: [
    { id: '1', text: 'Add a rate limiter dependency to the API.' },
    { id: '2', text: 'Allow 5 login attempts per minute, then return 429 with Retry-After.' },
    { id: '3', text: 'Apply the limit in the login handler, keyed by client IP.' },
    { id: '4', text: 'Return the same error for a wrong email and a wrong password.' },
    { id: '5', text: 'Add tests for the limit, the reset window and the 429 response.' },
    { id: '6', text: 'Document the limit in the API README.' },
  ],
}
const files = {
  'app/features/auth/router.py': AUTH_BEFORE,
  'app/features/auth/logic.py': '',
  'app/main.py': '',
  'app/config.py': '',
  'tests/test_auth.py': '',
}
const objection = (item_id: string, severity: 'major' | 'blocking' | 'minor', proposed_change: string) => ({
  item_id,
  severity,
  concern: proposed_change,
  proposed_change,
})

const common = {
  id: '7f3a0000-0000-4000-8000-0000000007f3',
  project_id: 'p',
  feature_request: 'Rate limit the login endpoint',
  base_branch: 'main',
  verdict: null,
  pr_url: null,
  pr_number: null,
  error: null,
  tokens_in: 18240,
  tokens_out: 3120,
  created_at: '2026-10-29T12:00:00Z',
  started_at: '2026-10-29T12:00:02Z',
  finished_at: null,
  changes: [],
}

export const live: RunDetail = {
  ...common,
  status: 'running',
  current_step: 'critic_security',
  steps: {
    read_files: { files, omitted: [] },
    plan: spec,
    critic_architect: {
      critic: 'architect',
      objections: [
        objection('2', 'minor', 'Read the limit from settings instead of hard-coding 5.'),
        objection('3', 'major', 'Move the limit into middleware on the auth router so every login route shares it.'),
      ],
    },
  },
  conflicts: [],
}

export const review: RunDetail = {
  ...common,
  status: 'awaiting_approval',
  current_step: null,
  verdict: 'verified',
  steps: {
    ...live.steps,
    critic_security: { critic: 'security', objections: [objection('3', 'blocking', 'Key by account as well as IP, or rotating addresses gets around it.')] },
    critic_ux: { critic: 'ux', objections: [] },
    resolve: { decisions: [] },
    build: { summary: 'Adds a limiter keyed by IP and account.', changes: [] },
    verify: { verdict: 'verified', items_checked: ['1', '2', '3', '4', '5', '6'], failures: [] },
  },
  conflicts: [
    {
      id: 'c',
      label: 'c1',
      item_id: '3',
      kind: 'contested',
      objections: [
        { critic: 'architect', ...objection('3', 'major', 'Move the limit into middleware on the auth router so every login route shares it.') },
        { critic: 'security', ...objection('3', 'blocking', 'Key by account as well as IP, or rotating addresses gets around it.') },
      ],
      ruling: 'Middleware on the auth router, keyed by IP and by account.',
      rationale: 'Both changes are compatible.',
      owner: 'architect,security',
    },
  ],
  changes: [
    {
      path: 'app/features/auth/limiter.py',
      action: 'create',
      content: '"""Login rate limiting, keyed by client IP and account email."""\nfrom slowapi import Limiter\n',
    },
    { path: 'app/features/auth/router.py', action: 'modify', content: AUTH_AFTER },
  ],
}
