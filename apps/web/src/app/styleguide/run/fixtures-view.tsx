'use client'

import { useState } from 'react'

import { RunBody } from '@/components/run/run-body'
import { ThemeToggle } from '@/components/ui'

import { failed, live, review } from './fixtures'

const RUNS = { live, review, failed }
type Which = keyof typeof RUNS

export function RunFixtures({ initial }: { initial: Which }) {
  const [which, setWhich] = useState(initial)
  const run = RUNS[which]
  return (
    <div>
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-2">
        {(Object.keys(RUNS) as Which[]).map((key) => (
          <button key={key} type="button" className="px-btn px-btn--sm" aria-pressed={which === key} onClick={() => setWhich(key)}>
            {key}
          </button>
        ))}
        <ThemeToggle />
      </div>
      <RunBody key={which} run={run} onChange={() => {}} />
    </div>
  )
}
