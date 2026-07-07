'use client'
// src/components/run/ConflictLogPanel.tsx

import { motion } from 'framer-motion'

export interface ConflictRecord {
  id: string
  agentsInvolved: string[]
  summary: string
  resolution: string
  rationale: string
}

interface ConflictLogPanelProps {
  conflicts: ConflictRecord[]
}

export default function ConflictLogPanel({ conflicts }: ConflictLogPanelProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <span className="text-[13px]">⚖</span>
          <span className="text-[13px] font-bold text-white">Conflict log</span>
          {conflicts.length > 0 && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
              {conflicts.length} resolved
            </span>
          )}
        </div>
        <span className="text-[11px] text-white/30">Release Manager</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {conflicts.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
            <span className="text-[22px] opacity-20 mb-2">⚖</span>
            <p className="text-[12px] text-white/25">No conflicts yet. Waiting on the parallel debate to finish.</p>
          </div>
        )}
        {conflicts.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="relative shrink-0 rounded-xl p-3.5 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500 rounded-l" />
            <div className="text-[10px] font-bold uppercase tracking-wide text-amber-400 mb-1.5">
              {c.agentsInvolved.join(' ↔ ')}
            </div>
            <p className="text-[12px] text-white/55 leading-relaxed mb-2 whitespace-pre-wrap">{c.summary}</p>
            <div className="text-[11px] text-white font-medium bg-white/[0.04] rounded-lg px-3 py-2 leading-relaxed">
              → {c.resolution}
            </div>
            <p className="text-[10px] text-white/30 italic mt-1.5">{c.rationale}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
