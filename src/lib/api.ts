// src/lib/api.ts
// Centralised API client for PrismOS backend.

import type {
  FeatureClassification,
  ContextInput,
  Session,
  Project,
  MemoryEntry,
} from './types'
import { getSessionToken } from './useSessionToken'

export const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'
    : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Attach anonymous session token if available
    const token = getSessionToken()
    if (token) {
      headers['X-Session-Token'] = token
    }

    const res = await fetch(`${API_BASE}${path}`, {
      headers,
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
  project_id?: string
  feature_request: string
  feature_classification: FeatureClassification
  mode?: 'full' | 'baseline'
  context_inputs: ContextInput
}

export interface CreateRunResponse {
  session_id: string
  stream_url: string
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

// ---------------------------------------------------------------------------
// GET /api/v1/sessions — List past sessions
// ---------------------------------------------------------------------------

export interface SessionListResponse {
  sessions: Session[]
}

export async function getSessions(): Promise<ApiResult<SessionListResponse>> {
  return request<SessionListResponse>('/sessions')
}

// ---------------------------------------------------------------------------
// GET /api/v1/sessions/{id} — Full session detail
// ---------------------------------------------------------------------------

export interface SessionDetailResponse {
  id: string
  feature_request: string
  feature_classification: FeatureClassification | null
  product_context: {
    product_type: string
    core_existing_features: string[]
    frontend_stack: string
    backend_stack: string
    database_models: string[]
    current_api_routes: string[]
    constraints_and_risks: string[]
    raw_analysis: string
  } | null
  intake: { step: number; output: string; created_at: string } | null
  prd: { step: number; output: string; created_at: string } | null
  architect_response: { step: number; output: string; created_at: string } | null
  uiux_response: { step: number; output: string; created_at: string } | null
  engineer_response: { step: number; output: string; created_at: string } | null
  qa_response: { step: number; output: string; created_at: string } | null
  conflicts: {
    conflict_id: string
    agents_involved: string[]
    summary: string
    resolution: string
    rationale: string
  }[]
  final_package: { step: number; output: string; created_at: string } | null
  benchmark: {
    baseline_output: string | null
    metrics: {
      requirement_coverage: { baseline: number; prismos: number }
      conflict_count: number
      edge_cases_handled: { baseline: number; prismos: number }
      verdict_clarity: { baseline: boolean; prismos: boolean }
    }
  } | null
}

export async function getSession(
  sessionId: string,
): Promise<ApiResult<SessionDetailResponse>> {
  return request<SessionDetailResponse>(`/sessions/${sessionId}`)
}

// ---------------------------------------------------------------------------
// GET /api/v1/benchmark/{sessionId} — Benchmark comparison data
// ---------------------------------------------------------------------------

export interface BenchmarkResponse {
  session_id: string
  baseline_output: string
  metrics: {
    requirement_coverage: { baseline: number; prismos: number }
    conflict_count: number
    edge_cases_handled: { baseline: number; prismos: number }
    verdict_clarity: { baseline: boolean; prismos: boolean }
  }
}

export async function getBenchmark(
  sessionId: string,
): Promise<ApiResult<BenchmarkResponse>> {
  return request<BenchmarkResponse>(`/benchmark/${sessionId}`)
}

// ---------------------------------------------------------------------------
// GET /api/v1/projects — List all projects
// ---------------------------------------------------------------------------

export interface ProjectListResponse {
  projects: Project[]
}

export async function getProjects(): Promise<ApiResult<ProjectListResponse>> {
  return request<ProjectListResponse>('/projects')
}

// ---------------------------------------------------------------------------
// GET /api/v1/projects/{id}/memory — Project memory entries
// ---------------------------------------------------------------------------

export interface ProjectMemoryResponse {
  project_id: string
  entry_count: number
  entries: MemoryEntry[]
}

export async function getProjectMemory(
  projectId: string,
): Promise<ApiResult<ProjectMemoryResponse>> {
  return request<ProjectMemoryResponse>(`/projects/${projectId}/memory`)
}
