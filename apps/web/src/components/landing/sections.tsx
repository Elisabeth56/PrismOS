import { ButtonLink } from '@/components/ui'

import { Wordmark } from './logo'
import { Mosaic } from './mosaic'

const REPO = 'https://github.com/Elisabeth56/PrismOS'

function SafetyPoint({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-3.5">
      <span className="inline-flex size-9 items-center justify-center rounded-[12px] bg-oxblood-wash text-oxblood-text">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          {icon}
        </svg>
      </span>
      <div>
        <h3 className="text-title-3 font-medium">{title}</h3>
        <p className="mt-0.5 text-ink-2">{children}</p>
      </div>
    </div>
  )
}

export function Safety() {
  return (
    <section id="safety" className="mx-auto flex max-w-[1240px] scroll-mt-8 flex-wrap items-center gap-12 px-4 pt-24 sm:px-6 sm:pt-32">
      <Mosaic />
      <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-7">
        <h2 className="text-[32px] leading-[38px] font-semibold tracking-[-0.025em] text-balance sm:text-[40px] sm:leading-[46px]">
          Nothing lands in your repo without you
        </h2>
        <div className="flex flex-col gap-5">
          <SafetyPoint
            title="Only the repos you pick"
            icon={
              <>
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </>
            }
          >
            PrismOS is a GitHub App. Install it on the repos you choose and remove it any time.
          </SafetyPoint>
          <SafetyPoint
            title="A new branch, every time"
            icon={
              <>
                <circle cx="6" cy="6" r="2" />
                <circle cx="6" cy="18" r="2" />
                <circle cx="18" cy="18" r="2" />
                <path d="M6 8v8M18 16V9a3 3 0 0 0-3-3h-4" />
              </>
            }
          >
            The PR opens only after you approve it, and your own CI runs on it.
          </SafetyPoint>
          <SafetyPoint
            title="Straight about your code"
            icon={
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16h.01" />
              </>
            }
          >
            The free beta runs on Gemini&apos;s free tier, which may use inputs to improve Google&apos;s models. Use it on
            code you&apos;re comfortable sharing.
          </SafetyPoint>
        </div>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section className="mx-auto max-w-[1240px] px-4 pt-24 pb-24 sm:px-6 sm:pt-32">
      <div data-theme="dark" className="relative flex flex-col items-center gap-6 overflow-hidden rounded-[24px] bg-surface-1 px-6 py-16 text-center sm:rounded-[32px] sm:px-8 sm:py-[72px]">
        <div aria-hidden className="absolute inset-x-0 top-0 flex h-1.5">
          <span className="flex-1 bg-architect" />
          <span className="flex-1 bg-security" />
          <span className="flex-1 bg-ux" />
          <span className="flex-1 bg-oxblood" />
        </div>
        <h2 className="text-[34px] leading-[38px] font-semibold tracking-[-0.03em] text-balance text-ink sm:text-[48px] sm:leading-[52px]">
          Bring one feature you&apos;ve been putting off
        </h2>
        <p className="max-w-[520px] text-[16px] leading-6 text-ink-2">
          Sign in with GitHub, install the app on one repo and describe it. You&apos;ll see the plan and the arguments
          before anything is written.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <ButtonLink href="/sign-in?next=/runs/new" prefetch={false} variant="primary" size="lg" shortcut="⌘K">
            Start a run
          </ButtonLink>
          <ButtonLink href={REPO} size="lg">
            Read the source
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface-1">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-14 px-4 pt-16 sm:px-6">
        <div className="flex flex-wrap justify-between gap-12">
          <div className="flex max-w-[360px] flex-[1_1_280px] flex-col gap-3.5">
            <Wordmark />
            <p className="text-ink-2">One request in. One reviewed pull request out.</p>
          </div>
          <div className="flex flex-wrap gap-12">
            <nav aria-label="Product" className="flex min-w-[140px] flex-col gap-3">
              <span className="text-[12px] leading-4 font-medium tracking-[0.02em] text-ink-3">Product</span>
              <a href="#how" className="lp-link">How it works</a>
              <a href="#critics" className="lp-link">The critics</a>
              <a href="#safety" className="lp-link">Safety</a>
              <a href="/sign-in?next=/runs/new" className="lp-link">Start a run</a>
            </nav>
            <nav aria-label="Build notes" className="flex min-w-[140px] flex-col gap-3">
              <span className="text-[12px] leading-4 font-medium tracking-[0.02em] text-ink-3">Build notes</span>
              <a href={REPO} className="lp-link">Source on GitHub</a>
              <a href={`${REPO}/tree/main/docs/decisions`} className="lp-link">Architecture decisions</a>
              <a href={`${REPO}/tree/main/evals`} className="lp-link">Eval results</a>
            </nav>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-4 text-[12px] leading-[18px] text-ink-3">
          <a href="https://github.com/Elisabeth56" className="lp-link !text-ink-3 hover:!text-ink">
            Built by Elisabeth Nnamani
          </a>
          <span>Your code stays in your repo. PrismOS keeps runs, not your source.</span>
        </div>
      </div>
      <div
        aria-hidden
        className="lp-big mt-6 flex cursor-default justify-center overflow-hidden px-4 pb-32 text-[clamp(72px,18vw,280px)] leading-[0.78] font-semibold tracking-[-0.055em] whitespace-nowrap text-surface-3 select-none"
      >
        {'PrismOS'.split('').map((ch, i) => (
          <span key={i}>{ch}</span>
        ))}
      </div>
    </footer>
  )
}
