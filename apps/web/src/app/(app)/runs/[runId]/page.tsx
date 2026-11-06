'use client'

import { use, useEffect } from 'react'

import { ErrorPanel, Skeleton } from '@/components/app/page-states'
import { RunBody } from '@/components/run/run-body'
import { api } from '@/lib/api'
import { lastSeq } from '@/lib/run-events'
import { useApi } from '@/lib/use-api'
import { useRunEvents } from '@/lib/use-run-events'

export default function RunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params)
  const run = useApi(() => api.run(runId), `run-${runId}`)
  const { events } = useRunEvents(runId)
  const seq = lastSeq(events)
  const { reload } = run

  // every new event means a step finished or the run changed state: read the run again
  useEffect(() => {
    if (seq > 0) void reload()
  }, [seq, reload])

  if (run.error) {
    return (
      <div className="p-8">
        <ErrorPanel error={run.error} onRetry={run.reload} />
      </div>
    )
  }
  if (!run.data) return <RunSkeleton />
  return <RunBody run={run.data} onChange={run.setData} />
}

/** Matches the run layout, so nothing jumps when it loads. On the free tier the first load can wake the server. */
function RunSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-4 pt-8 sm:px-8" aria-busy>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-40 bg-surface-2" />
      </div>
      <Skeleton className="h-8 w-[70%]" />
      <div className="flex flex-wrap gap-2">
        {[96, 72, 80, 72].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-full bg-surface-2" style={{ width: w }} />
        ))}
      </div>
      <div className="flex flex-col gap-2 rounded-[16px] bg-surface-2 p-4">
        {[40, 92, 84, 88].map((w) => (
          <Skeleton key={w} className="h-3.5" style={{ width: `${w}%` }} />
        ))}
      </div>
      <p className="text-[12px] leading-[18px] text-ink-2">Loading the run. If the server was asleep, this can take up to a minute.</p>
    </div>
  )
}
