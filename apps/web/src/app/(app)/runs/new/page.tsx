'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { ErrorPanel, Skeleton } from '@/components/app/page-states'
import { Button } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { useStored } from '@/lib/stored'
import { useApi } from '@/lib/use-api'

const MAX_FILES = 5
const MAX_FILE_BYTES = 100 * 1024
const label = 'text-[12px] leading-4 font-medium tracking-[0.02em] text-ink-2'
const field = 'h-10 rounded-[12px] border border-hairline-strong bg-surface-2 px-3 font-mono text-[13px] text-ink'

export default function NewRun() {
  const router = useRouter()
  const projects = useApi(api.projects, 'projects')
  // the last project, an unsent draft and its branch survive a reload
  const [projectId, setProjectId] = useStored('prismos:last-project', '')
  const [draft, setDraft] = useStored('prismos:draft', '')
  const [branch, setBranch] = useState('')
  const [files, setFiles] = useState<{ name: string; content: string }[]>([])
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const picker = useRef<HTMLInputElement>(null)

  const list = projects.data ?? []
  const project = list.find((p) => p.id === projectId) ?? list[0]
  const tooShort = draft.trim().length < 10

  async function addFiles(chosen: FileList | null) {
    if (!chosen) return
    const next = [...files]
    for (const file of Array.from(chosen)) {
      if (next.length >= MAX_FILES) {
        setError(`Up to ${MAX_FILES} extra files per run.`)
        break
      }
      if (file.size > MAX_FILE_BYTES) {
        setError(`${file.name} is over 100 KB. Attach a smaller excerpt.`)
        continue
      }
      next.push({ name: file.name, content: await file.text() })
    }
    setFiles(next)
  }

  async function submit(event?: React.FormEvent) {
    event?.preventDefault()
    if (!project || tooShort || pending) return
    setPending(true)
    setError('')
    try {
      const run = await api.startRun({
        project_id: project.id,
        feature_request: draft.trim(),
        base_branch: branch.trim() || undefined,
        context_files: files,
      })
      setDraft('')
      router.push(`/runs/${run.id}`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.')
      setPending(false)
    }
  }

  if (projects.error) return <Page><ErrorPanel error={projects.error} onRetry={projects.reload} /></Page>
  if (!projects.loading && list.length === 0) {
    return (
      <Page>
        <div className="flex flex-col gap-3 rounded-[24px] bg-surface-1 p-8">
          <h2 className="text-title-2 font-semibold">Connect a repo first</h2>
          <p className="text-ink-2">Runs work on a GitHub repository you&apos;ve installed the PrismOS app on.</p>
          <div>
            <Link href="/projects/connect" className="px-btn px-btn--primary">
              Add a repo
            </Link>
          </div>
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <form
        className="flex flex-col gap-6"
        onSubmit={submit}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit()
        }}
      >
        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-0 flex-[2_1_260px] flex-col gap-1.5">
            <label htmlFor="repo" className={label}>
              Repository
            </label>
            {projects.loading ? (
              <Skeleton className="h-10" />
            ) : (
              <select id="repo" className={field} value={project?.id} onChange={(e) => setProjectId(e.target.value)}>
                {list.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.repo_full_name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex min-w-0 flex-[1_1_160px] flex-col gap-1.5">
            <label htmlFor="branch" className={label}>
              Base branch
            </label>
            <input
              id="branch"
              className={field}
              value={branch}
              placeholder={project?.default_branch ?? 'main'}
              onChange={(e) => setBranch(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="request" className={label}>
            Feature request
          </label>
          <textarea
            id="request"
            rows={6}
            autoFocus
            value={draft}
            maxLength={4000}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add rate limiting to the login endpoint. Five attempts per minute, then 429 with Retry-After."
            className="resize-y rounded-[12px] border border-hairline-strong bg-surface-2 px-4 py-3.5 text-[16px] leading-6 text-ink placeholder:text-ink-3"
          />
          <span className="text-[12px] leading-[18px] text-ink-3">
            One feature per run. Paste an issue or acceptance criteria if you have them. Your draft is kept if you leave.
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className={label}>Extra context</span>
          <div className="flex flex-wrap items-center gap-2">
            {files.map((file) => (
              <span key={file.name} className="inline-flex h-8 items-center gap-2 rounded-[8px] bg-surface-3 px-2.5 font-mono text-[12px] text-ink-2">
                {file.name}
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  className="text-ink-3 hover:text-ink"
                  onClick={() => setFiles(files.filter((f) => f !== file))}
                >
                  ✕
                </button>
              </span>
            ))}
            <Button variant="ghost" size="sm" onClick={() => picker.current?.click()} disabled={files.length >= MAX_FILES}>
              Attach files
            </Button>
            <input ref={picker} type="file" multiple hidden accept=".md,.txt,.json,.yaml,.yml,.csv,text/*" onChange={(e) => addFiles(e.target.files)} />
          </div>
          <span className="text-[12px] leading-[18px] text-ink-3">
            PrismOS picks up to 15 relevant files from the repo itself. Add files only for context that isn&apos;t in the
            code.
          </span>
        </div>

        {error && (
          <p role="alert" className="text-oxblood-text">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-4">
          <span className="max-w-[380px] text-[12px] leading-[18px] text-ink-3">
            Runs on Gemini&apos;s free tier, which may use inputs to improve Google&apos;s models.
          </span>
          <Button type="submit" variant="primary" shortcut="⌘↵" disabled={!project || tooShort || pending}>
            {pending ? 'Starting…' : 'Start a run'}
          </Button>
        </div>
      </form>
    </Page>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center px-4 py-12 sm:px-6">
      <div className="flex w-full max-w-[720px] flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-title-1 font-semibold">New run</h1>
          <p className="text-[16px] leading-6 text-ink-2">
            Describe one feature. PrismOS plans it, has it reviewed and shows you the change before anything reaches
            GitHub.
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
