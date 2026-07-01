// src/components/shared/VerdictBadge.tsx

import { Verdict } from '@/lib/types'

interface VerdictBadgeProps {
  verdict: Verdict
  size?: 'sm' | 'md'
}

const STYLES: Record<Verdict, string> = {
  SHIPPABLE: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
  NEEDS_REVISION: 'bg-amber-500/12 text-amber-400 border-amber-500/25',
  RUNNING: 'bg-blue-500/12 text-blue-400 border-blue-500/25',
}

const LABELS: Record<Verdict, string> = {
  SHIPPABLE: 'SHIPPABLE',
  NEEDS_REVISION: 'NEEDS REVISION',
  RUNNING: 'RUNNING',
}

export default function VerdictBadge({ verdict, size = 'md' }: VerdictBadgeProps) {
  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-[11px]'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${padding} ${STYLES[verdict]}`}
    >
      {verdict === 'RUNNING' && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" style={{ animation: 'pulse-glow 1.2s ease-in-out infinite' }} />
      )}
      {verdict === 'SHIPPABLE' && '✓ '}
      {LABELS[verdict]}
    </span>
  )
}
