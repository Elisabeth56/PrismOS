'use client'

import Link from 'next/link'

import { ErrorPanel, Skeleton } from '@/components/app/page-states'
import { useProject } from '@/components/app/project-context'
import { ButtonLink } from '@/components/ui'
import { describe } from '@/lib/activity'
import { api } from '@/lib/api'
import { ago, shortId } from '@/lib/format'
import { useApi } from '@/lib/use-api'

export default function Activity() {
  const { project } = useProject()
  const activity = useApi(() => api.activity(project.id), `activity-${project.id}`)

  return (
    <div className="flex flex-col gap-4 px-4 py-8 sm:px-8">
      {activity.error && <ErrorPanel error={activity.error} onRetry={activity.reload} />}
      {activity.loading && (
        <div className="flex flex-col gap-2 rounded-[16px] bg-surface-1 p-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      )}
      {activity.data?.length === 0 && (
        <div className="flex flex-col gap-3 rounded-[16px] bg-surface-1 p-8">
          <h2 className="text-title-3 font-medium">Nothing has happened yet</h2>
          <p className="text-ink-2">Every step of every run in this project shows up here, newest first.</p>
          <div>
            <ButtonLink href={`/projects/${project.id}/runs/new`} variant="primary">
              Start a run
            </ButtonLink>
          </div>
        </div>
      )}
      {activity.data && activity.data.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-ink-3">Latest {activity.data.length} events across all runs</span>
          <button type="button" className="px-btn px-btn--sm" onClick={activity.reload}>
            Refresh
          </button>
        </div>
      )}
      {activity.data && activity.data.length > 0 && (
        <ol className="flex flex-col overflow-hidden rounded-[16px] bg-surface-1">
          {activity.data.map((item) => (
            <li
              key={`${item.run_id}-${item.seq}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-t border-hairline px-5 py-3 first:border-t-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]"
            >
              <span className={item.type === 'run_failed' ? 'text-oxblood-text' : 'text-ink'}>{describe(item)}</span>
              <Link
                href={`/runs/${item.run_id}`}
                className="order-3 col-span-2 truncate text-[12px] text-ink-3 hover:text-ink sm:order-none sm:col-span-1 sm:text-[14px]"
              >
                <span className="font-mono text-[12px]">{shortId(item.run_id)}</span> {item.run_title}
              </Link>
              <time dateTime={item.created_at} className="text-right font-mono text-[12px] text-ink-3">
                {ago(item.created_at)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
