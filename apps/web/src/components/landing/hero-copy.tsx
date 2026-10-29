'use client'

import Link from 'next/link'

import { ButtonLink, Kbd } from '@/components/ui'

import { useReducedMotion, useTicker } from './hooks'

const REQUEST = 'Add rate limiting to the login endpoint'
const WORDS: [string, number][][] = [
  [['One', 0.1], ['request', 0.16], ['in.', 0.22]],
  [['One', 0.34]],
]
const TAIL: [string, number][] = [['pull', 0.46], ['request', 0.52], ['out.', 0.58]]

function Word({ text, delay }: { text: string; delay: number }) {
  return (
    <span className="lp-w" style={{ animationDelay: `${delay}s` }}>
      {text}
    </span>
  )
}

export function HeroCopy() {
  const reduced = useReducedMotion()
  const chars = useTicker(55, !reduced, REQUEST.length)
  const typed = reduced ? REQUEST : REQUEST.slice(0, chars)

  return (
    <div className="relative z-10 flex min-w-0 flex-col gap-5 px-4 sm:gap-6 lg:flex-[1_1_480px] lg:px-0">
      <span className="lp-rise px-pill self-start !bg-oxblood-wash !text-oxblood-text [animation-delay:.05s]">
        Free beta · runs on your GitHub repos
      </span>
      <h1 className="text-[42px] leading-[44px] font-semibold tracking-[-0.035em] sm:text-[64px] sm:leading-[66px]">
        {WORDS[0].map(([w, d]) => (
          <Word key={w} text={w} delay={d} />
        )).reduce<React.ReactNode[]>((acc, el) => [...acc, el, ' '], [])}
        <br className="hidden sm:block" />
        <Word text="One" delay={0.34} />{' '}
        <span className="lp-w relative text-oxblood-text" style={{ animationDelay: '0.4s' }}>
          reviewed
          <svg viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden className="absolute -bottom-2.5 -left-[2%] h-3.5 w-[104%] overflow-visible sm:-bottom-3 sm:h-[18px]">
            <path className="lp-underline" d="M4 16 C 70 6, 150 4, 296 12" fill="none" stroke="var(--action)" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </span>{' '}
        {TAIL.map(([w, d]) => (
          <Word key={w + d} text={w} delay={d} />
        )).reduce<React.ReactNode[]>((acc, el) => [...acc, el, ' '], [])}
      </h1>
      <p className="lp-rise max-w-[520px] text-[16px] leading-6 text-ink-2 sm:text-[18px] sm:leading-7 [animation-delay:.7s]">
        Describe a feature for your repo. Three critics argue over the plan, PrismOS settles what they disagree on,
        writes the change and opens a PR when you approve it.
      </p>
      <Link
        href="/sign-in?next=/runs/new"
        prefetch={false}
        className="px-cmd lp-rise max-w-[560px] text-ink shadow-[0_0_0_1px_var(--hairline-strong),var(--shadow-popover)] [animation-delay:.85s]"
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M12 3l9 16H3z" />
        </svg>
        <span className="min-w-0 flex-1 overflow-hidden text-[15px] leading-[22px] whitespace-nowrap sm:text-[16px] sm:leading-6">
          <span className="sr-only">Start a run: </span>
          {typed}
          <span className="lp-caret" />
        </span>
        <span className="max-sm:hidden">
          <Kbd>⌘K</Kbd>
        </span>
      </Link>
      <div className="lp-rise flex flex-wrap items-center gap-3 [animation-delay:1s] max-sm:hidden">
        <ButtonLink href="/sign-in?next=/runs/new" prefetch={false} variant="primary" size="lg">
          Start a run
        </ButtonLink>
        <a href="#demo" className="px-btn px-btn--ghost">
          Watch one first
        </a>
      </div>
    </div>
  )
}
