export type RunStatus = 'queued' | 'running' | 'awaiting_approval' | 'pr_opened' | 'failed' | 'cancelled'

const LOOK: Record<RunStatus, { label: string; tone?: string }> = {
  queued: { label: 'Queued' },
  running: { label: 'Running', tone: 'running' },
  awaiting_approval: { label: 'Awaiting approval', tone: 'approval' },
  pr_opened: { label: 'PR opened', tone: 'done' },
  failed: { label: 'Failed', tone: 'failed' },
  cancelled: { label: 'Cancelled' },
}

/** Status reads from shape and label first, colour second. `label` overrides the default, e.g. the live step. */
export function StatusPill({ status, label }: { status: RunStatus; label?: string }) {
  const look = LOOK[status]
  return <span className={`px-pill${look.tone ? ` px-pill--${look.tone}` : ''}`}>{label ?? look.label}</span>
}
