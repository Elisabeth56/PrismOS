'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { ErrorPanel, Skeleton } from '@/components/app/page-states'
import { fieldInput, fieldLabel } from '@/components/app/project-dialogs'
import { Button, ButtonLink } from '@/components/ui'
import { api, ApiError, type InstalledRepo } from '@/lib/api'
import { env } from '@/lib/env'
import { announceProjectsChanged } from '@/lib/projects-changed'
import { useApi } from '@/lib/use-api'

const INSTALL_URL = `https://github.com/apps/${env.NEXT_PUBLIC_GITHUB_APP_SLUG}/installations/new`

/**
 * New project: pick a repo the app is installed on, name it, choose its default branch.
 * Also the GitHub App's Setup URL: coming back from installing on exactly one repo creates it straight away.
 */
export default function NewProject() {
  const router = useRouter()
  const installation = Number(useSearchParams().get('installation_id')) || null
  const repos = useApi(api.installedRepos, 'installed-repos')
  const projects = useApi(api.projects, 'projects')
  const [chosen, setChosen] = useState<InstalledRepo | null>(null)
  const [name, setName] = useState('')
  const [branch, setBranch] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const attached = new Set(projects.data?.map((p) => p.repo_full_name.toLowerCase()))
  const available = (repos.data ?? []).filter((r) => !attached.has(r.full_name.toLowerCase()))
  const fresh = available.filter((r) => r.installation_id === installation)
  const tokenExpired = repos.error?.code === 'github_token_missing' || repos.error?.code === 'github_token_expired'

  function choose(repo: InstalledRepo) {
    setChosen(repo)
    setName(repo.full_name.split('/')[1])
    setBranch(repo.default_branch)
  }

  async function create(repo: InstalledRepo, details: { name?: string; default_branch?: string } = {}) {
    setPending(true)
    setError('')
    try {
      const project = await api.createProject(repo, details)
      announceProjectsChanged()
      router.push(`/projects/${project.id}/runs/new`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.')
      setPending(false)
    }
  }

  // back from installing on exactly one new repo: create it without asking them to pick it again
  const autoCreated = useRef(false)
  useEffect(() => {
    if (autoCreated.current || !projects.data || fresh.length !== 1) return
    autoCreated.current = true
    void create(fresh[0])
  })

  if (installation && fresh.length === 1 && !error) {
    return (
      <div className="flex max-w-[720px] flex-col gap-3 px-4 py-8 sm:px-8" aria-busy>
        <h1 className="text-title-1 font-semibold">Creating {fresh[0].full_name}</h1>
        <p className="text-ink-2">The app is installed. Setting up the project, then you can describe your first feature.</p>
      </div>
    )
  }

  return (
    <div className="flex max-w-[760px] flex-col gap-8 px-4 py-8 sm:px-8">
      <div className="flex flex-col gap-2">
        <Link href="/projects" className="text-[12px] text-ink-3 hover:text-ink">
          Projects
        </Link>
        <h1 className="text-title-1 font-semibold">New project</h1>
        <p className="text-[16px] leading-6 text-ink-2">
          A project is one repository. Pick one PrismOS can reach, name it, and choose the branch runs start from.
        </p>
      </div>

      <section aria-labelledby="repo-h" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="repo-h" className="text-title-3 font-medium">
            1. Repository
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={repos.reload}>
              Refresh list
            </Button>
            <a href={INSTALL_URL} className="px-btn px-btn--sm">
              Add repos on GitHub
            </a>
          </div>
        </div>

        {repos.loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-[12px] bg-surface-1" />)}
        {repos.error && tokenExpired && (
          <div role="alert" className="flex flex-col gap-3 rounded-[16px] bg-surface-1 p-6">
            <p className="text-ink-2">{repos.error.message}</p>
            <div>
              <ButtonLink href="/sign-in?next=/projects/new" variant="primary">
                Sign in again
              </ButtonLink>
            </div>
          </div>
        )}
        {repos.error && !tokenExpired && <ErrorPanel error={repos.error} onRetry={repos.reload} />}
        {repos.data && available.length === 0 && (
          <div className="flex flex-col gap-3 rounded-[16px] bg-surface-1 p-6">
            <p className="text-ink-2">
              {repos.data.length === 0
                ? "PrismOS isn't installed on any of your repositories yet. Install the GitHub App and pick the repos it may use."
                : 'Every repository PrismOS can reach already has a project. Add more repos to the app on GitHub.'}
            </p>
            <div>
              <a href={INSTALL_URL} className="px-btn px-btn--primary">
                Install the GitHub App
              </a>
            </div>
          </div>
        )}
        {available.length > 0 && (
          <div role="radiogroup" aria-labelledby="repo-h" className="flex flex-col gap-2">
            {available.map((repo) => {
              const selected = chosen?.full_name === repo.full_name
              return (
                <button
                  key={repo.full_name}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(repo)}
                  className={`flex items-center justify-between gap-3 rounded-[12px] px-4 py-3 text-left transition-colors ${
                    selected ? 'bg-surface-3 shadow-[inset_0_0_0_1.5px_var(--action)]' : 'bg-surface-1 hover:bg-surface-2'
                  }`}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-mono text-[13px]">{repo.full_name}</span>
                    <span className="text-[12px] text-ink-3">
                      {repo.private ? 'Private' : 'Public'} · {repo.default_branch}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={`size-4 flex-none rounded-full border-2 ${selected ? 'border-action bg-action' : 'border-hairline-strong'}`}
                  />
                </button>
              )
            })}
          </div>
        )}
      </section>

      <form
        aria-labelledby="details-h"
        onSubmit={(event) => {
          event.preventDefault()
          if (chosen) void create(chosen, { name: name.trim(), default_branch: branch.trim() })
        }}
        className={`flex flex-col gap-4 rounded-[16px] bg-surface-1 p-6 ${chosen ? '' : 'opacity-60'}`}
      >
        <h2 id="details-h" className="text-title-3 font-medium">
          2. Details
        </h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-0 flex-[2_1_240px] flex-col gap-1.5">
            <label htmlFor="name" className={fieldLabel}>
              Project name
            </label>
            <input id="name" className={fieldInput} value={name} maxLength={100} disabled={!chosen} onChange={(e) => setName(e.target.value)} placeholder="Pick a repository first" />
          </div>
          <div className="flex min-w-0 flex-[1_1_160px] flex-col gap-1.5">
            <label htmlFor="branch" className={fieldLabel}>
              Default branch
            </label>
            <input
              id="branch"
              className={`${fieldInput} font-mono text-[13px]`}
              value={branch}
              disabled={!chosen}
              spellCheck={false}
              onChange={(e) => setBranch(e.target.value)}
            />
          </div>
        </div>
        {error && (
          <p role="alert" className="text-oxblood-text">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <ButtonLink href="/projects" variant="ghost">
            Cancel
          </ButtonLink>
          <Button type="submit" variant="primary" disabled={!chosen || !name.trim() || !branch.trim() || pending}>
            {pending ? 'Creating…' : 'Create project'}
          </Button>
        </div>
      </form>
    </div>
  )
}
