import type { ActivityItem } from './api'

/** Each event in words a person would use. */
export function describe(item: ActivityItem): string {
  const step = String(item.payload.step ?? '')
    .replace(/^critic_(\w+)/, '$1 critic')
    .replace(/_/g, ' ')
  switch (item.type) {
    case 'step_started':
      return `Started ${step}`
    case 'step_done':
      return `Finished ${step}`
    case 'files_selected':
      return `Chose ${(item.payload.paths as string[] | undefined)?.length ?? 0} files to read`
    case 'review_done':
      return `Review finished: ${item.payload.conflicts ?? 0} conflicts, ${item.payload.notes ?? 0} notes`
    case 'awaiting_approval':
      return item.payload.verdict === 'verified' ? 'Ready for approval, verified' : 'Ready for approval, with concerns'
    case 'pr_opened':
      return `Opened PR #${item.payload.number}`
    case 'run_failed':
      return `Failed${item.payload.step ? ` at ${String(item.payload.step).replace(/_/g, ' ')}` : ''}: ${item.payload.message ?? ''}`
    case 'run_retried':
      return 'Retried'
    default:
      return item.type.replace(/_/g, ' ')
  }
}
