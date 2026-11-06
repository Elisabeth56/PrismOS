import type { RailStep } from '@/lib/run-view'

const check = (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden fill="none" stroke="var(--success)" strokeWidth="2">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

export function StepRail({ steps }: { steps: RailStep[] }) {
  return (
    <ol aria-label="Run steps" className="flex flex-wrap gap-2">
      {steps.map((step) => (
        <li
          key={step.key}
          aria-current={step.state === 'active' ? 'step' : undefined}
          className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] ${
            step.state === 'done'
              ? 'bg-surface-1 text-ink-2'
              : step.state === 'active'
                ? 'bg-oxblood-wash font-medium text-oxblood-text'
                : 'border border-hairline text-ink-3'
          }`}
        >
          {step.state === 'done' && check}
          {step.label}
          {step.state === 'skipped' && <span className="sr-only"> (skipped, no conflicts)</span>}
          {step.state === 'skipped' && <span aria-hidden> · skipped</span>}
        </li>
      ))}
    </ol>
  )
}
