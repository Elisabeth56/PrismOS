'use client'
// PLACE AT: src/app/benchmark/page.tsx

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

interface BenchmarkRow {
  id: string
  feature_request: string
  project: string
  date: string
  mode_a: { issues: number; conflicts: number; edge_cases: number; has_verdict: boolean }
  mode_b: { issues: number; conflicts: number; edge_cases: number; verdict: string }
}

const MOCK_BENCHMARKS: BenchmarkRow[] = [
  { id: 's1', feature_request: 'Add OTP login to a fintech app', project: 'Fintech App', date: '2h ago', mode_a: { issues: 2, conflicts: 0, edge_cases: 1, has_verdict: false }, mode_b: { issues: 9, conflicts: 3, edge_cases: 6, verdict: 'SHIPPABLE' } },
  { id: 's2', feature_request: 'Build real-time chat with WebSockets', project: 'Fintech App', date: '5h ago', mode_a: { issues: 3, conflicts: 0, edge_cases: 2, has_verdict: false }, mode_b: { issues: 7, conflicts: 2, edge_cases: 5, verdict: 'SHIPPABLE' } },
  { id: 's3', feature_request: 'Add Stripe payment integration', project: 'E-commerce', date: '1d ago', mode_a: { issues: 4, conflicts: 0, edge_cases: 2, has_verdict: false }, mode_b: { issues: 11, conflicts: 4, edge_cases: 7, verdict: 'NEEDS_REVISION' } },
  { id: 's4', feature_request: 'Implement rate limiting middleware', project: 'Internal Dev Tool', date: '1d ago', mode_a: { issues: 1, conflicts: 0, edge_cases: 1, has_verdict: false }, mode_b: { issues: 5, conflicts: 1, edge_cases: 4, verdict: 'SHIPPABLE' } },
  { id: 's5', feature_request: 'Add file upload with S3 presigned URLs', project: 'E-commerce', date: '2d ago', mode_a: { issues: 3, conflicts: 0, edge_cases: 2, has_verdict: false }, mode_b: { issues: 8, conflicts: 2, edge_cases: 5, verdict: 'SHIPPABLE' } },
]

type SortKey = 'issues_delta' | 'edge_delta' | 'conflicts' | 'date'

export default function BenchmarkPage() {
  const [sort, setSort] = useState<SortKey>('issues_delta')

  const sorted = useMemo(() => {
    return [...MOCK_BENCHMARKS].sort((a, b) => {
      if (sort === 'issues_delta') return (b.mode_b.issues - b.mode_a.issues) - (a.mode_b.issues - a.mode_a.issues)
      if (sort === 'edge_delta') return (b.mode_b.edge_cases - b.mode_a.edge_cases) - (a.mode_b.edge_cases - a.mode_a.edge_cases)
      if (sort === 'conflicts') return b.mode_b.conflicts - a.mode_b.conflicts
      return 0
    })
  }, [sort])

  const avgImprovements = {
    issues: Math.round(MOCK_BENCHMARKS.reduce((acc, r) => acc + (r.mode_b.issues - r.mode_a.issues), 0) / MOCK_BENCHMARKS.length),
    edges: Math.round(MOCK_BENCHMARKS.reduce((acc, r) => acc + (r.mode_b.edge_cases - r.mode_a.edge_cases), 0) / MOCK_BENCHMARKS.length),
    verdict_rate: Math.round((MOCK_BENCHMARKS.filter((r) => r.mode_b.verdict === 'SHIPPABLE').length / MOCK_BENCHMARKS.length) * 100),
  }

  return (
    <div className="relative min-h-screen bg-black">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px]"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <a href="/dashboard" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">Dashboard</a>
            <span className="text-white/20 text-[11px]">/</span>
            <span className="text-[12px] text-white/60">Benchmark</span>
          </div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-white">Benchmark explorer</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Mode A (single model) vs Mode B (PrismOS) across all completed runs.</p>
        </div>

        {/* Aggregate stats */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="rounded-2xl px-6 py-5 text-center"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="font-display text-[36px] font-bold text-blue-400">+{avgImprovements.issues}</div>
            <div className="text-[12px] text-white/40 mt-1">Avg. extra issues surfaced per run</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}
            className="rounded-2xl px-6 py-5 text-center"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="font-display text-[36px] font-bold text-emerald-400">+{avgImprovements.edges}</div>
            <div className="text-[12px] text-white/40 mt-1">Avg. extra edge cases handled</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}
            className="rounded-2xl px-6 py-5 text-center"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="font-display text-[36px] font-bold text-amber-400">{avgImprovements.verdict_rate}%</div>
            <div className="text-[12px] text-white/40 mt-1">PrismOS SHIPPABLE rate</div>
          </motion.div>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[12px] text-white/35">Sort by:</span>
          {([
            { key: 'issues_delta', label: 'Issues surfaced' },
            { key: 'edge_delta', label: 'Edge cases' },
            { key: 'conflicts', label: 'Conflicts resolved' },
          ] as { key: SortKey; label: string }[]).map((opt) => (
            <button key={opt.key} onClick={() => setSort(opt.key)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
                sort === opt.key ? 'bg-white text-black' : 'bg-white/[0.05] border border-white/[0.08] text-white/45 hover:text-white/70'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Benchmark cards */}
        <div className="flex flex-col gap-4">
          {sorted.map((row, i) => {
            const issuesDelta = row.mode_b.issues - row.mode_a.issues
            const edgeDelta = row.mode_b.edge_cases - row.mode_a.edge_cases
            return (
              <motion.div key={row.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <div>
                    <div className="text-[13px] font-semibold text-white">&quot;{row.feature_request}&quot;</div>
                    <div className="text-[11px] text-white/35 mt-0.5">{row.project} · {row.date}</div>
                  </div>
                  <a href={`/run/${row.id}`} className="text-[12px] text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0">View run →</a>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
                  {[
                    { label: 'Requirements surfaced', a: `${row.mode_a.issues} issues`, b: `${row.mode_b.issues} issues`, delta: `+${issuesDelta}` },
                    { label: 'Edge cases handled', a: `${row.mode_a.edge_cases}`, b: `${row.mode_b.edge_cases}`, delta: `+${edgeDelta}` },
                    { label: 'Conflicts resolved', a: '0', b: `${row.mode_b.conflicts}`, delta: `${row.mode_b.conflicts > 0 ? '✓' : '—'}` },
                    { label: 'Delivery verdict', a: 'No verdict', b: row.mode_b.verdict === 'SHIPPABLE' ? 'SHIPPABLE' : 'NEEDS REVISION', delta: row.mode_b.verdict === 'SHIPPABLE' ? '✓' : '⚠' },
                  ].map((metric) => (
                    <div key={metric.label} className="px-5 py-4">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-white/30 mb-3">{metric.label}</div>
                      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                        <div className="text-[13px] text-white/35">{metric.a}</div>
                        <div className="text-white/20 text-[11px]">→</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-white">{metric.b}</span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-1.5 py-0.5">
                            {metric.delta}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
