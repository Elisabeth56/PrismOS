'use client'

import { useState } from 'react'

import { RunBody } from '@/components/run/run-body'
import { ThemeToggle } from '@/components/ui'

import { live, review } from './fixtures'

export function RunFixtures({ initial }: { initial: 'live' | 'review' }) {
  const [which, setWhich] = useState(initial)
  const run = which === 'live' ? live : review
  return (
    <div>
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-2">
        <button type="button" className="px-btn px-btn--sm" onClick={() => setWhich(which === 'live' ? 'review' : 'live')}>
          Show {which === 'live' ? 'review' : 'live'}
        </button>
        <ThemeToggle />
      </div>
      <RunBody key={which} run={run} onChange={() => {}} />
    </div>
  )
}
