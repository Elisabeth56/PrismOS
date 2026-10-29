'use client'

import { ConflictCard, CriticRow } from '@/components/ui'

import { useInView, useReducedMotion, useTicker } from './hooks'

// a recorded run on the sample repo, replayed in 8 beats of 1.5s
const PILLS: [string, string][] = [
  ['running', 'Reading 12 files'],
  ['running', 'Reviewing spec'],
  ['running', 'Reviewing spec'],
  ['running', 'Resolving 1 conflict'],
  ['running', 'Building'],
  ['done', 'PR opened'],
  ['done', 'PR opened'],
  ['done', 'PR opened'],
]

export function DemoRun() {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLElement>()
  const tick = useTicker(1500, !reduced && inView)
  const p = reduced ? 5 : tick % PILLS.length
  const [tone, label] = PILLS[p]

  return (
    <section ref={ref} id="demo" aria-label="A run, live" className="mx-auto max-w-[1240px] scroll-mt-8 px-4 pt-14 sm:px-6 sm:pt-10">
      <div className="overflow-hidden rounded-[22px] bg-surface-1 shadow-window sm:rounded-[28px]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span className={`px-pill px-pill--${tone}`}>{label}</span>
            <span className="text-[15px] leading-5 font-medium">Rate limit the login endpoint</span>
          </div>
          <span className="font-mono text-[12px] text-ink-3 max-sm:hidden">prismos-demo/notes-api · run_7f3a</span>
        </div>
        <div className="h-[3px] bg-surface-3">
          <div className="lp-rail h-[3px] bg-[linear-gradient(90deg,var(--critic-architect),var(--critic-security),var(--critic-ux),var(--action))]" />
        </div>
        <div className="flex flex-wrap gap-5 p-4 sm:p-6">
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2.5">
            <h2 className="text-[12px] leading-4 font-medium tracking-[0.02em] text-ink-3">Review panel</h2>
            <CriticRow critic="architect" state={p < 1 ? 'Reading the spec' : 'Objects to item 3'} count={p < 1 ? undefined : 1} active={p < 1} />
            <CriticRow critic="security" state={p < 2 ? 'Reading the spec' : 'Objects to item 3'} count={p < 2 ? undefined : 1} active={p < 2} />
            <CriticRow critic="ux" state={p < 2 ? 'Reading the spec' : 'No objections'} count={p < 2 ? undefined : 0} active={p < 2} />
          </div>
          <div className="flex min-h-[300px] min-w-0 flex-[1.4_1_420px] flex-col gap-2.5 max-sm:min-h-[150px]">
            <h2 className="text-[12px] leading-4 font-medium tracking-[0.02em] text-ink-3">Conflicts and decisions</h2>
            {p < 3 ? (
              <div className="flex flex-1 items-center justify-center rounded-[16px] border border-dashed border-hairline-strong p-6 text-center text-[13px] text-ink-3">
                Waiting for all three critics to finish
              </div>
            ) : (
              <div className="lp-rise">
                <ConflictCard
                  title="How the limit is keyed"
                  itemId="3"
                  kind="contested"
                  positions={[
                    { critic: 'architect', text: 'Middleware on the auth router, so every login route shares one limiter.' },
                    { critic: 'security', text: 'Key by account as well as IP, or rotating addresses gets around it.' },
                  ]}
                  decision={p >= 4 ? 'Middleware on the auth router, keyed by IP and by account.' : null}
                />
              </div>
            )}
            {p >= 5 && (
              <div className="lp-rise flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-[color-mix(in_srgb,var(--success)_12%,var(--surface-2))] px-4 py-3">
                <span className="inline-flex items-center gap-2 font-medium text-success">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  Verified · PR #42 opened
                </span>
                <span className="font-mono text-[12px] text-ink-3">4 files · +68 −3</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
