// src/components/shared/AgentBadge.tsx

import { AgentType } from '@/lib/types'
import { AGENT_CONFIG } from '@/lib/constants'

interface AgentBadgeProps {
  agent: AgentType
  size?: 'sm' | 'md'
}

export default function AgentBadge({ agent, size = 'md' }: AgentBadgeProps) {
  const config = AGENT_CONFIG[agent]
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-[13px]'

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`${dotSize} rounded-full flex-shrink-0`} style={{ background: config.hex }} />
      <span className={`${textSize} font-semibold text-white`}>{config.label}</span>
    </div>
  )
}
