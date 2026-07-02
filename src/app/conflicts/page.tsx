'use client'
// src/app/conflicts/page.tsx

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSessions, getSession } from '@/lib/api'

interface ConflictLog {
  id: string
  session_id: string
  project: string
  feature_request: string
  agents: string[]
  summary: string
  resolution: string
  rationale: string
  date: string
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

export default function ConflictsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<ConflictLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadConflicts() {
      const sessResult = await getSessions()
      if (!sessResult.ok) {
        setLoading(false)
        return
      }

      // Filter sessions that have conflicts
      const sessionsWithConflicts = sessResult.data.sessions.filter(s => s.conflicts_resolved > 0)
      
      // Fetch details for those sessions to get the actual conflict data
      // (This is an N+1 pattern, but acceptable since we don't have a /conflicts endpoint)
      const logs: ConflictLog[] = []
      
      await Promise.all(
        sessionsWithConflicts.map(async (s) => {
          const detailResult = await getSession(s.id)
          if (detailResult.ok && detailResult.data.conflicts) {
            detailResult.data.conflicts.forEach(c => {
              logs.push({
                id: c.conflict_id,
                session_id: s.id,
                project: 'Project', // The backend doesn't currently return project on session detail, fallback
                feature_request: detailResult.data.feature_request,
                agents: c.agents_involved,
                summary: c.summary,
                resolution: c.resolution,
                rationale: c.rationale,
                date: formatTimeAgo(s.created_at)
              })
            })
          }
        })
      )

      // Sort by date (descending) — since we only have formatted strings, we sort by parsing them back or just trust the sessions order
      // We will trust the sessions list order mostly, but since Promise.all doesn't guarantee array order, we sort by ID for consistency
      logs.sort((a, b) => b.id.localeCompare(a.id))

      setConflicts(logs)
      setLoading(false)
    }

    loadConflicts()
  }, [])

  return (
    <div className="relative min-h-screen bg-black">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[400px] h-[300px]"
          style={{ background: 'radial-gradient(ellipse, rgba(244,63,94,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <a href="/dashboard" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">Dashboard</a>
            <span className="text-white/20 text-[11px]">/</span>
            <span className="text-[12px] text-white/60">Conflicts</span>
          </div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-white flex items-center gap-3">
            Conflict Log
            {!loading && conflicts.length > 0 && (
              <span className="text-[12px] font-normal px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {conflicts.length} recorded
              </span>
            )}
          </h1>
          <p className="text-[13px] text-white/40 mt-1">A transparent ledger of all inter-agent debates and how the Release Manager resolved them.</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[13px] text-white/25">Loading conflicts…</div>
        ) : conflicts.length === 0 ? (
          <div className="text-center py-20 text-[13px] text-white/25">No conflicts recorded yet.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {conflicts.map((conflict, i) => {
              const isExpanded = expandedId === conflict.id
              return (
                <motion.div
                  key={conflict.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl overflow-hidden cursor-pointer group"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                  onClick={() => setExpandedId(isExpanded ? null : conflict.id)}
                >
                  <div className="p-5 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[12px] flex-shrink-0 mt-1">
                      ⚖
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="text-[14px] font-semibold text-white mb-1 leading-snug">
                            {conflict.summary}
                          </div>
                          <div className="text-[11px] text-white/40">
                            in <a href={`/run/${conflict.session_id}`} className="text-blue-400 hover:underline hover:text-blue-300 transition-colors" onClick={(e) => e.stopPropagation()}>
                              &quot;{conflict.feature_request}&quot;
                            </a>
                            <span className="mx-2 opacity-30">•</span>
                            {conflict.date}
                          </div>
                        </div>
                        <span className={`text-white/25 group-hover:text-white/50 transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          ⌄
                        </span>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        {conflict.agents.map((agent) => (
                          <span key={agent} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] text-white/50 border border-white/[0.08]">
                            {agent.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-2 border-t border-white/[0.05] flex flex-col gap-4 mt-2">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400/80 mb-1.5">Resolution</div>
                            <div className="text-[13px] text-white/70 leading-relaxed bg-rose-500/[0.03] border border-rose-500/10 rounded-xl p-3.5">
                              {conflict.resolution}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1.5">Rationale</div>
                            <div className="text-[13px] text-white/45 leading-relaxed bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5">
                              {conflict.rationale}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
