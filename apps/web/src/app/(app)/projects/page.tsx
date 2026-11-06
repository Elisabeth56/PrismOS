'use client'

import Link from 'next/link'

import { ErrorPanel, Skeleton } from '@/components/app/page-states'
import { ButtonLink } from '@/components/ui'
import { api } from '@/lib/api'
import { ago } from '@/lib/format'
import { useApi } from '@/lib/use-api'

/** Every project you're in. Each one is a workspace with its runs, activity and settings. */
export default function Projects() {
  const projects = useApi(api.projects, 'projects')

  return (
    <div className="flex flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-title-1 font-semibold">Projects</h1>
          <p className="text-ink-2">One project per repository. Runs, their history and settings live inside it.</p>
        </div>
        <ButtonLink href="/projects/connect" variant="primary">
          Add a repo
        </ButtonLink>
      </header>

      {projects.error && <ErrorPanel error={projects.error} onRetry={projects.reload} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {projects.loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-[16px] bg-surface-1" />)}
        {projects.data?.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group flex flex-col gap-4 rounded-[16px] bg-surface-1 p-5 transition-[transform,background] duration-200 hover:-translate-y-0.5 hover:bg-surface-2"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-title-3 font-medium text-ink">{project.name}</span>
              <span className="truncate font-mono text-[12px] text-ink-3">{project.repo_full_name}</span>
            </div>
            <div className="mt-auto flex items-center justify-between gap-3 text-[12px] text-ink-3">
              <span>
                {project.run_count} run{project.run_count === 1 ? '' : 's'}
                {project.last_run_at && ` · last ${ago(project.last_run_at)}`}
              </span>
              <span className="text-ink-2 group-hover:text-ink">Open →</span>
            </div>
          </Link>
        ))}
      </div>

      {projects.data?.length === 0 && (
        <div className="flex flex-col gap-3 rounded-[24px] bg-surface-1 p-8">
          <h2 className="text-title-2 font-semibold">Connect your first repo</h2>
          <p className="max-w-[560px] text-ink-2">
            Install the PrismOS GitHub App on the repos you choose. Each one becomes a project where you describe
            features and review the plan before a pull request opens.
          </p>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/projects/connect" variant="primary">
              Add a repo
            </ButtonLink>
            <ButtonLink href="/#demo">Watch a sample run</ButtonLink>
          </div>
        </div>
      )}
    </div>
  )
}
