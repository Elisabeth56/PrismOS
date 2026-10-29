'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/** True when the visitor asked for less motion; the landing then shows each demo's finished state. */
export function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const media = matchMedia(QUERY)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => matchMedia(QUERY).matches,
    () => false,
  )
}

/** A counter that ticks every `ms` while enabled, stopping for good at `limit` if one is given. */
export function useTicker(ms: number, enabled = true, limit = Infinity) {
  const [tick, setTick] = useState(0)
  const done = tick >= limit
  useEffect(() => {
    if (!enabled || done) return
    const id = setInterval(() => setTick((n) => n + 1), ms)
    return () => clearInterval(id)
  }, [ms, enabled, done])
  return Math.min(tick, limit)
}

/** Whether the element is on screen; demos only animate while someone can see them. */
export function useInView<T extends Element>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '100px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, inView] as const
}
