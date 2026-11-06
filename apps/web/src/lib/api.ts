// Typed client for the PrismOS API. Every call sends the Supabase session as a bearer token, and every
// failure comes back as the API's shared error shape: {"error": {"code", "message", "details"}}.
import { env } from './env'
import { createClient } from './supabase/client'

export const API_BASE = env.NEXT_PUBLIC_API_BASE_URL

export type RunStatus = 'queued' | 'running' | 'awaiting_approval' | 'pr_opened' | 'failed' | 'cancelled'
export type Critic = 'architect' | 'security' | 'ux'

export interface Project {
  id: string
  name: string
  repo_full_name: string
  default_branch: string
  role: 'owner' | 'member'
  created_at: string
  last_run_at: string | null
}

export interface Run {
  id: string
  project_id: string
  feature_request: string
  base_branch: string
  status: RunStatus
  current_step: string | null
  verdict: 'verified' | 'needs_revision' | null
  pr_url: string | null
  pr_number: number | null
  error: { code: string; message: string; step?: string | null } | null
  tokens_in: number
  tokens_out: number
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export interface RunSummary extends Run {
  conflict_count: number
}

export interface Objection {
  critic: Critic
  item_id: string
  severity: 'minor' | 'major' | 'blocking'
  concern: string
  proposed_change: string
}

export interface Conflict {
  id: string
  label: string
  item_id: string
  kind: 'contested' | 'blocking'
  objections: Objection[]
  ruling: string | null
  rationale: string | null
  owner: string | null
}

export interface Change {
  path: string
  action: 'create' | 'modify' | 'delete'
  content: string | null
}

export interface RunDetail extends Run {
  /** Latest stored output per pipeline step, keyed by step name (plan, critic_ux, build, verify...). */
  steps: Record<string, unknown>
  conflicts: Conflict[]
  changes: Change[]
}

export interface InstalledRepo {
  installation_id: number
  full_name: string
  default_branch: string
  private: boolean
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

async function session() {
  const { data } = await createClient().auth.getSession()
  return data.session
}

async function request<T>(path: string, init: RequestInit & { github?: boolean } = {}): Promise<T> {
  const current = await session()
  if (!current) throw new ApiError(401, 'not_signed_in', 'Sign in to continue.')
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${current.access_token}`)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (init.github) {
    // the user's GitHub token proves which installations they can reach (ADR-001); it's never stored
    if (!current.provider_token) {
      throw new ApiError(400, 'github_token_missing', 'Sign in with GitHub again so PrismOS can see your repositories.')
    }
    headers.set('X-GitHub-Token', current.provider_token)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: 'no-store' })
  } catch {
    // the free API host sleeps when idle; the first request after that can take ~30s or fail outright
    throw new ApiError(0, 'api_unreachable', "Can't reach the PrismOS server. It may be waking up; try again in a moment.")
  }
  if (response.ok) return response.json() as Promise<T>
  const body = await response.json().catch(() => null)
  throw new ApiError(
    response.status,
    body?.error?.code ?? 'unknown',
    body?.error?.message ?? 'Something went wrong. Try again.',
  )
}

export const api = {
  projects: () => request<Project[]>('/projects'),
  project: (id: string) => request<Project>(`/projects/${id}`),
  installedRepos: () => request<InstalledRepo[]>('/github/repositories', { github: true }),
  attachRepo: (repo: InstalledRepo) =>
    request<Project>('/projects', {
      method: 'POST',
      github: true,
      body: JSON.stringify({ installation_id: repo.installation_id, repo_full_name: repo.full_name }),
    }),
  runs: (projectId: string) => request<RunSummary[]>(`/projects/${projectId}/runs`),
  run: (id: string) => request<RunDetail>(`/runs/${id}`),
  startRun: (body: {
    project_id: string
    feature_request: string
    base_branch?: string
    context_files?: { name: string; content: string }[]
  }) => request<Run>('/runs', { method: 'POST', body: JSON.stringify(body) }),
  cancel: (id: string) => request<Run>(`/runs/${id}/cancel`, { method: 'POST' }),
  retry: (id: string) => request<Run>(`/runs/${id}/retry`, { method: 'POST' }),
  approve: (id: string) => request<RunDetail>(`/runs/${id}/approve`, { method: 'POST' }),
}
