'use client'

import { useEffect, useState } from 'react'

import { DeleteProjectDialog, EditProjectDialog } from '@/components/app/project-dialogs'
import { Button } from '@/components/ui'
import type { Project } from '@/lib/api'

const project: Project = {
  id: 'p1',
  name: 'ridgewood-booking-api',
  repo_full_name: 'Elisabeth56/ridgewood-booking-api',
  default_branch: 'main',
  role: 'owner',
  created_at: '2026-11-06T20:00:00Z',
  last_run_at: '2026-11-06T20:11:00Z',
  run_count: 2,
}

/** The project dialogs with fixture data. */
export default function ProjectDialogs() {
  const [which, setWhich] = useState<'edit' | 'delete' | null>('edit')
  // read the hash after hydration, so server and client render the same thing first
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fixture only: the hash is unknown on the server
    if (window.location.hash === '#delete') setWhich('delete')
  }, [])
  return (
    <main className="flex gap-2 p-8">
      <Button onClick={() => setWhich('edit')}>Edit dialog</Button>
      <Button onClick={() => setWhich('delete')}>Delete dialog</Button>
      {which === 'edit' && <EditProjectDialog project={project} open onClose={() => setWhich(null)} onSaved={() => {}} />}
      {which === 'delete' && (
        <DeleteProjectDialog project={project} open onClose={() => setWhich(null)} onDeleted={() => {}} />
      )}
    </main>
  )
}
