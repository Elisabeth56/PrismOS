'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** ⌘K / Ctrl+K starts a run from anywhere on the landing page, as the buttons promise. */
export function StartShortcut() {
  const router = useRouter()
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        router.push('/sign-in?next=/runs/new')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])
  return null
}
