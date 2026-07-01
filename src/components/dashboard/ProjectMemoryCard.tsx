'use client'
// src/components/dashboard/ProjectMemoryCard.tsx

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ENTRY_TYPE_STYLES: Record<string, { label: string; color: string }> = {
  architecture_decision: { label: 'arch decision', color: '#f59e0b' },
  shipped_feature: { label: 'shipped feature', color: '#22c55e' },
  conflict_resolution: { label: 'conflict', color: '#f43f5e' },
  ux_decision: { label: 'ux decision', color: '#f43f5e' },
  known_constraint: { label: 'constraint', color: '#8b5cf6' },
}

const MOCK_ENTRIES = [
  { type: 'architecture_decision', title: 'Session tokens chosen over JWT', date: '3d ago' },
  { type: 'shipped_feature', title: 'Email OTP login shipped', date: '3d ago' },
  { type: 'known_constraint', title: 'Redis already used for session cache', date: '5d ago' },
  { type: 'conflict_resolution', title: 'SMS vs email OTP — email won', date: '5d ago' },
  { type: 'ux_decision', title: 'Single OTP field over 6 separate boxes', date: '5d ago' },
]

export default function ProjectMemoryCard() {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl overflow-hidden mb-7"
      style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
        >
          🧠
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-white">
            Project memory loaded — {MOCK_ENTRIES.length} entries
          </div>
          <div className="text-[11px] text-white/40">
            Fintech App · architecture decisions, shipped features, and known constraints carried forward
          </div>
        </div>
        <span className={`text-white/30 text-[12px] transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
          ⌄
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 flex flex-col gap-1.5 border-t border-white/[0.06] pt-3">
              {MOCK_ENTRIES.map((entry, i) => {
                const style = ENTRY_TYPE_STYLES[entry.type]
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors duration-150"
                  >
                    <span
                      className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: `${style.color}1f`, color: style.color }}
                    >
                      {style.label}
                    </span>
                    <span className="text-[12px] text-white/60 flex-1 truncate">{entry.title}</span>
                    <span className="text-[10px] text-white/25 flex-shrink-0">{entry.date}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
