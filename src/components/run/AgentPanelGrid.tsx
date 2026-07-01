'use client'
// src/components/run/AgentPanelGrid.tsx

import AgentPanel from './AgentPanel'
import { AgentType, AgentStatus } from '@/lib/types'
import { AGENT_ORDER } from '@/lib/constants'

export interface AgentRunState {
  status: AgentStatus
  output: string
}

interface AgentPanelGridProps {
  agentStates: Record<AgentType, AgentRunState>
  activeAgent: AgentType | null
}

export default function AgentPanelGrid({ agentStates, activeAgent }: AgentPanelGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
      {AGENT_ORDER.map((agent) => (
        <AgentPanel
          key={agent}
          agent={agent}
          status={agentStates[agent].status}
          output={agentStates[agent].output}
          isActive={activeAgent === agent}
        />
      ))}
    </div>
  )
}
