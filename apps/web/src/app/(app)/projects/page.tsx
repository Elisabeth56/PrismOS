'use client'

import Link from 'next/link'
import { useState } from 'react'

import { ErrorPanel, Skeleton } from '@/components/app/page-states'
import { DeleteProjectDialog, EditProjectDialog } from '@/components/app/project-dialogs'
import { Button, ButtonLink } from '@/components/ui'
import { api, type Project } from '@/lib/api'
import { ago } from '@/lib/format'
import { useApi } from '@/lib/use-api'

/** Every project you're in, with create, edit and delete right here. Each one opens into its workspace. */
export default function Projects() {
  const projects = useApi(api.projects, 'projects')
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)

  return (
    <div className="flex flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-title-1 font-semibold">Projects</h1>
          <p className="text-ink-2">One project per repository. Runs, their history and settings live inside it.</p>
        </div>
        <ButtonLink href="/projects/new" variant="primary">
          New project
        </ButtonLink>
      </header>

      {projects.error && <ErrorPanel error={projects.error} onRetry={projects.reload} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {projects.loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-[16px] bg-surface-1" />)}
        {projects.data?.map((project) => (
          <article key={project.id} className="flex flex-col gap-4 rounded-[16px] bg-surface-1 p-5">
            <Link href={`/projects/${project.id}`} className="group flex min-w-0 flex-col gap-1">
              <span className="truncate text-title-3 font-medium text-ink group-hover:underline">{project.name}</span>
              <span className="truncate font-mono text-[12px] text-ink-3">
                {project.repo_full_name} · {project.default_branch}
              </span>
            </Link>
            <span className="text-[12px] text-ink-3">
              {project.run_count} run{project.run_count === 1 ? '' : 's'}
              {project.last_run_at ? ` · last ${ago(project.last_run_at)}` : ' yet'}
              {project.role === 'member' && ' · member'}
            </span>
            <div className="mt-auto flex flex-wrap gap-2">
              <ButtonLink href={`/projects/${project.id}`} size="sm" variant="primary">
                Open
              </ButtonLink>
              {project.role === 'owner' && (
                <>
                  <Button size="sm" onClick={() => setEditing(project)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="!text-oxblood-text" onClick={() => setDeleting(project)}>
                    Delete
                  </Button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      {projects.data?.length === 0 && (
        <div className="flex flex-col gap-3 rounded-[24px] bg-surface-1 p-8">
          <h2 className="text-title-2 font-semibold">Create your first project</h2>
          <p className="max-w-[560px] text-ink-2">
            Install the PrismOS GitHub App on the repos you choose. Each one becomes a project where you describe
            features and review the plan before a pull request opens.
          </p>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/projects/new" variant="primary">
              New project
            </ButtonLink>
            <ButtonLink href="/#demo">Watch a sample run</ButtonLink>
          </div>
        </div>
      )}

      {editing && (
        <EditProjectDialog
          key={editing.id}
          project={editing}
          open
          onClose={() => setEditing(null)}
          onSaved={() => void projects.reload()}
        />
      )}
      {deleting && (
        <DeleteProjectDialog
          key={deleting.id}
          project={deleting}
          open
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null)
            void projects.reload()
          }}
        />
      )}
    </div>
  )
}
