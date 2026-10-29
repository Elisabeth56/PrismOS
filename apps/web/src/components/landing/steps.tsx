'use client'

import { useInView, useReducedMotion, useTicker } from './hooks'

const STEPS = [
  { num: '1', title: 'Plan', body: 'Reads the files your change touches and writes a spec with numbered items.', color: 'var(--ink)', bar: 'var(--ink-2)' },
  {
    num: '2',
    title: 'Review',
    body: 'Three critics review the same spec at once and object item by item.',
    color: 'var(--critic-security)',
    bar: 'linear-gradient(90deg, var(--critic-architect) 0 33.3%, var(--critic-security) 33.3% 66.6%, var(--critic-ux) 66.6% 100%)',
  },
  { num: '3', title: 'Resolve', body: 'Where critics disagree on an item, a resolver rules and says why.', color: 'var(--oxblood-text)', bar: 'var(--oxblood-text)' },
  { num: '4', title: 'Build and verify', body: 'Writes the change, checks it against the spec, then waits for you to open the PR.', color: 'var(--success)', bar: 'var(--success)' },
]

export function Steps() {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLElement>()
  const active = useTicker(2000, !reduced && inView) % STEPS.length

  return (
    <section ref={ref} id="how" className="mx-auto flex max-w-[1240px] scroll-mt-8 flex-col gap-8 px-4 pt-24 sm:gap-10 sm:px-6 sm:pt-32">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h2 className="max-w-[560px] text-[32px] leading-[38px] font-semibold tracking-[-0.025em] text-balance sm:text-[40px] sm:leading-[46px]">
          Four steps, and you can watch every one
        </h2>
        <p className="max-w-[380px] text-[16px] leading-6 text-ink-2">
          Close the tab whenever you like. The run keeps going and the page catches up when you come back.
        </p>
      </div>
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
        {STEPS.map((step, i) => (
          <li
            key={step.num}
            className="lp-step relative flex flex-col gap-3 overflow-hidden rounded-[20px] bg-surface-1 px-6 pt-7 pb-8"
            data-on={!reduced && i === active}
            style={{ '--c': step.color } as React.CSSProperties}
          >
            <span className="lp-num text-[44px] leading-[44px] font-semibold tracking-[-0.04em] text-ink-4">{step.num}</span>
            <h3 className="text-[19px] leading-[26px] font-medium tracking-[-0.01em]">{step.title}</h3>
            <p className="text-ink-2">{step.body}</p>
            <span className="lp-bar absolute inset-x-0 bottom-0 h-1" style={{ background: step.bar }} />
          </li>
        ))}
      </ol>
    </section>
  )
}
