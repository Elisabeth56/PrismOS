'use client'

import { createContext, useContext } from 'react'

import type { Project } from '@/lib/api'

interface ProjectState {
  project: Project
  reload: () => Promise<void>
}

const ProjectContext = createContext<ProjectState | null>(null)

export const ProjectProvider = ProjectContext.Provider

/** The project whose workspace this page is in. Only valid inside /projects/[projectId]. */
export function useProject() {
  const state = useContext(ProjectContext)
  if (!state) throw new Error('useProject must be used inside a project workspace')
  return state
}
