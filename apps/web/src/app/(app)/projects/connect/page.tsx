'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { ErrorPanel, Skeleton } from '@/components/app/page-states'
import { Button } from '@/components/ui'
import { api, ApiError, type InstalledRepo } from '@/lib/api'
import { env } from '@/lib/env'
import { useApi } from '@/lib/use-api'

const INSTALL_URL = `https://github.com/apps/${env.NEXT_PUBLIC_GITHUB_APP_SLUG}/installations/new`

/** Install the app on GitHub, come back, pick a repo. The API checks with GitHub that you can reach it. */
export default function Connect() {
  const router = useRouter()
  // GitHub sends people back here after installing, with the installation they just made
  const installation = Number(useSearchParams().get('installation_id')) || null
  const repos = useApi(api.installedRepos, 'installed-repos')
  const projects = useApi(api.projects, 'projects')
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState('')

  const attached = new Set(projects.data?.map((p) => p.repo_full_name.toLowerCase()))
  const fresh = (repos.data ?? []).filter(
    (r) => r.installation_id === installation && !attached.has(r.full_name.toLowerCase()),
  )
  const tokenExpired = repos.error?.code === 'github_token_missing' || repos.error?.code === 'github_token_expired'

  async function attach(repo: InstalledRepo) {
    setPending(repo.full_name)
    setError('')
    try {
      await api.attachRepo(repo)
      // straight to the thing they came to do
      router.push('/runs/new')
      router.refresh()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.')
      setPending(null)
    }
  }

  // installed on exactly one new repo: add it without asking them to pick it again
  const autoAttached = useRef(false)
  useEffect(() => {
    if (autoAttached.current || !projects.data || fresh.length !== 1) return
    autoAttached.current = true
    void attach(fresh[0])
  })

  if (installation && fresh.length === 1 && !error) {
    return (
      <div className="mx-auto flex max-w-[720px] flex-col gap-3 px-4 py-12 sm:px-6" aria-busy>
        <h1 className="text-title-1 font-semibold">Adding {fresh[0].full_name}</h1>
        <p className="text-ink-2">The app is installed. Setting up the project, then you can describe your first feature.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-title-1 font-semibold">Add a repo</h1>
        <p className="text-[16px] leading-6 text-ink-2">
          PrismOS works through a GitHub App you install on the repos you choose. It can read them and open pull
          requests on new branches, nothing more.
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {['Install the app and pick one or more repos', 'Come back here; they show up below', 'Add one and describe a feature'].map(
          (step, i) => (
            <li key={step} className="flex items-baseline gap-3">
              <span className="font-mono text-[12px] text-ink-3">{i + 1}</span>
              {step}
            </li>
          ),
        )}
      </ol>
      <div className="flex flex-wrap gap-2">
        <a href={INSTALL_URL} className="px-btn px-btn--primary">
          Install the GitHub App
        </a>
        <Button onClick={repos.reload}>I&apos;ve installed it, refresh</Button>
      </div>

      <section aria-labelledby="repos-h" className="flex flex-col gap-3">
        <h2 id="repos-h" className="text-title-3 font-medium">
          Repositories you can add
        </h2>
        {repos.loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-[12px]" />)}
        {repos.error && tokenExpired && (
          <div role="alert" className="flex flex-col gap-3 rounded-[16px] bg-surface-1 p-6">
            <p className="text-ink-2">{repos.error.message}</p>
            <div>
              <Link href="/sign-in?next=/projects/connect" className="px-btn px-btn--primary">
                Sign in again
              </Link>
            </div>
          </div>
        )}
        {repos.error && !tokenExpired && <ErrorPanel error={repos.error} onRetry={repos.reload} />}
        {repos.data?.length === 0 && (
          <p className="rounded-[12px] bg-surface-1 p-4 text-ink-2">
            No repositories yet. Install the app on GitHub, then refresh.
          </p>
        )}
        {repos.data?.map((repo) => {
          const added = attached.has(repo.full_name.toLowerCase())
          return (
            <div key={repo.full_name} className="flex items-center justify-between gap-3 rounded-[12px] bg-surface-1 px-4 py-3">
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-mono text-[13px]">{repo.full_name}</span>
                <span className="text-[12px] text-ink-3">
                  {repo.private ? 'Private' : 'Public'} · {repo.default_branch}
                </span>
              </span>
              <Button size="sm" disabled={added || pending !== null} onClick={() => attach(repo)}>
                {added ? 'Added' : pending === repo.full_name ? 'Adding…' : 'Add'}
              </Button>
            </div>
          )
        })}
        {error && (
          <p role="alert" className="text-oxblood-text">
            {error}
          </p>
        )}
      </section>
    </div>
  )
}
