'use client'

import { useEffect, useState } from 'react'

import { FilesRead } from '@/components/run/files-read'
import { ReviewPanel } from '@/components/run/review-panel'
import { Changes, Decisions, VerdictBlock } from '@/components/run/review-summary'
import { SpecPanel } from '@/components/run/spec-panel'
import { StepRail } from '@/components/run/step-rail'
import { Button, StatusPill } from '@/components/ui'
import { api, ApiError, type RunDetail } from '@/lib/api'
import { shortId } from '@/lib/format'
import { resumePoint, runView } from '@/lib/run-view'

type Tab = 'spec' | 'review' | 'files' | 'decisions' | 'changes'

/** One run: live progress while it works, then the review and the Open PR button. */
export function RunBody({ run, onChange }: { run: RunDetail; onChange: (run: RunDetail) => void }) {
  const view = runView(run)
  const reviewing = run.status === 'awaiting_approval' || run.status === 'pr_opened'
  const [picked, setTab] = useState<Tab | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const contested = new Set(run.conflicts.map((c) => c.item_id))
  const title = run.feature_request.split('\n')[0]

  async function act(action: () => Promise<RunDetail | void>) {
    setBusy(true)
    setError('')
    try {
      const next = await action()
      if (next) onChange(next)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }
  const approve = () => act(() => api.approve(run.id))
  const cancel = () => act(async () => onChange({ ...run, ...(await api.cancel(run.id)) }))

  // A approves, once the person has seen the confirm step
  useEffect(() => {
    if (run.status !== 'awaiting_approval') return
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && event.target.closest('input, textarea, select')
      if (typing || event.metaKey || event.ctrlKey || event.key.toLowerCase() !== 'a') return
      if (confirming) void approve()
      else setConfirming(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const tabs: [Tab, string][] = reviewing
    ? [
        ['decisions', 'Decisions'],
        ['changes', 'Changes'],
      ]
    : [
        ['spec', 'Spec'],
        ['review', 'Review'],
        ['files', 'Files'],
      ]
  // the run can move from live to review while the page is open; fall back to that view's first tab
  const tab = tabs.some(([key]) => key === picked) ? picked : tabs[0][0]
  const shown = (key: Tab) => (tab === key ? 'flex' : 'hidden lg:flex')

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-12 sm:px-8 sm:pt-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status={run.status} label={view.running ? view.liveLabel : undefined} />
            <span className="font-mono text-[12px] text-ink-3">
              {shortId(run.id)} · {run.base_branch}
              {reviewing && ` · from prismos/run-${run.id.slice(0, 8)}`}
            </span>
          </div>
          <h1 className="text-title-1 font-semibold text-balance">{title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {view.running && (
            <Button variant="ghost" onClick={cancel} disabled={busy}>
              Cancel run
            </Button>
          )}
          {run.status === 'awaiting_approval' &&
            (confirming ? (
              <>
                <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
                  Not yet
                </Button>
                <Button variant="primary" onClick={approve} disabled={busy} shortcut="A">
                  {busy ? 'Opening…' : 'Open it on GitHub'}
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={() => setConfirming(true)} shortcut="A">
                Open PR
              </Button>
            ))}
          {run.pr_url && (
            <a href={run.pr_url} className="px-btn px-btn--primary">
              View PR #{run.pr_number}
            </a>
          )}
        </div>
      </header>

      {confirming && (
        <p className="rounded-[12px] bg-surface-1 px-4 py-3 text-ink-2" role="status">
          This creates <span className="font-mono text-[13px]">prismos/run-{run.id.slice(0, 8)}</span>, commits{' '}
          {run.changes.length} file{run.changes.length === 1 ? '' : 's'} and opens a pull request into{' '}
          <span className="font-mono text-[13px]">{run.base_branch}</span>. Your repo&apos;s CI runs on it.
        </p>
      )}
      {error && (
        <p role="alert" className="text-oxblood-text">
          {error}
        </p>
      )}
      {(run.status === 'failed' || run.status === 'cancelled') && (
        <StoppedPanel run={run} busy={busy} onRetry={() => act(async () => onChange({ ...run, ...(await api.retry(run.id)) }))} />
      )}

      {!reviewing && <StepRail steps={view.rail} />}

      <div role="tablist" aria-label="Run sections" className="inline-flex gap-1 self-start rounded-full bg-surface-1 p-1 lg:hidden">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`h-8 rounded-full px-3.5 text-[12px] font-medium ${tab === key ? 'bg-surface-3 text-ink' : 'text-ink-2'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {reviewing ? (
        <div className="flex flex-wrap items-start gap-6">
          <div className={`${shown('decisions')} min-w-0 flex-[1_1_360px] flex-col gap-4`}>
            <VerdictBlock verdict={view.verdict} />
            <Decisions
              conflicts={run.conflicts}
              notes={view.notes}
              itemText={(id) => view.spec?.items.find((item) => item.id === id)?.text}
            />
          </div>
          <div className={`${shown('changes')} min-w-0 flex-[2_1_520px] flex-col`}>
            <Changes changes={run.changes} before={view.files?.files ?? {}} />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-6">
          <div className={`${shown('spec')} min-w-0 flex-[3_1_400px] flex-col`}>
            <SpecPanel items={view.spec?.items ?? null} markers={view.markers} contested={contested} />
          </div>
          <div className={`${shown('review')} min-w-0 flex-[2_1_320px] flex-col`}>
            <ReviewPanel view={view} live={view.running} conflicts={run.conflicts.length} />
          </div>
          <div className={`${shown('files')} min-w-0 flex-[1_1_240px] flex-col gap-3`}>
            <FilesRead files={view.files ? Object.keys(view.files.files) : null} omitted={view.files?.omitted ?? []} />
            <div className="flex flex-col gap-1 border-t border-hairline pt-3 text-[12px] leading-[18px] text-ink-3">
              <span className="font-mono">
                {run.tokens_in.toLocaleString()} tokens in · {run.tokens_out.toLocaleString()} out
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StoppedPanel({ run, busy, onRetry }: { run: RunDetail; busy: boolean; onRetry: () => void }) {
  const { kept, from } = resumePoint(run)
  const failed = run.status === 'failed'
  const step = run.error?.step?.replace(/^critic_.*/, 'review').replace(/_/g, ' ')
  return (
    <section role={failed ? 'alert' : undefined} className="flex flex-col gap-4 rounded-[24px] bg-surface-1 p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-title-2 font-semibold">{failed ? `The ${step ?? 'run'} step stopped` : 'You cancelled this run'}</h2>
        {failed && <p className="text-ink-2">{run.error?.message}</p>}
      </div>
      <div className="flex flex-col gap-1.5 rounded-[12px] bg-surface-2 p-4">
        <span className="text-[12px] leading-4 font-medium tracking-[0.02em] text-ink-3">Kept from this run</span>
        <span className="text-ink-2">
          {kept.length ? `${kept.join(', ').replace(/^./, (c) => c.toUpperCase())}. ` : 'Nothing finished yet. '}
          Retrying starts at {from}.
        </span>
      </div>
      <div>
        <Button variant="primary" onClick={onRetry} disabled={busy}>
          {busy ? 'Queuing…' : from === 'the start' ? 'Retry' : `Retry from ${from.toLowerCase()}`}
        </Button>
      </div>
    </section>
  )
}
