/** Fired after a project is added, renamed or removed, so the sidebar's list catches up without a reload. */
export const PROJECTS_CHANGED = 'prismos:projects-changed'

export function announceProjectsChanged() {
  window.dispatchEvent(new Event(PROJECTS_CHANGED))
}
