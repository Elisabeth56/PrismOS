'use client'
// src/components/dashboard/SessionsTable.tsx

import { motion } from 'framer-motion'
import VerdictBadge from '@/components/shared/VerdictBadge'
import { Session } from '@/lib/types'

const MOCK_SESSIONS: Session[] = [
  {
    id: '1',
    feature_request: 'Add OTP login to a fintech app',
    feature_classification: 'enhancement',
    verdict: 'SHIPPABLE',
    step_completed: 9,
    created_at: '2h ago',
    context_provided: true,
    agents_count: 7,
    conflicts_resolved: 3,
    run_duration_seconds: 138,
  },
  {
    id: '2',
    feature_request: 'Build a real-time chat with WebSockets',
    feature_classification: 'new_feature',
    verdict: 'SHIPPABLE',
    step_completed: 9,
    created_at: '5h ago',
    context_provided: true,
    agents_count: 7,
    conflicts_resolved: 2,
    run_duration_seconds: 184,
  },
  {
    id: '3',
    feature_request: 'Add Stripe payment integration',
    feature_classification: 'new_feature',
    verdict: 'NEEDS_REVISION',
    step_completed: 9,
    created_at: '1d ago',
    context_provided: true,
    agents_count: 7,
    conflicts_resolved: 4,
    run_duration_seconds: 281,
  },
  {
    id: '4',
    feature_request: 'Implement rate limiting middleware',
    feature_classification: 'enhancement',
    verdict: 'SHIPPABLE',
    step_completed: 9,
    created_at: '1d ago',
    context_provided: true,
    agents_count: 7,
    conflicts_resolved: 1,
    run_duration_seconds: 112,
  },
  {
    id: '5',
    feature_request: 'Add 2FA backup codes to OTP login',
    feature_classification: 'enhancement',
    verdict: 'RUNNING',
    step_completed: 5,
    created_at: 'now',
    context_provided: true,
    agents_count: 4,
    conflicts_resolved: 1,
    run_duration_seconds: 72,
  },
]

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
  onOpenRun: (session: Session) => void
}

export default function SessionsTable({ onOpenRun }: SessionsTableProps) {
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

        {MOCK_SESSIONS.map((session, i) => (
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
