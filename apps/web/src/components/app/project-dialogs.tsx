'use client'

import { useState } from 'react'

import { Button } from '@/components/ui'
import { api, ApiError, type Project } from '@/lib/api'
import { announceProjectsChanged } from '@/lib/projects-changed'

import { Dialog } from './dialog'

export const fieldLabel = 'text-[12px] leading-4 font-medium tracking-[0.02em] text-ink-2'
export const fieldInput =
  'h-10 rounded-[12px] border border-hairline-strong bg-surface-2 px-3 text-ink disabled:opacity-60'

const failure = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Try again.')

export function EditProjectDialog({
  project,
  open,
  onClose,
  onSaved,
}: {
  project: Project
  open: boolean
  onClose: () => void
  onSaved: (project: Project) => void
}) {
  const [name, setName] = useState(project.name)
  const [branch, setBranch] = useState(project.default_branch)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const saved = await api.updateProject(project.id, { name: name.trim(), default_branch: branch.trim() })
      announceProjectsChanged()
      onSaved(saved)
      onClose()
    } catch (e) {
      setError(failure(e))
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Edit ${project.name}`}>
      <form onSubmit={save} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`name-${project.id}`} className={fieldLabel}>
            Name
          </label>
          <input id={`name-${project.id}`} className={fieldInput} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`branch-${project.id}`} className={fieldLabel}>
            Default branch
          </label>
          <input
            id={`branch-${project.id}`}
            className={`${fieldInput} font-mono text-[13px]`}
            value={branch}
            spellCheck={false}
            onChange={(e) => setBranch(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-oxblood-text">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={pending || !name.trim() || !branch.trim()}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function DeleteProjectDialog({
  project,
  open,
  onClose,
  onDeleted,
}: {
  project: Project
  open: boolean
  onClose: () => void
  onDeleted: () => void
}) {
  const [typed, setTyped] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function remove() {
    setPending(true)
    setError('')
    try {
      await api.removeProject(project.id)
      announceProjectsChanged()
      onDeleted()
    } catch (e) {
      setError(failure(e))
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Delete ${project.name}?`}>
      <p className="text-ink-2">
        This deletes the project and its {project.run_count} run{project.run_count === 1 ? '' : 's'} from PrismOS. The
        repository and any pull requests already opened stay as they are on GitHub.
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`confirm-${project.id}`} className={fieldLabel}>
          Type <span className="font-mono text-ink">{project.name}</span> to confirm
        </label>
        <input id={`confirm-${project.id}`} className={fieldInput} value={typed} autoComplete="off" onChange={(e) => setTyped(e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="text-oxblood-text">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={remove} disabled={typed !== project.name || pending} className="!border-transparent !bg-oxblood !text-on-oxblood">
          {pending ? 'Deleting…' : 'Delete project'}
        </Button>
      </div>
    </Dialog>
  )
}
