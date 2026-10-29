'use client'

import { useEffect, useRef, useState } from 'react'

import { useReducedMotion } from './hooks'
import { CARD_LEFT, CARD_TOPS, drawScene, type Point } from './prism-scene'

const CARDS = [
  { name: 'Architect', color: 'var(--critic-architect)', text: 'Put the limiter in auth middleware.' },
  { name: 'Security', color: 'var(--critic-security)', text: 'Key by account too, not only by IP.' },
  { name: 'UX', color: 'var(--critic-ux)', text: 'Tell people when they can try again.' },
]
const POINTER_IDLE_MS = 2500

/** The hero's one novel idea: you aim the light. Mouse moves or a finger drags; otherwise it sweeps by itself. */
export function PrismHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // the pointer lives in a ref so aiming doesn't re-render React on every move
  const pointer = useRef<(Point & { at: number }) | null>(null)
  const [lit, setLit] = useState<[boolean, boolean, boolean]>([false, false, false])
  const [aimed, setAimed] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let frame = 0
    let visible = true
    let source: Point | null = null
    let litKey = ''
    const start = performance.now()

    // colours and theme are read once, and again only when the theme changes
    let colors: [string, string, string] = ['#c4a574', '#8dae98', '#8399b5']
    let light = false
    const readTheme = () => {
      const css = getComputedStyle(canvas)
      colors = ['--critic-architect', '--critic-security', '--critic-ux'].map((n) => css.getPropertyValue(n).trim()) as [
        string,
        string,
        string,
      ]
      light = document.documentElement.dataset.theme === 'light'
    }
    readTheme()
    const themeWatch = new MutationObserver(readTheme)
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    const render = (now: number) => {
      const p = pointer.current
      const out = drawScene(canvas, {
        t: now - start,
        pointer: p && now - p.at < POINTER_IDLE_MS ? p : null,
        source,
        light,
        settled: reduced,
        colors,
      })
      if (!out) return
      source = out.source
      const key = out.lit.join()
      if (key !== litKey) {
        litKey = key
        setLit(out.lit)
      }
    }

    render(performance.now())
    if (reduced) {
      const redraw = () => render(performance.now())
      window.addEventListener('resize', redraw)
      return () => {
        themeWatch.disconnect()
        window.removeEventListener('resize', redraw)
      }
    }

    const loop = (now: number) => {
      render(now)
      frame = requestAnimationFrame(loop)
    }
    // stop drawing when the hero is off screen or the tab is hidden
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      cancelAnimationFrame(frame)
      if (visible && !document.hidden) frame = requestAnimationFrame(loop)
    })
    const onVisibility = () => {
      cancelAnimationFrame(frame)
      if (visible && !document.hidden) frame = requestAnimationFrame(loop)
    }
    // start animating once the page has settled, so the hero doesn't compete with first load
    const begin = setTimeout(() => {
      observer.observe(canvas)
      document.addEventListener('visibilitychange', onVisibility)
    }, 1200)
    return () => {
      clearTimeout(begin)
      themeWatch.disconnect()
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduced])

  const aim = (event: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    pointer.current = { x: event.clientX - rect.left, y: event.clientY - rect.top, at: performance.now() }
    if (!aimed) setAimed(true)
  }

  const allLit = lit.every(Boolean)
  return (
    <div className="flex min-w-0 flex-col gap-3 lg:flex-[1.15_1_560px]">
      <div
        className="relative h-[340px] touch-none select-none sm:h-[460px] lg:-mr-6 lg:h-[580px]"
        onPointerMove={aim}
        onPointerDown={aim}
        onPointerLeave={() => (pointer.current = null)}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="A light you aim shines into a glass prism and splits into three coloured rays, one per critic"
          className="absolute inset-0 size-full"
        />
        {!aimed && !reduced && (
          <span className="lp-rise absolute top-2 left-2 hidden items-center gap-2 font-mono text-[12px] leading-4 text-ink-3 sm:inline-flex [animation-delay:1.2s]">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M5 3l14 8-6 2-3 6z" />
            </svg>
            Move your cursor to aim the light
          </span>
        )}
        {CARDS.map((card, i) => (
          <div
            key={card.name}
            className="lp-card absolute right-3 flex h-12 flex-col justify-center gap-0.5 rounded-[12px] bg-surface-1 px-2.5 sm:right-6 sm:h-20 sm:gap-1 sm:rounded-[14px] sm:px-3.5"
            data-lit={lit[i]}
            style={{ '--c': card.color, left: `${CARD_LEFT * 100}%`, top: `calc(${CARD_TOPS[i] * 100}% - var(--half))` } as React.CSSProperties}
          >
            <span className="flex items-center gap-2 text-[13px] leading-4 font-medium sm:text-[14px] sm:leading-[18px]">
              <span className="size-2 rounded-full" style={{ background: card.color }} />
              {card.name}
              <span className="ml-auto hidden font-mono text-[11px] leading-4 text-ink-3 sm:inline">
                {lit[i] ? 'objecting' : 'in the dark'}
              </span>
            </span>
            <span className="truncate text-[12px] leading-[17px] text-ink-2 max-sm:hidden">{card.text}</span>
            <span className="font-mono text-[11px] leading-[14px] text-ink-3 sm:hidden">{lit[i] ? 'objecting' : 'in the dark'}</span>
          </div>
        ))}
        {allLit && (
          <span className="lp-rise absolute right-6 bottom-1.5 hidden items-center gap-2 rounded-full bg-oxblood-wash px-3 py-2 text-[12px] leading-4 font-medium text-oxblood-text sm:inline-flex" style={{ left: `${CARD_LEFT * 100}%` }}>
            <span className="lp-ping size-2 rounded-full bg-action" />
            All three lit. Plan settled, PR #42 ready.
          </span>
        )}
      </div>
      {/* on phones the payoff sits under the scene, where a thumb isn't covering it */}
      <p className="mx-4 flex min-h-[52px] items-center gap-2.5 rounded-[14px] bg-surface-1 px-3.5 py-3 text-[13px] leading-[19px] sm:hidden" aria-live="polite">
        {allLit && <span className="lp-ping size-2 flex-none rounded-full bg-action" />}
        <span className={allLit ? 'text-oxblood-text' : 'text-ink-2'}>
          {allLit
            ? 'All three lit. Plan settled, PR #42 ready.'
            : `${lit.filter(Boolean).length} of 3 critics lit. Drag across the prism to aim the light.`}
        </span>
      </p>
    </div>
  )
}
