'use client'

import { useEffect, useState } from 'react'

import { useInView, useReducedMotion, useTicker } from './hooks'

const CRITICS = [
  {
    name: 'Architect',
    color: 'var(--critic-architect)',
    body: 'Where the change belongs, what it couples to, and whether it fits the patterns already in your repo.',
    quote: '“Put the limiter in auth middleware, not in the handler.”',
  },
  {
    name: 'Security and QA',
    color: 'var(--critic-security)',
    body: 'Abuse cases, data exposure, missing tests and the edge cases the spec forgot.',
    quote: '“Keyed by IP alone, a botnet walks around it.”',
  },
  {
    name: 'UX',
    color: 'var(--critic-ux)',
    body: 'What the person on the other end sees: errors, empty states, wording and what happens on a slow network.',
    quote: '“Tell people when they can try again.”',
  },
]

export function CriticsBand() {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLElement>()
  const animate = !reduced && inView
  const active = useTicker(3400, animate) % CRITICS.length
  const [chars, setChars] = useState(0)

  // each critic types its objection in turn
  useEffect(() => {
    if (!animate) return
    let n = 0
    const quote = CRITICS[active].quote
    const id = setInterval(() => {
      setChars(++n)
      if (n >= quote.length) clearInterval(id)
    }, 32)
    return () => clearInterval(id)
  }, [active, animate])

  return (
    // the band is always dark: oxblood is the brand block in both themes
    <section ref={ref} id="critics" data-theme="dark" className="mt-24 scroll-mt-8 bg-oxblood text-ink sm:mt-32">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-4 py-16 sm:gap-12 sm:px-6 sm:py-24">
        <div className="flex max-w-[680px] flex-col gap-4">
          <span className="font-mono text-[12px] leading-4 tracking-[0.02em] text-ink">The review panel</span>
          <h2 className="text-[34px] leading-[38px] font-semibold tracking-[-0.03em] text-balance sm:text-[48px] sm:leading-[52px]">
            Three critics. Only real arguments.
          </h2>
          <p className="text-[17px] leading-[26px] text-[color-mix(in_srgb,var(--ink)_85%,var(--oxblood-text))]">
            Critics aren&apos;t told to find problems. A conflict exists only when two of them object to the same spec
            item, or one blocks it outright. Everything else is a note the builder applies.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
          {CRITICS.map((critic, i) => {
            const on = animate && i === active
            const quote = on ? critic.quote.slice(0, chars) : critic.quote
            return (
              <div
                key={critic.name}
                className="lp-critic flex min-h-[260px] flex-col gap-3.5 rounded-[20px] bg-[rgba(20,19,21,0.38)] p-6"
                data-on={on}
                style={{ '--c': critic.color } as React.CSSProperties}
              >
                <span className="lp-blk size-11 rounded-[14px]" style={{ background: critic.color }} />
                <h3 className="text-[19px] leading-[26px] font-medium">{critic.name}</h3>
                <p className="text-[color-mix(in_srgb,var(--ink)_85%,var(--oxblood-text))]">{critic.body}</p>
                <p className="lp-quote mt-auto font-mono text-[12px] leading-[18px]" style={{ color: `color-mix(in srgb, ${critic.color} 45%, var(--ink))` }}>
                  {quote}
                  {on && quote.length < critic.quote.length && <span className="lp-caret" style={{ background: critic.color }} />}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
