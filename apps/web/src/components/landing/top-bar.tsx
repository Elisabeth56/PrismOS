import Link from 'next/link'

import { ButtonLink } from '@/components/ui'

import { PrismMark, Wordmark } from './logo'

export function TopBar() {
  return (
    <header className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
      <Link href="/" aria-label="PrismOS home" className="text-ink no-underline">
        <Wordmark />
      </Link>
      <nav className="flex flex-wrap items-center gap-1">
        <a href="#how" className="px-btn px-btn--ghost max-md:hidden">How it works</a>
        <a href="#critics" className="px-btn px-btn--ghost max-md:hidden">Critics</a>
        <a href="#safety" className="px-btn px-btn--ghost max-md:hidden">Safety</a>
        <ButtonLink href="/sign-in" prefetch={false} size="md">
          Sign in
        </ButtonLink>
      </nav>
    </header>
  )
}

/** The floating start bar: always one tap from starting, never covering the footer's wordmark row. */
export function FloatingStart() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(16px,env(safe-area-inset-bottom))] z-20 flex justify-center px-4">
      <nav
        aria-label="Quick start"
        className="lp-rise pointer-events-auto flex w-full max-w-[640px] items-center gap-3 rounded-full bg-surface-2 py-2 pr-2 pl-4 shadow-[0_0_0_1px_var(--hairline-strong),var(--shadow-popover)] [animation-delay:1.4s]"
      >
        <PrismMark size={20} />
        <span className="min-w-0 flex-1 truncate text-[14px] leading-5 text-ink-2">Describe a feature, get a reviewed PR</span>
        <a href="#how" className="px-btn px-btn--ghost px-btn--sm flex-none max-sm:hidden">
          How it works
        </a>
        <ButtonLink href="/sign-in?next=/runs/new" prefetch={false} variant="primary" className="h-10 flex-none" shortcut="⌘K">
          Start a run
        </ButtonLink>
      </nav>
    </div>
  )
}
