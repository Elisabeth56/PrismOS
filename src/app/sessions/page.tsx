'use client'
// PLACE AT: src/app/sessions/page.tsx

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import VerdictBadge from '@/components/shared/VerdictBadge'
import { Verdict, FeatureClassification } from '@/lib/types'

interface SessionRow {
  id: string
  feature_request: string
  feature_classification: FeatureClassification
  verdict: Verdict
  project: string
  conflicts_resolved: number
  agents_count: number
  run_duration: string
  created_at: string
}

const MOCK_SESSIONS: SessionRow[] = [
  { id: 's1', feature_request: 'Add OTP login to a fintech app', feature_classification: 'enhancement', verdict: 'SHIPPABLE', project: 'Fintech App', conflicts_resolved: 3, agents_count: 7, run_duration: '2m 18s', created_at: '2h ago' },
  { id: 's2', feature_request: 'Build real-time chat with WebSockets', feature_classification: 'new_feature', verdict: 'SHIPPABLE', project: 'Fintech App', conflicts_resolved: 2, agents_count: 7, run_duration: '3m 04s', created_at: '5h ago' },
  { id: 's3', feature_request: 'Add Stripe payment integration', feature_classification: 'new_feature', verdict: 'NEEDS_REVISION', project: 'E-commerce Platform', conflicts_resolved: 4, agents_count: 7, run_duration: '4m 41s', created_at: '1d ago' },
  { id: 's4', feature_request: 'Implement rate limiting middleware', feature_classification: 'enhancement', verdict: 'SHIPPABLE', project: 'Internal Dev Tool', conflicts_resolved: 1, agents_count: 7, run_duration: '1m 52s', created_at: '1d ago' },
  { id: 's5', feature_request: 'Add file upload with S3 and presigned URLs', feature_classification: 'new_feature', verdict: 'SHIPPABLE', project: 'E-commerce Platform', conflicts_resolved: 2, agents_count: 7, run_duration: '2m 37s', created_at: '2d ago' },
  { id: 's6', feature_request: 'Refactor auth module to use middleware pattern', feature_classification: 'refactor', verdict: 'SHIPPABLE', project: 'Fintech App', conflicts_resolved: 1, agents_count: 7, run_duration: '2m 01s', created_at: '3d ago' },
  { id: 's7', feature_request: 'Fix race condition in transaction processing', feature_classification: 'bug_fix', verdict: 'NEEDS_REVISION', project: 'Fintech App', conflicts_resolved: 2, agents_count: 7, run_duration: '3m 22s', created_at: '4d ago' },
]

const CLASSIFICATION_LABELS: Record<FeatureClassification, string> = {
  new_feature: 'New feature',
  enhancement: 'Enhancement',
  refactor: 'Refactor',
  bug_fix: 'Bug fix',
}

const VERDICT_FILTERS = ['All', 'SHIPPABLE', 'NEEDS_REVISION']
const CLASS_FILTERS: Array<'all' | FeatureClassification> = ['all', 'new_feature', 'enhancement', 'refactor', 'bug_fix']

export default function SessionsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [verdictFilter, setVerdictFilter] = useState('All')
  const [classFilter, setClassFilter] = useState<'all' | FeatureClassification>('all')

  const filtered = useMemo(() => {
    return MOCK_SESSIONS.filter((s) => {
      const matchSearch = search === '' || s.feature_request.toLowerCase().includes(search.toLowerCase()) || s.project.toLowerCase().includes(search.toLowerCase())
      const matchVerdict = verdictFilter === 'All' || s.verdict === verdictFilter
      const matchClass = classFilter === 'all' || s.feature_classification === classFilter
      return matchSearch && matchVerdict && matchClass
    })
  }, [search, verdictFilter, classFilter])

  return (
    <div className="relative min-h-screen bg-black">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 right-1/3 w-[500px] h-[300px]"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <a href="/dashboard" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">Dashboard</a>
            <span className="text-white/20 text-[11px]">/</span>
            <span className="text-[12px] text-white/60">Sessions</span>
          </div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-white">Sessions</h1>
          <p className="text-[13px] text-white/40 mt-0.5">All agent runs across your projects.</p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-[13px]">⌕</span>
            <input
              type="text"
              placeholder="Search by request or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-full pl-10 pr-4 py-2.5 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {VERDICT_FILTERS.map((v) => (
              <button key={v} onClick={() => setVerdictFilter(v)}
                className={`px-3.5 py-2 rounded-full text-[12px] font-medium transition-all duration-200 ${
                  verdictFilter === v ? 'bg-white text-black' : 'bg-white/[0.05] border border-white/[0.08] text-white/45 hover:text-white/70'
                }`}>
                {v === 'All' ? 'All verdicts' : v === 'SHIPPABLE' ? '✓ Shippable' : '⚠ Needs revision'}
              </button>
            ))}
          </div>
        </div>

        {/* Classification filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CLASS_FILTERS.map((c) => (
            <button key={c} onClick={() => setClassFilter(c)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
                classFilter === c ? 'bg-white/[0.1] border border-white/[0.2] text-white' : 'text-white/35 hover:text-white/60'
              }`}>
              {c === 'all' ? 'All types' : CLASSIFICATION_LABELS[c]}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_90px_80px] px-5 py-3 border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-wider text-white/30">
            <div>Feature request</div>
            <div>Project</div>
            <div>Type</div>
            <div>Verdict</div>
            <div>Agents</div>
            <div className="text-right">Time</div>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-[13px] text-white/25">No sessions match your filters.</div>
          )}

          {filtered.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              onClick={() => router.push(`/run/${s.id}?request=${encodeURIComponent(s.feature_request)}`)}
              className="w-full grid grid-cols-[2.5fr_1fr_1fr_1fr_90px_80px] px-5 py-3.5 border-b border-white/[0.04] last:border-0 items-center text-left hover:bg-white/[0.025] transition-colors duration-150 group"
            >
              <div className="text-[13px] text-white font-medium truncate pr-4">&quot;{s.feature_request}&quot;</div>
              <div className="text-[12px] text-white/45 truncate">{s.project}</div>
              <div className="text-[12px] text-white/45">{CLASSIFICATION_LABELS[s.feature_classification]}</div>
              <div><VerdictBadge verdict={s.verdict} size="sm" /></div>
              <div className="text-[12px] text-white/35">{s.agents_count} / 7</div>
              <div className="text-[12px] text-white/35 text-right flex items-center justify-end gap-1.5">
                {s.run_duration}
                <span className="opacity-0 group-hover:opacity-60 transition-opacity">→</span>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-4 text-[12px] text-white/25 text-right">
          {filtered.length} of {MOCK_SESSIONS.length} sessions shown
        </div>
      </div>
    </div>
  )
}
