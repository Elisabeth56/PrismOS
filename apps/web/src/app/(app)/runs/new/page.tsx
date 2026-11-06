'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { ErrorPanel, Skeleton } from '@/components/app/page-states'
import { api } from '@/lib/api'
import { useStored } from '@/lib/stored'
import { useApi } from '@/lib/use-api'

/** ⌘K lands here: runs live inside a project, so this opens New run in the project you were last in. */
export default function NewRunShortcut() {
  const router = useRouter()
  const projects = useApi(api.projects, 'projects')
  const [lastProject, , loaded] = useStored('prismos:last-project', '')

  useEffect(() => {
    if (!projects.data || !loaded) return
    const target = projects.data.find((p) => p.id === lastProject) ?? projects.data[0]
    router.replace(target ? `/projects/${target.id}/runs/new` : '/projects/new')
  }, [projects.data, loaded, lastProject, router])

  return (
    <div className="flex flex-col gap-3 px-4 py-8 sm:px-8" aria-busy>
      {projects.error ? (
        <ErrorPanel error={projects.error} onRetry={projects.reload} />
      ) : (
        <>
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-40 max-w-[720px] bg-surface-2" />
        </>
      )}
    </div>
  )
}
