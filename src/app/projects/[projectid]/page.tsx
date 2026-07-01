'use client'
// PLACE AT: src/app/projects/[projectId]/page.tsx

import { useState } from 'react'
import { motion } from 'framer-motion'
import VerdictBadge from '@/components/shared/VerdictBadge'

type EntryType = 'architecture_decision' | 'shipped_feature' | 'conflict_resolution' | 'ux_decision' | 'known_constraint'
type FilterType = EntryType | 'all'

const ENTRY_CONFIG: Record<EntryType, { label: string; color: string; icon: string }> = {
  architecture_decision: { label: 'Arch decision', color: '#f59e0b', icon: '⚙' },
  shipped_feature:       { label: 'Shipped feature', color: '#22c55e', icon: '✓' },
  conflict_resolution:   { label: 'Conflict', color: '#f43f5e', icon: '⚖' },
  ux_decision:           { label: 'UX decision', color: '#f43f5e', icon: '◈' },
  known_constraint:      { label: 'Constraint', color: '#8b5cf6', icon: '⚠' },
}

const MOCK_MEMORY = [
  { id: 'm1', type: 'architecture_decision' as EntryType, title: 'Session tokens chosen over JWT', content: 'No stateless requirement exists at MVP. JWT adds complexity with no user research to justify it.', tags: ['auth', 'sessions'], date: '3d ago', agents: ['Architect', 'Engineer', 'Release Manager'] },
  { id: 'm2', type: 'shipped_feature' as EntryType, title: 'Email OTP login', content: 'Full OTP flow shipped — send, verify, rate-limit, expiry. Redis keyed as otp:{email}.', tags: ['auth', 'otp', 'redis'], date: '3d ago', agents: ['Engineer', 'QA'] },
  { id: 'm3', type: 'known_constraint' as EntryType, title: 'Redis already used for session cache', content: 'OTP key namespace must not collide with session keys. Use otp: prefix consistently.', tags: ['redis', 'constraint'], date: '3d ago', agents: ['Context Analyst'] },
  { id: 'm4', type: 'conflict_resolution' as EntryType, title: 'SMS vs email OTP — email chosen', content: 'SMS adds vendor dependency with no user research to justify it at this stage.', tags: ['otp', 'scope'], date: '3d ago', agents: ['Release Manager'] },
  { id: 'm5', type: 'ux_decision' as EntryType, title: 'Single OTP field over 6 separate boxes', content: 'Single field supports paste, reduces focus events, is mobile-friendly. 6-box approach creates UX friction.', tags: ['otp', 'ux'], date: '3d ago', agents: ['UI/UX Designer'] },
  { id: 'm6', type: 'shipped_feature' as EntryType, title: 'Transaction history with pagination', content: 'GET /transactions with cursor-based pagination. 20 items per page default.', tags: ['transactions', 'api'], date: '5d ago', agents: ['Engineer', 'QA'] },
]

const MOCK_RUNS = [
  { id: 'run-1', request: 'Add OTP login to fintech app', verdict: 'SHIPPABLE' as const, conflicts: 3, date: '3d ago', duration: '2m 18s' },
  { id: 'run-2', request: 'Build transaction history with pagination', verdict: 'SHIPPABLE' as const, conflicts: 1, date: '5d ago', duration: '1m 52s' },
  { id: 'run-3', request: 'Add Stripe payment integration', verdict: 'NEEDS_REVISION' as const, conflicts: 4, date: '7d ago', duration: '4m 41s' },
]

export default function ProjectDetailPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = filter === 'all' ? MOCK_MEMORY : MOCK_MEMORY.filter((e) => e.type === filter)
  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    ...Object.entries(ENTRY_CONFIG).map(([k, v]) => ({ value: k as FilterType, label: v.label })),
  ]

  return (
    <div className="relative min-h-screen bg-black">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 left-0 w-[500px] h-[350px]"
          style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Breadcrumb + header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <a href="/dashboard" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">Dashboard</a>
            <span className="text-white/20 text-[11px]">/</span>
            <a href="/projects" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">Projects</a>
            <span className="text-white/20 text-[11px]">/</span>
            <span className="text-[12px] text-white/60">Fintech App</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-[14px] font-bold text-black">F</div>
                <h1 className="font-display text-[28px] font-bold tracking-tight text-white">Fintech App</h1>
              </div>
              <p className="text-[13px] text-white/40">Mobile-first fintech product with auth, transactions, and KYC flow.</p>
            </div>
            <a href="/run/new"
              className="bg-white text-black font-semibold text-[13px] px-5 py-2.5 rounded-full hover:opacity-88 transition-all duration-200 hover:-translate-y-px whitespace-nowrap">
              + New run
            </a>
          </div>

          {/* Project stats */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Total runs', value: '14' },
              { label: 'Memory entries', value: '38' },
              { label: 'Conflicts resolved', value: '12' },
              { label: 'Shippable rate', value: '86%' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl px-4 py-3.5 text-center"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="font-display text-[22px] font-bold text-white">{s.value}</div>
                <div className="text-[11px] text-white/35 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Memory entries */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
                🧠 Project memory
                <span className="text-[11px] font-normal text-white/35">{MOCK_MEMORY.length} entries</span>
              </h2>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {filterOptions.map((opt) => (
                <button key={opt.value} onClick={() => setFilter(opt.value)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
                    filter === opt.value
                      ? 'bg-white text-black'
                      : 'bg-white/[0.05] border border-white/[0.08] text-white/45 hover:text-white/70'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2.5">
              {filtered.map((entry, i) => {
                const cfg = ENTRY_CONFIG[entry.type]
                const isExpanded = expandedId === entry.id
                return (
                  <motion.div key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                    className="rounded-xl overflow-hidden cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l" style={{ background: cfg.color }} />
                      <span className="text-[11px]" style={{ color: cfg.color }}>{cfg.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5"
                        style={{ color: cfg.color, background: `${cfg.color}1f` }}>
                        {cfg.label}
                      </span>
                      <span className="text-[13px] text-white font-medium flex-1 truncate">{entry.title}</span>
                      <span className="text-[11px] text-white/25 flex-shrink-0">{entry.date}</span>
                      <span className={`text-white/30 text-[11px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>⌄</span>
                    </div>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-4 border-t border-white/[0.06] pt-3"
                      >
                        <p className="text-[13px] text-white/55 leading-relaxed mb-3">{entry.content}</p>
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map((tag) => (
                            <span key={tag} className="text-[10px] bg-white/[0.05] border border-white/[0.08] rounded-full px-2.5 py-0.5 text-white/40">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 text-[11px] text-white/30">
                          Agents: {entry.agents.join(', ')}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Run history sidebar */}
          <div>
            <h2 className="text-[15px] font-semibold text-white mb-4">Run history</h2>
            <div className="flex flex-col gap-2.5">
              {MOCK_RUNS.map((run, i) => (
                <motion.a key={run.id} href={`/run/${run.id}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="block rounded-xl p-4 hover:border-white/[0.14] transition-all duration-200 group"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <p className="text-[12px] text-white font-medium line-clamp-2 flex-1">&quot;{run.request}&quot;</p>
                    <span className="text-white/25 text-[11px] group-hover:text-white/50 transition-colors flex-shrink-0">→</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <VerdictBadge verdict={run.verdict} size="sm" />
                    <span className="text-[10px] text-white/30">{run.conflicts} conflicts</span>
                    <span className="text-[10px] text-white/25 ml-auto">{run.date}</span>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
