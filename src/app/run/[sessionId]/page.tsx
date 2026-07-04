'use client'
// src/app/run/[sessionId]/page.tsx

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import RunHeader from '@/components/run/RunHeader'
import AgentPanelGrid, { AgentRunState } from '@/components/run/AgentPanelGrid'
import ConflictLogPanel, { ConflictRecord } from '@/components/run/ConflictLogPanel'
import FinalPackagePanel from '@/components/run/FinalPackagePanel'
import { AgentType, Verdict, SSEEvent } from '@/lib/types'
import { AGENT_ORDER } from '@/lib/constants'
import { API_BASE, getSession } from '@/lib/api'

const STEP_LABELS = [
  'Step 0 — Loading project memory',
  'Step 1 — Context Analyst mapping product',
  'Step 2 — Feature intake & classification',
  'Step 3 — PM Agent drafting PRD',
  'Step 4 — Parallel debate in progress',
  'Step 5 — Release Manager resolving conflicts',
  'Step 6 — UI/UX Designer producing spec',
  'Step 7 — Engineer building',
  'Step 8 — QA validating',
  'Step 9 of 9 — Complete',
]

function initialAgentStates(): Record<AgentType, AgentRunState> {
  return AGENT_ORDER.reduce((acc, agent) => {
    acc[agent] = { status: 'idle', output: '' }
    return acc
  }, {} as Record<AgentType, AgentRunState>)
}

export default function RunViewPage() {
  const params = useSearchParams()
  const featureRequest = params.get('request') || 'Add OTP login to a fintech app'

  const [stepIndex, setStepIndex] = useState(0)
  const [agentStates, setAgentStates] = useState<Record<AgentType, AgentRunState>>(initialAgentStates())
  const [activeAgent, setActiveAgent] = useState<AgentType | null>(null)
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([])
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [packageReady, setPackageReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finalPackageData, setFinalPackageData] = useState<Record<string, unknown> | null>(null)
  const esRef = useRef<EventSource | null>(null)

  // Determine agent step index (1-based, matching STEP_LABELS)
  const agentToStep = useCallback((agent: AgentType): number => {
    const idx = AGENT_ORDER.indexOf(agent)
    return idx >= 0 ? idx + 1 : 0
  }, [])

  // Handle each SSE event
  const handleSSEEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'run_start':
        setStepIndex(event.step ?? 0)
        break

      case 'memory_load_start':
        setStepIndex(0)
        break

      case 'memory_load_done':
        // Memory loaded, move past step 0
        break

      case 'agent_start':
        setStepIndex(agentToStep(event.agent))
        setActiveAgent(event.agent)
        setAgentStates((prev) => ({
          ...prev,
          [event.agent]: { status: 'running', output: '' },
        }))
        break

      case 'agent_token':
        setStepIndex((prev) => Math.max(prev, agentToStep(event.agent)))
        setActiveAgent(event.agent)
        setAgentStates((prev) => ({
          ...prev,
          [event.agent]: {
            status: 'running',
            output: prev[event.agent].output + event.token,
          },
        }))
        break

      case 'agent_done':
        setAgentStates((prev) => ({
          ...prev,
          [event.agent]: { status: 'done', output: event.output },
        }))
        break

      // Legacy per-agent events (context_analyst, uiux_designer)
      case 'context_analyst_start':
        setStepIndex(agentToStep('context_analyst'))
        setActiveAgent('context_analyst')
        setAgentStates((prev) => ({
          ...prev,
          context_analyst: { status: 'running', output: '' },
        }))
        break

      case 'context_analyst_token':
        setStepIndex((prev) => Math.max(prev, agentToStep('context_analyst')))
        setActiveAgent('context_analyst')
        setAgentStates((prev) => ({
          ...prev,
          context_analyst: {
            status: 'running',
            output: prev.context_analyst.output + event.token,
          },
        }))
        break

      case 'context_analyst_done':
        setAgentStates((prev) => ({
          ...prev,
          context_analyst: {
            status: 'done',
            output: prev.context_analyst.output,
          },
        }))
        break

      case 'uiux_designer_start':
        setStepIndex(agentToStep('uiux_designer'))
        setActiveAgent('uiux_designer')
        setAgentStates((prev) => ({
          ...prev,
          uiux_designer: { status: 'running', output: '' },
        }))
        break

      case 'uiux_designer_token':
        setStepIndex((prev) => Math.max(prev, agentToStep('uiux_designer')))
        setActiveAgent('uiux_designer')
        setAgentStates((prev) => ({
          ...prev,
          uiux_designer: {
            status: 'running',
            output: prev.uiux_designer.output + event.token,
          },
        }))
        break

      case 'uiux_designer_done':
        setAgentStates((prev) => ({
          ...prev,
          uiux_designer: { status: 'done', output: event.output },
        }))
        break

      case 'conflict_start':
        // A new conflict is being streamed — prepare placeholder
        break

      case 'conflict_token':
        // Conflict content streaming (optional progressive display)
        break

      case 'conflict_done':
        setConflicts((prev) => {
          if (prev.some((c) => c.id === event.conflictId)) return prev
          return [
            ...prev,
            {
              id: event.conflictId,
              agentsInvolved: event.agentsInvolved || [],
              summary: event.summary || '',
              resolution: event.resolution,
              rationale: event.rationale,
            },
          ]
        })
        break

      case 'run_complete':
        setActiveAgent(null)
        setStepIndex(9)
        setVerdict(event.verdict)
        setPackageReady(true)
        setFinalPackageData(event.package)
        break

      case 'run_error':
        setError(event.message)
        setActiveAgent(null)
        break
    }
  }, [agentToStep])

  useEffect(() => {
    // Extract session ID from URL path
    const pathParts = location.pathname.split('/')
    const sessionId = pathParts[pathParts.indexOf('run') + 1]

    if (!sessionId) return

    let isCancelled = false
    let es: EventSource | null = null

    function connectSSE(sid: string) {
      if (isCancelled) return
      
      const sseUrl = `${API_BASE}/runs/${sid}/stream`
      es = new EventSource(sseUrl)
      esRef.current = es

      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as SSEEvent
          handleSSEEvent(event)
        } catch {
          // Ignore non-JSON messages (keepalive comments etc.)
        }
      }

      es.onerror = () => {
        if (es?.readyState === EventSource.CLOSED) {
          es.close()
        }
      }
    }

    // First, try to load existing session data (for page reloads of completed runs)
    getSession(sessionId).then((result) => {
      if (isCancelled) return

      if (!result.ok) {
        connectSSE(sessionId)
        return
      }

      const detail = result.data

      // Map completed agent outputs
      const agentMap: Partial<Record<AgentType, { output: string }>> = {}
      if (detail.intake) agentMap.context_analyst = { output: detail.intake.output }
      if (detail.prd) agentMap.pm = { output: detail.prd.output }
      if (detail.architect_response) agentMap.architect = { output: detail.architect_response.output }
      if (detail.uiux_response) agentMap.uiux_designer = { output: detail.uiux_response.output }
      if (detail.engineer_response) agentMap.engineer = { output: detail.engineer_response.output }
      if (detail.qa_response) agentMap.qa = { output: detail.qa_response.output }
      if (detail.final_package) agentMap.release_manager = { output: detail.final_package.output }

      // If we have completed agents, populate state
      const completedCount = Object.keys(agentMap).length
      if (completedCount > 0) {
        setAgentStates((prev) => {
          const next = { ...prev }
          for (const [agent, data] of Object.entries(agentMap)) {
            next[agent as AgentType] = { status: 'done', output: data.output }
          }
          return next
        })
        setStepIndex(Math.min(completedCount, 9))
      }

      // If conflicts exist
      if (detail.conflicts && detail.conflicts.length > 0) {
        setConflicts(
          detail.conflicts.map((c) => ({
            id: c.conflict_id,
            agentsInvolved: c.agents_involved,
            summary: c.summary,
            resolution: c.resolution,
            rationale: c.rationale,
          }))
        )
      }

      // If session is already complete, skip SSE
      if (detail.final_package && completedCount === 7) {
        setStepIndex(9)
        setActiveAgent(null)
        setPackageReady(true)
        // Determine verdict from QA output or default
        const qaOutput = detail.qa_response?.output || ''
        if (qaOutput.includes('SHIPPABLE')) {
          setVerdict('SHIPPABLE')
        } else if (qaOutput.includes('NEEDS_REVISION')) {
          setVerdict('NEEDS_REVISION')
        } else {
          setVerdict('SHIPPABLE')
        }
        return // Don't connect SSE for completed sessions
      }

      // Connect SSE for live streaming if not complete
      connectSSE(sessionId)
    })

    return () => {
      isCancelled = true
      if (es) {
        es.close()
      }
      esRef.current = null
    }
  }, [handleSSEEvent])

  const isRunning = stepIndex < 9

  return (
    <div className="relative h-screen flex flex-col bg-black overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute top-0 left-0 w-[400px] h-[250px]"
          style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute top-0 right-0 w-[400px] h-[250px]"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.05) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <RunHeader
          featureRequest={featureRequest}
          currentStepLabel={STEP_LABELS[Math.min(stepIndex, STEP_LABELS.length - 1)]}
          isRunning={isRunning}
          verdict={verdict}
        />

        {error && (
          <div className="mx-6 mt-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-[13px] text-red-400">
            ⚠ {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <AgentPanelGrid agentStates={agentStates} activeAgent={activeAgent} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[360px]">
            <ConflictLogPanel conflicts={conflicts} />
            <FinalPackagePanel
              verdict={verdict || 'RUNNING'}
              ready={packageReady}
              engineerOutput={agentStates.engineer?.output || null}
              qaOutput={agentStates.qa?.output || null}
              packageData={finalPackageData}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
