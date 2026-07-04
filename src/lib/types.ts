// src/lib/types.ts

export type AgentType =
  | 'context_analyst'
  | 'pm'
  | 'architect'
  | 'uiux_designer'
  | 'engineer'
  | 'qa'
  | 'release_manager'

export type AgentStatus = 'idle' | 'running' | 'done' | 'error'

export type FeatureClassification =
  | 'new_feature'
  | 'enhancement'
  | 'refactor'
  | 'bug_fix'

export type Verdict = 'SHIPPABLE' | 'NEEDS_REVISION' | 'RUNNING'

export interface Session {
  id: string
  feature_request: string
  feature_classification: FeatureClassification
  verdict: Verdict
  step_completed: number
  created_at: string
  context_provided: boolean
  agents_count: number
  conflicts_resolved: number
  run_duration_seconds: number
}

export interface MemoryEntry {
  id: string
  project_id: string
  session_id: string
  entry_type:
    | 'architecture_decision'
    | 'shipped_feature'
    | 'conflict_resolution'
    | 'ux_decision'
    | 'known_constraint'
    | 'release_record'
  title: string
  content: string
  agents_involved: AgentType[]
  feature_classification: FeatureClassification
  relevance_tags: string[]
  created_at: string
}

export interface Project {
  id: string
  name: string
  description: string
  created_at: string
  last_run_at: string
  run_count: number
  memory_entry_count: number
}

export interface ContextInput {
  github_url?: string
  files?: File[]
  screenshot_urls?: string[]
  product_url?: string
  description?: string
  stack_info?: string
}

export type SSEEvent =
  | { type: 'context_analyst_start'; sessionId: string }
  | { type: 'context_analyst_token'; token: string }
  | { type: 'context_analyst_done'; summary: Record<string, unknown> }
  | { type: 'memory_load_start'; projectId: string }
  | { type: 'memory_load_done'; entriesLoaded: number }
  | { type: 'memory_write_done'; entriesWritten: number }
  | { type: 'uiux_designer_start'; sessionId: string }
  | { type: 'uiux_designer_token'; token: string }
  | { type: 'uiux_designer_done'; output: string }
  | { type: 'run_start'; sessionId: string; step: number }
  | { type: 'agent_start'; agent: AgentType; step: number }
  | { type: 'agent_token'; agent: AgentType; token: string }
  | { type: 'agent_done'; agent: AgentType; output: string }
  | { type: 'conflict_start'; conflictId: string }
  | { type: 'conflict_token'; conflictId: string; token: string }
  | { type: 'conflict_done'; conflictId: string; agentsInvolved: string[]; summary: string; resolution: string; rationale: string }
  | { type: 'run_complete'; verdict: 'SHIPPABLE' | 'NEEDS_REVISION'; package: Record<string, unknown> }
  | { type: 'run_error'; message: string }
