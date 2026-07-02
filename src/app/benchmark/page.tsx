'use client'
// src/app/benchmark/page.tsx

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getSessions, getBenchmark } from '@/lib/api'
import VerdictBadge from '@/components/shared/VerdictBadge'
import { Verdict } from '@/lib/types'

interface BenchmarkRow {
  session_id: string
  feature_request: string
  project: string
  verdict: Verdict
  date: string
  metrics: {
    coverage: { baseline: number; prismos: number }
    conflicts: number
    edgeCases: { baseline: number; prismos: number }
    verdictClarity: { baseline: boolean; prismos: boolean }
  }
}

function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  } catch {
    return dateStr
  }
}

export default function BenchmarkPage() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBenchmarks() {
      const sessResult = await getSessions()
      if (!sessResult.ok) {
        setLoading(false)
        return
      }

      // Fetch benchmark data for each session
      const rows: BenchmarkRow[] = []
      
      await Promise.all(
        sessResult.data.sessions.map(async (s) => {
          const bResult = await getBenchmark(s.id)
          if (bResult.ok) {
            rows.push({
              session_id: s.id,
              feature_request: s.feature_request,
              project: 'Project',
              verdict: s.verdict,
              date: formatTimeAgo(s.created_at),
              metrics: {
                coverage: bResult.data.metrics.requirement_coverage,
                conflicts: bResult.data.metrics.conflict_count,
                edgeCases: bResult.data.metrics.edge_cases_handled,
                verdictClarity: bResult.data.metrics.verdict_clarity,
              }
            })
          }
        })
      )

      rows.sort((a, b) => b.session_id.localeCompare(a.session_id))
      setBenchmarks(rows)
      setLoading(false)
    }

    loadBenchmarks()
  }, [])

  return (
    <div className="relative min-h-screen bg-black">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <a href="/dashboard" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">Dashboard</a>
            <span className="text-white/20 text-[11px]">/</span>
            <span className="text-[12px] text-white/60">Benchmark</span>
          </div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-white flex items-center gap-3">
            Qwen Benchmark
            <span className="text-[12px] font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Auto-eval
            </span>
          </h1>
          <p className="text-[13px] text-white/40 mt-1 max-w-2xl leading-relaxed">
            Every PrismOS run automatically compares its output against a single-prompt baseline using Qwen. 
            This matrix tracks structural improvements across all runs.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[13px] text-white/25">Loading benchmark data…</div>
        ) : benchmarks.length === 0 ? (
          <div className="text-center py-20 text-[13px] text-white/25">No benchmark data recorded yet.</div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-wider text-white/30">
                    <th className="py-3 px-5 font-bold">Feature Run</th>
                    <th className="py-3 px-5 font-bold">Requirements</th>
                    <th className="py-3 px-5 font-bold text-center">Edge Cases</th>
                    <th className="py-3 px-5 font-bold text-center">Conflicts Fixed</th>
                    <th className="py-3 px-5 font-bold text-center">Ship Verdict</th>
                    <th className="py-3 px-5 font-bold text-right">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarks.map((row, i) => (
                    <motion.tr
                      key={row.session_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="text-[13px] font-medium text-white mb-0.5 line-clamp-1 pr-4">
                          <a href={`/run/${row.session_id}`} className="hover:underline">
                            &quot;{row.feature_request}&quot;
                          </a>
                        </div>
                        <div className="text-[11px] text-white/30">{row.project} · {row.date}</div>
                      </td>
                      
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-white/40 line-through decoration-white/20">{row.metrics.coverage.baseline}</span>
                          <span className="text-[10px] text-emerald-400">→</span>
                          <span className="text-[13px] text-emerald-400 font-semibold">{row.metrics.coverage.prismos}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-[12px] text-white/40 line-through decoration-white/20">{row.metrics.edgeCases.baseline}</span>
                          <span className="text-[10px] text-emerald-400">→</span>
                          <span className="text-[13px] text-emerald-400 font-semibold">{row.metrics.edgeCases.prismos}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 rounded-full bg-rose-500/10 text-rose-400 text-[12px] font-bold px-2">
                          {row.metrics.conflicts}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-[12px] text-white/40">{row.metrics.verdictClarity.baseline ? 'Clear' : 'Vague'}</span>
                          <span className="text-[10px] text-emerald-400">→</span>
                          <span className="text-[13px] text-emerald-400 font-semibold">{row.metrics.verdictClarity.prismos ? 'Strict' : 'Vague'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <VerdictBadge verdict={row.verdict} size="sm" />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
