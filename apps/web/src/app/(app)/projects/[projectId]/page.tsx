'use client'

import Link from 'next/link'
import { use } from 'react'

import { ErrorPanel, Skeleton } from '@/components/app/page-states'
import { ButtonLink, StatusPill } from '@/components/ui'
import { api, type RunSummary } from '@/lib/api'
import { ago, shortId } from '@/lib/format'
import { useStored } from '@/lib/stored'
import { useApi } from '@/lib/use-api'

const FILTERS = {
  all: { label: 'All', match: () => true },
  needs_you: { label: 'Needs you', match: (r: RunSummary) => r.status === 'awaiting_approval' },
  opened: { label: 'PRs opened', match: (r: RunSummary) => r.status === 'pr_opened' },
  failed: { label: 'Failed', match: (r: RunSummary) => r.status === 'failed' },
} as const
type Filter = keyof typeof FILTERS

function statusLabel(run: RunSummary) {
  if (run.status === 'failed' && run.error?.step) return `Failed at ${run.error.step.replace(/_/g, ' ')}`
  if (run.status === 'pr_opened' && run.pr_number) return `PR #${run.pr_number} opened`
  return undefined
}

export default function RunHistory({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const project = useApi(() => api.project(projectId), `project-${projectId}`)
  const runs = useApi(() => api.runs(projectId), `runs-${projectId}`)
  const [filter, setFilter] = useStored<Filter>('prismos:run-filter', 'all')

  const all = runs.data ?? []
  const shown = all.filter(FILTERS[filter]?.match ?? FILTERS.all.match)
  const waiting = all.filter(FILTERS.needs_you.match).length

  if (project.error) return <div className="p-8"><ErrorPanel error={project.error} onRetry={project.reload} /></div>

  return (
    <div className="flex flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          {project.data ? (
            <span className="font-mono text-[12px] text-ink-3">{project.data.repo_full_name}</span>
          ) : (
            <Skeleton className="h-4 w-40" />
          )}
          <h1 className="text-title-1 font-semibold">Runs</h1>
        </div>
        <ButtonLink href="/runs/new" variant="primary" shortcut="⌘K">
          Start a run
        </ButtonLink>
      </header>

      <div role="tablist" aria-label="Filter runs" className="inline-flex flex-wrap gap-1 self-start rounded-full bg-surface-1 p-1">
        {(Object.keys(FILTERS) as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={`h-8 rounded-full px-3.5 text-[12px] leading-4 font-medium ${filter === key ? 'bg-surface-3 text-ink' : 'text-ink-2 hover:text-ink'}`}
          >
            {FILTERS[key].label}
            {key === 'needs_you' && waiting > 0 && ` · ${waiting}`}
          </button>
        ))}
      </div>

      {runs.error && <ErrorPanel error={runs.error} onRetry={runs.reload} />}
      {runs.loading && (
        <div className="flex flex-col gap-2 rounded-[16px] bg-surface-1 p-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      )}
      {runs.data && all.length === 0 && (
        <div className="flex flex-col gap-3 rounded-[16px] bg-surface-1 p-8">
          <h2 className="text-title-3 font-medium">No runs yet</h2>
          <p className="text-ink-2">Describe a feature for this repo and watch the critics review the plan.</p>
          <div>
            <ButtonLink href="/runs/new" variant="primary">
              Start the first run
            </ButtonLink>
          </div>
        </div>
      )}
      {runs.data && all.length > 0 && (
        <div className="overflow-x-auto rounded-[16px] bg-surface-1">
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="sticky top-0">
              <tr className="text-left text-[12px] leading-4 font-medium tracking-[0.02em] text-ink-3">
                <th scope="col" className="px-5 py-3.5 font-medium">Run</th>
                <th scope="col" className="px-3 py-3.5 font-medium">Status</th>
                <th scope="col" className="px-3 py-3.5 font-medium">Conflicts</th>
                <th scope="col" className="px-3 py-3.5 font-medium">Verdict</th>
                <th scope="col" className="px-3 py-3.5 font-medium">Pull request</th>
                <th scope="col" className="px-5 py-3.5 text-right font-medium">Started</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((run) => (
                <tr key={run.id} className="border-t border-hairline hover:bg-surface-2">
                  <td className="max-w-[360px] px-5 py-3.5">
                    <Link href={`/runs/${run.id}`} className="line-clamp-1 text-ink">
                      {run.feature_request}
                    </Link>
                    <div className="font-mono text-[12px] text-ink-3">{shortId(run.id)}</div>
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusPill status={run.status} label={statusLabel(run)} />
                  </td>
                  <td className="px-3 py-3.5 font-mono text-ink-2">{run.conflict_count}</td>
                  <td className={`px-3 py-3.5 ${run.verdict === 'verified' ? 'text-success' : run.verdict ? 'text-oxblood-text' : 'text-ink-3'}`}>
                    {run.verdict === 'verified' ? 'Verified' : run.verdict ? 'Needs revision' : 'None yet'}
                  </td>
                  <td className="px-3 py-3.5">
                    {run.pr_url ? (
                      <a href={run.pr_url} className="font-mono text-[13px] text-oxblood-text hover:text-ink">
                        #{run.pr_number}
                      </a>
                    ) : (
                      <span className="text-ink-3">Not opened</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-[12px] text-ink-3">
                    <time dateTime={run.created_at} title={new Date(run.created_at).toLocaleString()}>
                      {ago(run.created_at)}
                    </time>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr className="border-t border-hairline">
                  <td colSpan={6} className="px-5 py-6 text-center text-ink-3">
                    Nothing here with this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
