-- =============================================================================
-- PrismOS — Full Database Schema (Supabase / PostgreSQL)
-- Run this in the Supabase SQL Editor to initialise all tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  session_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_run_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- Sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  session_token TEXT,
  feature_request TEXT NOT NULL,
  feature_classification TEXT,
  context_provided BOOLEAN DEFAULT FALSE,
  step_completed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running',
  verdict TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  oss_artefact_url TEXT
);

-- ---------------------------------------------------------------------------
-- Product Contexts (Agent 0 output — one per session)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  product_type TEXT,
  frontend_stack TEXT,
  backend_stack TEXT,
  database_models TEXT[],
  current_api_routes TEXT[],
  constraints_and_risks TEXT[],
  raw_analysis TEXT,
  context_inputs JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Agent Outputs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  agent TEXT NOT NULL,
  step INTEGER NOT NULL,
  output TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Conflict Logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conflict_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  conflict_id TEXT NOT NULL,
  agents_involved TEXT[] NOT NULL,
  summary TEXT NOT NULL,
  resolution TEXT NOT NULL,
  rationale TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Benchmark Records (one per session)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS benchmark_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  baseline_output TEXT,
  baseline_issues_count INTEGER,
  prismos_issues_count INTEGER,
  prismos_conflict_count INTEGER,
  prismos_edge_cases INTEGER,
  verdict_clarity BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Memory Entries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  agents_involved TEXT[],
  feature_classification TEXT,
  relevance_tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_session ON agent_outputs(session_id);
CREATE INDEX IF NOT EXISTS idx_conflict_logs_session ON conflict_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_product_contexts_session ON product_contexts(session_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_session ON benchmark_records(session_id);
CREATE INDEX IF NOT EXISTS idx_memory_entries_project ON memory_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_memory_entries_type ON memory_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_projects_token ON projects(session_token);
