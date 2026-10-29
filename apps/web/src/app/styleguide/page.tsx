import type { Metadata } from 'next'

import {
  Button,
  CommandBar,
  ConflictCard,
  CriticRow,
  DiffFile,
  Kbd,
  StatusPill,
  ThemeToggle,
  Verdict,
} from '@/components/ui'

export const metadata: Metadata = { title: 'Components', robots: { index: false } }

const BEFORE = `@router.post("/login")
async def login(body: LoginIn):
    user = await authenticate(body)
`
const AFTER = `@router.post("/login")
@limiter.limit("5/minute", key=ip_and_account)
async def login(request: Request, body: LoginIn):
    user = await authenticate(body)
`

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-title-3 font-medium text-ink-2">{title}</h2>
      {children}
    </section>
  )
}

/** Every component in both themes, to check against the design system previews. */
export default function Styleguide() {
  return (
    <main className="mx-auto flex max-w-[760px] flex-col gap-10 px-4 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-title-2 font-semibold">Components</h1>
        <ThemeToggle />
      </header>
      <Section title="Button and Kbd">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" shortcut="⌘↵">
            Start a run
          </Button>
          <Button>Open PR</Button>
          <Button variant="ghost">Cancel run</Button>
          <Button size="sm">Retry step</Button>
          <Kbd>⌘K</Kbd>
        </div>
      </Section>
      <Section title="Command bar">
        <CommandBar branch="main" placeholder="Describe a feature for acme/notes-api" />
      </Section>
      <Section title="Status">
        <div className="flex flex-wrap gap-2">
          <StatusPill status="queued" />
          <StatusPill status="running" label="Reviewing spec" />
          <StatusPill status="awaiting_approval" />
          <StatusPill status="pr_opened" />
          <StatusPill status="failed" />
        </div>
      </Section>
      <Section title="Critics">
        <CriticRow critic="architect" state="Objects to items 2 and 3" count={2} />
        <CriticRow critic="security" state="Reading the spec" active />
        <CriticRow critic="ux" state="No objections" count={0} />
      </Section>
      <Section title="Conflict">
        <ConflictCard
          title="Where the rate limit lives"
          itemId="3"
          kind="contested"
          positions={[
            { critic: 'architect', text: 'Use a middleware on the auth router so every login route shares one limiter.' },
            { critic: 'security', text: 'Limit per account as well as per IP, or rotating addresses walk around it.' },
          ]}
          decision="Middleware on the auth router, keyed by IP and account."
        />
      </Section>
      <Section title="Diff">
        <DiffFile path="apps/api/app/features/auth/router.py" action="modify" before={BEFORE} after={AFTER} />
      </Section>
      <Section title="Verdict">
        <Verdict verified detail="Matches all 6 spec items and both decisions." />
        <Verdict verified={false} detail="Item 4 is missing a test for the lockout window." />
      </Section>
    </main>
  )
}
