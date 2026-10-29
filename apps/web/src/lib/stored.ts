'use client'

import { useEffect, useState } from 'react'

/** State that survives a reload: drafts, the last project, filters. Silently in-memory where storage is blocked. */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading storage after hydration avoids a mismatch
      if (raw !== null) setValue(JSON.parse(raw) as T)
    } catch {}
    setLoaded(true)
  }, [key])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [key, value, loaded])

  return [value, setValue, loaded] as const
}
