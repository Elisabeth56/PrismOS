'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { use, useEffect } from 'react'

import { ErrorPanel, Skeleton } from '@/components/app/page-states'
import { ProjectProvider } from '@/components/app/project-context'
import { ButtonLink } from '@/components/ui'
import { api } from '@/lib/api'
import { useStored } from '@/lib/stored'
import { useApi } from '@/lib/use-api'

/** A project's workspace: its runs, its log and its settings, with New run always one click away. */
export default function ProjectWorkspace({
  params,
  children,
}: {
  params: Promise<{ projectId: string }>
  children: React.ReactNode
}) {
  const { projectId } = use(params)
  const path = usePathname()
  const project = useApi(() => api.project(projectId), `project-${projectId}`)
  const [, setLastProject] = useStored('prismos:last-project', '')
  const base = `/projects/${projectId}`

  // ⌘K and "New run" elsewhere open the project you were last in
  const loaded = Boolean(project.data)
  useEffect(() => {
    if (loaded) setLastProject(projectId)
  }, [loaded, projectId, setLastProject])

  const tabs = [
    { href: base, label: 'Runs', active: path === base || path.startsWith(`${base}/runs`) },
    { href: `${base}/activity`, label: 'Activity', active: path.startsWith(`${base}/activity`) },
    { href: `${base}/settings`, label: 'Settings', active: path.startsWith(`${base}/settings`) },
  ]

  if (project.error) {
    return (
      <div className="p-4 sm:p-8">
        <ErrorPanel error={project.error} onRetry={project.reload} />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-5 border-b border-hairline px-4 pt-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <Link href="/projects" className="text-[12px] text-ink-3 hover:text-ink">
              Projects
            </Link>
            {project.data ? (
              <>
                <h1 className="truncate text-title-1 font-semibold">{project.data.name}</h1>
                <span className="font-mono text-[12px] text-ink-3">
                  {project.data.repo_full_name} · {project.data.default_branch}
                </span>
              </>
            ) : (
              <>
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-4 w-40 bg-surface-2" />
              </>
            )}
          </div>
          <ButtonLink href={`${base}/runs/new`} variant="primary" shortcut="⌘K">
            New run
          </ButtonLink>
        </div>
        <nav aria-label="Project" className="-mb-px flex gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={tab.active ? 'page' : undefined}
              className={`border-b-2 px-3 pb-3 text-[14px] font-medium ${
                tab.active ? 'border-action text-ink' : 'border-transparent text-ink-3 hover:text-ink'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
      {project.data && (
        <ProjectProvider value={{ project: project.data, reload: project.reload }}>{children}</ProjectProvider>
      )}
    </div>
  )
}
