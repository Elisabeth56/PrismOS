'use client'
// src/components/dashboard/ProjectMemoryCard.tsx

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getProjectMemory } from '@/lib/api'

const ENTRY_TYPE_STYLES: Record<string, { label: string; color: string }> = {
  architecture_decision: { label: 'arch decision', color: '#f59e0b' },
  shipped_feature: { label: 'shipped feature', color: '#22c55e' },
  conflict_resolution: { label: 'conflict', color: '#f43f5e' },
  ux_decision: { label: 'ux decision', color: '#f43f5e' },
  known_constraint: { label: 'constraint', color: '#8b5cf6' },
  release_record: { label: 'release', color: '#3b82f6' },
}

interface MemoryEntryDisplay {
  type: string
  title: string
  date: string
}

interface ProjectMemoryCardProps {
  projectId?: string
  projectName?: string
  entries?: MemoryEntryDisplay[]
}

export default function ProjectMemoryCard({ projectId, projectName, entries: propEntries }: ProjectMemoryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [entries, setEntries] = useState<MemoryEntryDisplay[]>(propEntries || [])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (propEntries) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEntries(propEntries)
      return
    }

    if (!projectId) return

    setLoading(true)
    getProjectMemory(projectId).then((result) => {
      if (result.ok) {
        setEntries(
          result.data.entries.map((e) => ({
            type: e.entry_type,
            title: e.title,
            date: e.created_at,
          }))
        )
      }
      setLoading(false)
    })
  }, [projectId, propEntries])

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
            {loading ? 'Loading project memory…' : `Project memory loaded — ${entries.length} entries`}
          </div>
          <div className="text-[11px] text-white/40">
            {projectName || 'Project'} · architecture decisions, shipped features, and known constraints carried forward
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
              {entries.length === 0 && !loading && (
                <div className="text-[12px] text-white/25 text-center py-3">No memory entries yet.</div>
              )}
              {entries.map((entry, i) => {
                const style = ENTRY_TYPE_STYLES[entry.type] || { label: entry.type, color: '#6b7280' }
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
