'use client'
// src/components/dashboard/SessionsTable.tsx

import { motion } from 'framer-motion'
import VerdictBadge from '@/components/shared/VerdictBadge'
import { Session } from '@/lib/types'

const CLASSIFICATION_LABELS: Record<string, string> = {
  new_feature: 'New feature',
  enhancement: 'Enhancement',
  refactor: 'Refactor',
  bug_fix: 'Bug fix',
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

interface SessionsTableProps {
  sessions?: Session[]
  loading?: boolean
  onOpenRun: (session: Session) => void
}

export default function SessionsTable({ sessions, loading, onOpenRun }: SessionsTableProps) {
  const rows = sessions || []

  return (
    <div>
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-[15px] font-semibold text-white">Recent sessions</h2>
        <div className="flex gap-1.5">
          {['All', 'Shippable', 'Needs revision'].map((f, i) => (
            <button
              key={f}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-200 ${
                i === 0
                  ? 'bg-white/[0.08] text-white border border-white/[0.1]'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_90px] px-5 py-2.5 border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-wider text-white/30">
          <div>Feature request</div>
          <div>Classification</div>
          <div>Agents</div>
          <div>Verdict</div>
          <div className="text-right">Duration</div>
        </div>

        {loading && (
          <div className="text-center py-12 text-[13px] text-white/25">Loading sessions…</div>
        )}

        {!loading && rows.length === 0 && (
          <div className="text-center py-12 text-[13px] text-white/25">No sessions yet. Start your first run.</div>
        )}

        {rows.map((session, i) => (
          <motion.button
            key={session.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            onClick={() => onOpenRun(session)}
            className="w-full grid grid-cols-[2.5fr_1fr_1fr_1fr_90px] px-5 py-3.5 border-b border-white/[0.04] last:border-0 items-center text-left hover:bg-white/[0.025] transition-colors duration-150 group"
          >
            <div className="text-[13px] text-white font-medium truncate pr-4">
              &quot;{session.feature_request}&quot;
            </div>
            <div className="text-[12px] text-white/45">
              {CLASSIFICATION_LABELS[session.feature_classification]}
            </div>
            <div className="text-[12px] text-white/45">{session.agents_count} / 7</div>
            <div>
              <VerdictBadge verdict={session.verdict} size="sm" />
            </div>
            <div className="text-[12px] text-white/35 text-right flex items-center justify-end gap-2">
              {formatDuration(session.run_duration_seconds)}
              <span className="opacity-0 group-hover:opacity-60 transition-opacity duration-150">→</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
