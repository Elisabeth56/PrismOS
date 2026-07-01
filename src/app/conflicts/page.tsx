'use client'
// PLACE AT: src/app/conflicts/page.tsx

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

interface ConflictLog {
  id: string
  session_id: string
  feature_request: string
  project: string
  agents_involved: string[]
  summary: string
  resolution: string
  rationale: string
  date: string
  marker: 'DISAGREES' | 'SECURITY FLAG' | 'PUSHBACK' | 'UX FRICTION' | 'INTEGRATION RISK'
}

const MARKER_STYLES: Record<ConflictLog['marker'], { color: string; bg: string; border: string }> = {
  'DISAGREES':        { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  'SECURITY FLAG':    { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',  border: 'rgba(244,63,94,0.25)' },
  'PUSHBACK':         { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
  'UX FRICTION':      { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)' },
  'INTEGRATION RISK': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' },
}

const MOCK_CONFLICTS: ConflictLog[] = [
  { id: 'c1', session_id: 's1', feature_request: 'Add OTP login', project: 'Fintech App', agents_involved: ['Architect', 'Engineer'], summary: 'JWT vs session tokens for OTP verification flow.', resolution: 'Session tokens chosen for MVP. No stateless requirement exists yet.', rationale: 'Primary tradeoff: simplicity over scalability at MVP stage.', date: '2h ago', marker: 'DISAGREES' },
  { id: 'c2', session_id: 's1', feature_request: 'Add OTP login', project: 'Fintech App', agents_involved: ['QA', 'Engineer'], summary: 'OTP expiry window not enforced at verify endpoint — replay attack possible.', resolution: 'Engineer adds explicit TTL check + attempt counter reset on expiry.', rationale: 'Correctness over speed. Security flags are non-negotiable.', date: '2h ago', marker: 'SECURITY FLAG' },
  { id: 'c3', session_id: 's2', feature_request: 'Build real-time chat', project: 'Fintech App', agents_involved: ['Architect', 'Engineer'], summary: 'Architect specified Redis pub/sub; Engineer proposed simpler in-process EventEmitter for MVP.', resolution: 'EventEmitter for MVP — Redis pub/sub deferred until multi-server deployment is needed.', rationale: 'Ship the simpler solution. Over-engineering for a single-node MVP adds zero value.', date: '5h ago', marker: 'PUSHBACK' },
  { id: 'c4', session_id: 's3', feature_request: 'Add Stripe integration', project: 'E-commerce Platform', agents_involved: ['UI/UX Designer', 'Engineer'], summary: 'Designer specified inline payment form; Engineer pushed for Stripe hosted checkout to avoid PCI scope.', resolution: 'Stripe hosted checkout. Inline form puts product in PCI DSS scope unnecessarily.', rationale: 'Security over UX preference. PCI scope expansion is never acceptable without explicit sign-off.', date: '1d ago', marker: 'UX FRICTION' },
  { id: 'c5', session_id: 's4', feature_request: 'Implement rate limiting', project: 'Internal Dev Tool', agents_involved: ['Engineer'], summary: 'INTEGRATION RISK: rate limiter key collides with existing cache keys in Redis.', resolution: 'Engineer adds ratelimit: prefix to all rate limiter keys to isolate namespace.', rationale: 'Logged as warning. No Release Manager arbitration needed — Engineer self-corrected.', date: '1d ago', marker: 'INTEGRATION RISK' },
  { id: 'c6', session_id: 's6', feature_request: 'Refactor auth module', project: 'Fintech App', agents_involved: ['PM', 'Engineer'], summary: 'PM scoped refactor as no-behavior-change. Engineer identified 2 existing bugs that would be masked if not fixed in this pass.', resolution: 'Bugs fixed within refactor scope. PM updated deferred list.', rationale: 'Correctness over strict scope. Shipping known bugs knowingly is never acceptable.', date: '3d ago', marker: 'DISAGREES' },
]

const ALL_MARKERS = ['All', ...Object.keys(MARKER_STYLES)] as const

export default function ConflictsPage() {
  const [markerFilter, setMarkerFilter] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return MOCK_CONFLICTS.filter((c) => {
      const matchMarker = markerFilter === 'All' || c.marker === markerFilter
      const matchSearch = search === '' ||
        c.summary.toLowerCase().includes(search.toLowerCase()) ||
        c.agents_involved.some((a) => a.toLowerCase().includes(search.toLowerCase())) ||
        c.project.toLowerCase().includes(search.toLowerCase())
      return matchMarker && matchSearch
    })
  }, [markerFilter, search])

  const stats = {
    total: MOCK_CONFLICTS.length,
    security: MOCK_CONFLICTS.filter((c) => c.marker === 'SECURITY FLAG').length,
    disagrees: MOCK_CONFLICTS.filter((c) => c.marker === 'DISAGREES').length,
    pushback: MOCK_CONFLICTS.filter((c) => c.marker === 'PUSHBACK').length,
  }

  return (
    <div className="relative min-h-screen bg-black">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 left-1/3 w-[500px] h-[300px]"
          style={{ background: 'radial-gradient(ellipse, rgba(244,63,94,0.05) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-0 right-1/4 w-[400px] h-[300px]"
          style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <a href="/dashboard" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">Dashboard</a>
            <span className="text-white/20 text-[11px]">/</span>
            <span className="text-[12px] text-white/60">Conflicts</span>
          </div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-white">Conflict log</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Every agent disagreement, resolved by the Release Manager.</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total conflicts', value: stats.total, color: '#f59e0b' },
            { label: 'Security flags', value: stats.security, color: '#f43f5e' },
            { label: 'Disagreements', value: stats.disagrees, color: '#3b82f6' },
            { label: 'Pushbacks', value: stats.pushback, color: '#8b5cf6' },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-xl px-4 py-3.5 text-center"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="font-display text-[22px] font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] text-white/35 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-[13px]">⌕</span>
            <input
              type="text"
              placeholder="Search conflicts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-full pl-10 pr-4 py-2.5 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {ALL_MARKERS.map((m) => {
              const style = m !== 'All' ? MARKER_STYLES[m as ConflictLog['marker']] : null
              return (
                <button key={m} onClick={() => setMarkerFilter(m)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all duration-200 ${
                    markerFilter === m
                      ? 'bg-white text-black border-transparent'
                      : 'text-white/40 border-white/[0.08] hover:text-white/65 hover:border-white/20'
                  }`}
                  style={markerFilter === m && style ? { background: style.bg, color: style.color, borderColor: style.border } : {}}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>

        {/* Conflict cards */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-[13px] text-white/25">No conflicts match your filters.</div>
          )}
          {filtered.map((c, i) => {
            const style = MARKER_STYLES[c.marker]
            const isExpanded = expandedId === c.id
            return (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <button
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: style.color }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 flex-shrink-0"
                    style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}
                  >
                    {c.marker}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-white font-medium truncate">{c.summary}</div>
                    <div className="text-[11px] text-white/35 mt-0.5">
                      {c.agents_involved.join(' ↔ ')} · {c.project} · {c.date}
                    </div>
                  </div>
                  <span className={`text-white/30 text-[11px] transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>⌄</span>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden border-t border-white/[0.06]"
                  >
                    <div className="px-5 py-4 flex flex-col gap-3">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-white/30 mb-1.5">Resolution</div>
                        <div className="text-[13px] text-white/75 bg-white/[0.04] rounded-lg px-3.5 py-2.5 leading-relaxed">→ {c.resolution}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-white/30 mb-1.5">Rationale</div>
                        <div className="text-[12px] text-white/45 italic leading-relaxed">{c.rationale}</div>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <a href={`/run/${c.session_id}`} className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
                          View full run →
                        </a>
                        <span className="text-white/20">·</span>
                        <span className="text-[11px] text-white/30">{c.feature_request}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
