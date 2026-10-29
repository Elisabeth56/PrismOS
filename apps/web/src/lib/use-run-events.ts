'use client'

import { useEffect, useState } from 'react'

import { followRun, mergeEvents, type RunEvent } from './run-events'

/** Every event for a run, kept current. Survives refreshes and works the same in two tabs. */
export function useRunEvents(runId: string) {
  const [events, setEvents] = useState<RunEvent[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stop: (() => void) | undefined
    let cancelled = false
    followRun(runId, 0, (fresh) => setEvents((current) => mergeEvents(current, fresh)))
      .then((unsubscribe) => {
        if (cancelled) unsubscribe()
        else stop = unsubscribe
      })
      .catch(() => setError("Couldn't load this run's progress. Refresh to try again."))
    return () => {
      cancelled = true
      stop?.()
    }
  }, [runId])

  return { events, error }
}
