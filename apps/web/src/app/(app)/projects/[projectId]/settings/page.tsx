'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { DeleteProjectDialog } from '@/components/app/project-dialogs'
import { useProject } from '@/components/app/project-context'
import { Button } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { env } from '@/lib/env'
import { announceProjectsChanged } from '@/lib/projects-changed'

const label = 'text-[12px] leading-4 font-medium tracking-[0.02em] text-ink-2'
const field = 'h-10 rounded-[12px] border border-hairline-strong bg-surface-2 px-3 text-ink disabled:opacity-60'

export default function ProjectSettings() {
  const router = useRouter()
  const { project, reload } = useProject()
  const owner = project.role === 'owner'
  const [name, setName] = useState(project.name)
  const [branch, setBranch] = useState(project.default_branch)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const changed = name.trim() !== project.name || branch.trim() !== project.default_branch

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!changed || saving) return
    setSaving(true)
    setError('')
    try {
      await api.updateProject(project.id, { name: name.trim(), default_branch: branch.trim() })
      await reload()
      announceProjectsChanged()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex max-w-[720px] flex-col gap-8 px-4 py-8 sm:px-8">
      {!owner && (
        <p className="rounded-[12px] bg-surface-1 px-4 py-3 text-ink-2">
          You&apos;re a member of this project. Only its owner can change these settings.
        </p>
      )}

      <form onSubmit={save} className="flex flex-col gap-5 rounded-[16px] bg-surface-1 p-6">
        <h2 className="text-title-3 font-medium">General</h2>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className={label}>
            Name
          </label>
          <input id="name" className={field} value={name} maxLength={100} disabled={!owner} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="branch" className={label}>
            Default branch
          </label>
          <input
            id="branch"
            className={`${field} font-mono text-[13px]`}
            value={branch}
            disabled={!owner}
            spellCheck={false}
            onChange={(e) => setBranch(e.target.value)}
          />
          <span className="text-[12px] text-ink-3">New runs start from this branch unless you pick another.</span>
        </div>
        {error && (
          <p role="alert" className="text-oxblood-text">
            {error}
          </p>
        )}
        {owner && (
          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={!changed || saving || !name.trim() || !branch.trim()}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            {saved && (
              <span role="status" className="text-success">
                Saved
              </span>
            )}
          </div>
        )}
      </form>

      <section className="flex flex-col gap-4 rounded-[16px] bg-surface-1 p-6">
        <h2 className="text-title-3 font-medium">Repository</h2>
        <p className="text-ink-2">
          <span className="font-mono text-[13px] text-ink">{project.repo_full_name}</span>. PrismOS reads it and opens
          pull requests on new branches through its GitHub App. To give it a different repo, add that repo as another
          project.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href={`https://github.com/${project.repo_full_name}`} className="px-btn" target="_blank" rel="noreferrer">
            Open on GitHub
          </a>
          <a
            href={`https://github.com/apps/${env.NEXT_PUBLIC_GITHUB_APP_SLUG}/installations/new`}
            className="px-btn"
            target="_blank"
            rel="noreferrer"
          >
            Manage app access
          </a>
        </div>
      </section>

      {owner && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-[color-mix(in_srgb,var(--oxblood-text)_35%,transparent)] p-6">
          <div className="flex max-w-[460px] flex-col gap-1">
            <h2 className="text-title-3 font-medium">Delete project</h2>
            <p className="text-ink-2">
              Removes the project and its run history from PrismOS. Nothing changes on GitHub.
            </p>
          </div>
          <Button className="!text-oxblood-text" onClick={() => setDeleting(true)}>
            Delete project
          </Button>
        </section>
      )}
      {deleting && (
        <DeleteProjectDialog
          project={project}
          open
          onClose={() => setDeleting(false)}
          onDeleted={() => router.push('/projects')}
        />
      )}
    </div>
  )
}
