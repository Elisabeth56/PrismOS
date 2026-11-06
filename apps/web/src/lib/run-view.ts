// Turns a run read (plus the live step) into what the run page shows. Pure, so it's tested on its own.
import type { Critic, Objection, RunDetail } from './api'

export const CRITICS: Critic[] = ['architect', 'security', 'ux']

export type StepState = 'done' | 'active' | 'todo' | 'skipped'
export interface RailStep {
  key: string
  label: string
  state: StepState
}

interface SpecItem {
  id: string
  text: string
}
interface CriticReview {
  critic: Critic
  objections: Omit<Objection, 'critic'>[]
}
interface Verdict {
  verdict: 'verified' | 'needs_revision'
  items_checked: string[]
  failures: { item_id: string; problem: string }[]
}

const LIVE_LABEL: Record<string, string> = {
  read_repo: 'Reading the repo',
  select_files: 'Choosing files',
  read_files: 'Reading files',
  plan: 'Planning',
  critic_architect: 'Reviewing spec',
  critic_security: 'Reviewing spec',
  critic_ux: 'Reviewing spec',
  resolve: 'Resolving conflicts',
  build: 'Building',
  verify: 'Verifying',
}

export function runView(run: RunDetail) {
  const steps = run.steps as Record<string, unknown>
  const has = (key: string) => key in steps
  const current = run.current_step ?? ''
  const spec = (steps.plan as { summary: string; items: SpecItem[] } | undefined) ?? null
  const files = (steps.read_files as { files: Record<string, string>; omitted?: string[] } | undefined) ?? null
  const verdict = (steps.verify as Verdict | undefined) ?? null
  const build = (steps.build as { summary: string } | undefined) ?? null
  const running = run.status === 'running' || run.status === 'queued'

  const reviews = Object.fromEntries(
    CRITICS.map((c) => [c, (steps[`critic_${c}`] as CriticReview | undefined) ?? null]),
  ) as Record<Critic, CriticReview | null>
  const objections: Objection[] = CRITICS.flatMap((c) => (reviews[c]?.objections ?? []).map((o) => ({ ...o, critic: c })))
  const contested = new Set(run.conflicts.map((c) => c.item_id))
  const reviewed = CRITICS.every((c) => reviews[c])

  const stateOf = (done: boolean, active: boolean, skipped = false): StepState =>
    done ? 'done' : skipped ? 'skipped' : active && running ? 'active' : 'todo'
  const rail: RailStep[] = [
    { key: 'read', label: files ? `Read ${Object.keys(files.files).length} files` : 'Read files', state: stateOf(!!files, ['read_repo', 'select_files', 'read_files'].includes(current) || (!current && running)) },
    { key: 'plan', label: 'Plan', state: stateOf(has('plan'), current === 'plan') },
    { key: 'review', label: 'Review', state: stateOf(reviewed, current.startsWith('critic_')) },
    // no conflicts means the resolver never runs
    { key: 'resolve', label: 'Resolve', state: stateOf(has('resolve'), current === 'resolve', reviewed && run.conflicts.length === 0 && (has('build') || current === 'build')) },
    { key: 'build', label: 'Build', state: stateOf(has('build') && current !== 'build', current === 'build') },
    { key: 'verify', label: 'Verify', state: stateOf(!!verdict && current !== 'verify', current === 'verify') },
  ]

  return {
    spec,
    files,
    verdict,
    build,
    running,
    rail,
    reviews,
    /** Objection markers per spec item, one dot per critic. */
    markers: (itemId: string) => [...new Set(objections.filter((o) => o.item_id === itemId).map((o) => o.critic))],
    /** Objections the builder applied without a ruling. */
    notes: objections.filter((o) => !contested.has(o.item_id)),
    liveLabel: run.status === 'queued' ? 'Queued' : LIVE_LABEL[current] ?? 'Running',
  }
}

export function criticState(review: CriticReview | null, active: boolean): { state: string; count?: number } {
  if (!review) return { state: active ? 'Reading the spec' : 'Waiting for the spec' }
  const items = [...new Set(review.objections.map((o) => o.item_id))]
  if (items.length === 0) return { state: 'No objections', count: 0 }
  const blocking = review.objections.some((o) => o.severity === 'blocking')
  const list = items.length === 1 ? `item ${items[0]}` : `items ${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
  return { state: `${blocking ? 'Blocks' : 'Objects to'} ${list}`, count: review.objections.length }
}
