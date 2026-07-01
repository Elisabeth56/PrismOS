// src/lib/api.ts
// Centralised API client for PrismOS backend.

import { FeatureClassification, ContextInput } from './types'

const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.prismos.app/api/v1'
    : process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.prismos.app/api/v1'

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

interface ApiOk<T> {
  ok: true
  data: T
}

interface ApiErr {
  ok: false
  error: string
}

type ApiResult<T> = ApiOk<T> | ApiErr

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      return { ok: false, error: text }
    }
    const data = (await res.json()) as T
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/runs — Start a new agent run
// ---------------------------------------------------------------------------

export interface CreateRunPayload {
  feature_request: string
  feature_classification: FeatureClassification
  context_inputs: ContextInput
}

export interface CreateRunResponse {
  session_id: string
}

export async function createRun(
  payload: CreateRunPayload,
): Promise<ApiResult<CreateRunResponse>> {
  return request<CreateRunResponse>('/runs', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ---------------------------------------------------------------------------
// PUT /api/v1/projects/{id} — Update project settings
// ---------------------------------------------------------------------------

export interface UpdateProjectPayload {
  name: string
  description: string
}

export interface UpdateProjectResponse {
  id: string
  name: string
  description: string
}

export async function updateProject(
  projectId: string,
  payload: UpdateProjectPayload,
): Promise<ApiResult<UpdateProjectResponse>> {
  return request<UpdateProjectResponse>(`/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

// ---------------------------------------------------------------------------
// POST /api/v1/projects — Create a new project
// ---------------------------------------------------------------------------

export interface CreateProjectPayload {
  name: string
  description: string
}

export interface CreateProjectResponse {
  id: string
  name: string
  description: string
}

export async function createProject(
  payload: CreateProjectPayload,
): Promise<ApiResult<CreateProjectResponse>> {
  return request<CreateProjectResponse>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ---------------------------------------------------------------------------
// POST /api/v1/waitlist — Join the waitlist
// ---------------------------------------------------------------------------

export interface JoinWaitlistPayload {
  email: string
  name?: string
}

export interface JoinWaitlistResponse {
  success: boolean
}

export async function joinWaitlist(
  payload: JoinWaitlistPayload,
): Promise<ApiResult<JoinWaitlistResponse>> {
  return request<JoinWaitlistResponse>('/waitlist', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
