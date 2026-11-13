'use client'

import { useEffect, useState } from 'react'

import { onWaking } from '@/lib/api'

/** Says why a page is slow while the free API host boots, instead of leaving a skeleton to guess at. */
export function WakingNotice() {
  const [waking, setWaking] = useState(false)
  useEffect(() => onWaking(setWaking), [])
  if (!waking) return null
  return (
    <p role="status" className="flex items-center gap-2.5 border-b border-hairline bg-surface-1 px-4 py-3 text-ink-2 sm:px-8">
      <span className="inline-block size-2 flex-none rounded-full bg-[var(--critic-architect)] motion-safe:animate-pulse" aria-hidden />
      Starting the server. Free hosting sleeps when nobody&apos;s using it, so this takes up to a minute.
    </p>
  )
}
