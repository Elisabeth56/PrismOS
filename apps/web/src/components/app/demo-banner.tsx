'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

/** Shown across the app for the shared demo account, with the way out to a real sign-in. */
export function DemoBanner() {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  async function signInForReal() {
    setLeaving(true)
    await createClient().auth.signOut()
    router.push('/sign-in?next=/projects/new')
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-surface-1 px-4 py-3 sm:px-8">
      <p className="text-ink-2">
        You&apos;re looking at a real run in the demo account. It can&apos;t start runs or change anything.
      </p>
      <Button size="sm" variant="primary" onClick={signInForReal} disabled={leaving}>
        {leaving ? 'Signing out…' : 'Use your own repo'}
      </Button>
    </div>
  )
}
