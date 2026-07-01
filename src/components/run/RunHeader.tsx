'use client'
// src/components/run/RunHeader.tsx

import { Verdict } from '@/lib/types'
import VerdictBadge from '@/components/shared/VerdictBadge'

interface RunHeaderProps {
  featureRequest: string
  currentStepLabel: string
  isRunning: boolean
  verdict: Verdict | null
}

export default function RunHeader({ featureRequest, currentStepLabel, isRunning, verdict }: RunHeaderProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
      <a
        href="/dashboard"
        className="text-[12px] text-white/40 hover:text-white/70 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-colors duration-200 whitespace-nowrap"
      >
        ← Dashboard
      </a>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">&quot;{featureRequest}&quot;</div>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-white/35 whitespace-nowrap">
        {isRunning && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" style={{ animation: 'pulse-glow 1s ease-in-out infinite' }} />
        )}
        {currentStepLabel}
      </div>
      {verdict && <VerdictBadge verdict={verdict} />}
    </div>
  )
}
