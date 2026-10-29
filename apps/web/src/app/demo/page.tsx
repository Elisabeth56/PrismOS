'use client'
// NEW FILE: src/app/demo/page.tsx

import { useEffect, useState, useRef } from 'react'
import RunHeader from '@/components/run/RunHeader'
import AgentPanelGrid, { AgentRunState } from '@/components/run/AgentPanelGrid'
import ConflictLogPanel, { ConflictRecord } from '@/components/run/ConflictLogPanel'
import FinalPackagePanel from '@/components/run/FinalPackagePanel'
import { AgentType, Verdict } from '@/lib/types'
import { AGENT_ORDER } from '@/lib/constants'

const DEMO_FEATURE_REQUEST = 'Add OTP login to a fintech app'

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

const MOCK_OUTPUTS: Record<AgentType, string> = {
  context_analyst: `## Existing Product Analysis

Product Type: Fintech SaaS
Frontend: Next.js 14 + TS
Backend: FastAPI + Redis
Routes: /auth/login,
/transactions, /kyc/submit

Constraint: Redis already
used for session cache —
OTP key namespace must
not collide.`,
  pm: `## PRD

Feature: OTP Login
CLASSIFICATION: enhancement

### User stories
Given a user on login
When they enter email
Then system sends 6-digit
OTP, 10min expiry

### MVP
- Email OTP only
- 3 attempt limit`,
  architect: `## Design

Stack: FastAPI + Redis
(reuse existing instance)

### Endpoints
POST /auth/otp/send
POST /auth/otp/verify

DISAGREES: JWT over
session tokens for
stateless scaling.`,
  uiux_designer: `## UI/UX Design

### Screen Hierarchy
[New] OTP verification
screen

### Components
Reuse: <AuthCard>
New: <OTPInput> — single
6-digit field

### UX Decisions
Single field over 6 boxes:
paste support, mobile-
friendly`,
  engineer: `## Implementation

PUSHBACK: Session tokens
simpler for MVP. No
stateless requirement yet.

\`\`\`python
@router.post("/otp/send")
async def send_otp(
  email: str
):
  code = generate_otp()
  await redis.setex(
    f"otp:{email}",
    600, code
  )
\`\`\``,
  qa: `## QA Report

Test: OTP expiry ✓
Test: Rate limit ✓
Test: Invalid code ✓
Test: Replay attack ✓
Frontend: responsive ✓
Frontend: a11y ✓

## VERDICT
SHIPPABLE ✓`,
  release_manager: `## Conflict Log

2 conflicts resolved

Decision 1: Sessions
over JWT for MVP —
no stateless need yet

Decision 2: Enforce
explicit TTL check at
verify endpoint

All conflicts logged.`,
}

const MOCK_CONFLICTS: ConflictRecord[] = [
  {
    id: 'c1',
    agentsInvolved: ['Architect', 'Engineer'],
    summary: 'JWT (Architect) vs session tokens (Engineer) for OTP verification flow.',
    resolution: 'Session tokens chosen for MVP. No stateless requirement exists yet; JWT adds complexity with no user research to justify it.',
    rationale: 'Primary tradeoff: simplicity over scalability at MVP stage.',
  },
  {
    id: 'c2',
    agentsInvolved: ['QA', 'Engineer'],
    summary: 'SECURITY FLAG: OTP expiry window not enforced at verification endpoint.',
    resolution: 'Engineer adds explicit TTL check + attempt counter reset on expiry.',
    rationale: 'Primary tradeoff: correctness over speed. Security flags are non-negotiable.',
  },
]

function initialAgentStates(): Record<AgentType, AgentRunState> {
  return AGENT_ORDER.reduce((acc, agent) => {
    acc[agent] = { status: 'idle', output: '' }
    return acc
  }, {} as Record<AgentType, AgentRunState>)
}

export default function DemoPage() {
  const [stepIndex, setStepIndex] = useState(0)
  const [agentStates, setAgentStates] = useState<Record<AgentType, AgentRunState>>(initialAgentStates())
  const [activeAgent, setActiveAgent] = useState<AgentType | null>(null)
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([])
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [packageReady, setPackageReady] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
  const timers = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStepIndex(0)
     
    setAgentStates(initialAgentStates())
     
    setActiveAgent(null)
     
    setConflicts([])
     
    setVerdict(null)
     
    setPackageReady(false)

    const schedule = (fn: () => void, delay: number) => {
      timers.current.push(setTimeout(fn, delay))
    }

    // Auto-starts immediately — no button press required, judges land and it plays
    let t = 600
    AGENT_ORDER.forEach((agent, i) => {
      schedule(() => {
        setStepIndex(i + 1)
        setActiveAgent(agent)
        setAgentStates((prev) => ({ ...prev, [agent]: { status: 'running', output: '' } }))

        const fullText = MOCK_OUTPUTS[agent]
        const chars = fullText.split('')
        let acc = ''
        chars.forEach((ch, ci) => {
          schedule(() => {
            acc += ch
            setAgentStates((prev) => ({ ...prev, [agent]: { status: 'running', output: acc } }))
          }, t + ci * 6)
        })

        schedule(() => {
          setAgentStates((prev) => ({ ...prev, [agent]: { status: 'done', output: fullText } }))
        }, t + chars.length * 6 + 100)
      }, t)
      t += 1500
    })

    schedule(() => setConflicts([MOCK_CONFLICTS[0]]), t - 1200)
    schedule(() => setConflicts(MOCK_CONFLICTS), t - 600)

    schedule(() => {
      setActiveAgent(null)
      setStepIndex(9)
      setVerdict('SHIPPABLE')
      setPackageReady(true)
    }, t + 600)

    return () => timers.current.forEach(clearTimeout)
  }, [replayKey])

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
        {/* Demo banner — makes it explicit this is a live demo, not a real account */}
        <div className="flex items-center justify-center gap-2 bg-amber-500/[0.08] border-b border-amber-500/20 px-4 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }} />
          <span className="text-[11px] font-medium text-amber-300">
            You&apos;re watching a live demo run — no signup required.
          </span>
          {!isRunning && (
            <button
              onClick={() => setReplayKey((k) => k + 1)}
              className="ml-3 text-[11px] font-semibold text-amber-300 underline underline-offset-2 hover:text-amber-200 transition-colors"
            >
              Replay
            </button>
          )}
        </div>

        <RunHeader
          featureRequest={DEMO_FEATURE_REQUEST}
          currentStepLabel={STEP_LABELS[Math.min(stepIndex, STEP_LABELS.length - 1)]}
          isRunning={isRunning}
          verdict={verdict}
        />

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <AgentPanelGrid agentStates={agentStates} activeAgent={activeAgent} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[360px]">
            <ConflictLogPanel conflicts={conflicts} />
            <FinalPackagePanel verdict={verdict || 'RUNNING'} ready={packageReady} />
          </div>
        </div>
      </div>
    </div>
  )
}
