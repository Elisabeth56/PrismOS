'use client'
// src/components/run/AgentPanel.tsx

import { motion } from 'framer-motion'
import { AgentType, AgentStatus } from '@/lib/types'
import { AGENT_CONFIG } from '@/lib/constants'

interface AgentPanelProps {
  agent: AgentType
  status: AgentStatus
  output: string
  isActive: boolean
}

export default function AgentPanel({ agent, status, output, isActive }: AgentPanelProps) {
  const config = AGENT_CONFIG[agent]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative rounded-2xl overflow-hidden flex flex-col min-h-[220px] transition-all duration-500 ${
        status === 'idle' ? 'opacity-45' : 'opacity-100'
      }`}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: isActive ? `1px solid ${config.hex}66` : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isActive ? `0 0 24px ${config.hex}22` : 'none',
      }}
    >
      {isActive && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ boxShadow: `inset 0 0 30px ${config.hex}15` }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: config.hex }} />
          <span className="text-[11px] font-bold text-white truncate">{config.label}</span>
        </div>
        <StatusChip status={status} color={config.hex} />
      </div>

      {/* Body */}
      <div className="flex-1 p-3.5 overflow-hidden relative">
        {status === 'idle' ? (
          <div className="flex flex-col gap-2 mt-1">
            {[80, 60, 90, 50].map((w, i) => (
              <div
                key={i}
                className="h-1 rounded-full bg-white/[0.06]"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ) : (
          <pre className="text-[10.5px] font-mono text-white/55 leading-[1.7] whitespace-pre-wrap break-words">
            {output}
            {isActive && (
              <span
                className="inline-block w-[2px] h-3 ml-0.5 align-middle"
                style={{ background: config.hex, animation: 'cursor-blink 1s step-end infinite' }}
              />
            )}
          </pre>
        )}
      </div>
    </motion.div>
  )
}

function StatusChip({ status, color }: { status: AgentStatus; color: string }) {
  if (status === 'idle') {
    return <span className="text-[9px] font-semibold text-white/25 bg-white/[0.04] rounded-full px-2 py-0.5">Idle</span>
  }
  if (status === 'running') {
    return (
      <span
        className="text-[9px] font-semibold rounded-full px-2 py-0.5 flex items-center gap-1"
        style={{ color, background: `${color}1f` }}
      >
        <span className="w-1 h-1 rounded-full" style={{ background: color, animation: 'pulse-glow 1s ease-in-out infinite' }} />
        Running
      </span>
    )
  }
  if (status === 'error') {
    return <span className="text-[9px] font-semibold text-red-400 bg-red-500/10 rounded-full px-2 py-0.5">Error</span>
  }
  return <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5">Done</span>
}
