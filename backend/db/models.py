# backend/db/models.py
"""
Pydantic models for PrismOS.

Organised in layers:
  1. Enums & literals
  2. Context ingestion
  3. Agent outputs
  4. Conflicts & decisions
  5. Change manifest (v1.3)
  6. Final package & benchmark
  7. Project memory
  8. Database row models
  9. API request / response models
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

# =============================================================================
# 1. Enums & Literals
# =============================================================================

AgentType = Literal[
    "context_analyst",
    "pm",
    "architect",
    "uiux_designer",
    "engineer",
    "qa",
    "release_manager",
    "baseline",
]

FeatureClassification = Literal[
    "new_feature",
    "enhancement",
    "refactor",
    "bug_fix",
]

SessionStatus = Literal["running", "complete", "error"]

Verdict = Literal["SHIPPABLE", "NEEDS_REVISION"]

MemoryEntryType = Literal[
    "architecture_decision",
    "shipped_feature",
    "conflict_resolution",
    "ux_decision",
    "known_constraint",
    "release_record",
]


# =============================================================================
# 2. Context Ingestion
# =============================================================================


class FileContent(BaseModel):
    """A single uploaded file's parsed content."""
    filename: str
    content: str


class ContextInputPayload(BaseModel):
    """Raw context provided by the user at run creation."""
    github_url: Optional[str] = None
    file_contents: Optional[List[FileContent]] = None
    screenshot_urls: Optional[List[str]] = None
    product_url: Optional[str] = None
    description: Optional[str] = None
    stack_info: Optional[str] = None


class ProductContextSummary(BaseModel):
    """Structured output from Agent 0 — Context Analyst."""
    product_type: str = ""
    core_existing_features: List[str] = Field(default_factory=list)
    frontend_stack: str = ""
    backend_stack: str = ""
    database_models: List[str] = Field(default_factory=list)
    current_api_routes: List[str] = Field(default_factory=list)
    constraints_and_risks: List[str] = Field(default_factory=list)
    raw_analysis: str = ""


# =============================================================================
# 3. Agent Outputs
# =============================================================================


class IntakeOutput(BaseModel):
    """Step 1 — Feature intake (structured restatement + classification)."""
    restated_request: str = ""
    feature_classification: str = ""
    classification_reason: str = ""
    ambiguities: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    raw_output: str = ""


class PRDOutput(BaseModel):
    """Step 2 — PM Agent output."""
    prd: str = ""
    user_stories: List[str] = Field(default_factory=list)
    mvp_boundary: str = ""
    raw_output: str = ""


class ArchitectOutput(BaseModel):
    """Step 3 — Architect Agent output."""
    component_diagram: str = ""
    api_schema: str = ""
    data_models: str = ""
    tradeoff_log: str = ""
    raw_output: str = ""


class UXDesignOutput(BaseModel):
    """Step 4.5 — UI/UX Designer Agent output."""
    screen_hierarchy: str = ""
    layout_structure: str = ""
    component_hierarchy: str = ""
    interaction_states: str = ""
    user_flow: str = ""
    ux_decisions: str = ""
    raw_output: str = ""


class EngineerOutput(BaseModel):
    """Step 5 — Engineer Agent output."""
    code_files: List[Dict[str, str]] = Field(default_factory=list)
    change_manifest: str = ""
    setup_guide: str = ""
    raw_output: str = ""


class QAOutput(BaseModel):
    """Step 6 — QA Agent output."""
    test_scenarios: List[str] = Field(default_factory=list)
    bug_report: str = ""
    frontend_checks: str = ""
    verdict: str = ""
    raw_output: str = ""


# =============================================================================
# 4. Conflicts & Decisions
# =============================================================================


class ConflictRecord(BaseModel):
    """A single conflict detected during the parallel debate."""
    conflict_id: str
    agents_involved: List[str]
    summary: str
    topic: str = ""


class ReleaseDecision(BaseModel):
    """A binding decision issued by the Release Manager."""
    conflict_id: str
    agents_involved: List[str]
    summary: str
    resolution: str
    rationale: str


# =============================================================================
# 5. Change Manifest (v1.3)
# =============================================================================


class FileChange(BaseModel):
    """A single file in the final code output with change tracking."""
    path: str
    content: str
    change_type: Literal["new", "modified", "deleted"]
    change_description: str


class ChangeSummary(BaseModel):
    """Aggregate change summary for the final package."""
    files_created: int = 0
    files_modified: int = 0
    files_deleted: int = 0
    primary_impact_area: str = ""
    breaking_changes: str = "none"
    manifest_markdown: str = ""


# =============================================================================
# 6. Final Package & Benchmark
# =============================================================================


class FinalPackage(BaseModel):
    """Complete output bundle after Step 7."""
    code: str = ""
    tests: str = ""
    verdict: str = ""
    architecture_summary: str = ""
    ux_spec: str = ""
    change_summary: Optional[ChangeSummary] = None
    files: List[FileChange] = Field(default_factory=list)


class BenchmarkMetrics(BaseModel):
    """Comparison metrics between baseline (Mode A) and PrismOS (Mode B)."""
    requirement_coverage: Dict[str, int] = Field(
        default_factory=lambda: {"baseline": 0, "prismos": 0}
    )
    conflict_count: int = 0
    edge_cases_handled: Dict[str, int] = Field(
        default_factory=lambda: {"baseline": 0, "prismos": 0}
    )
    verdict_clarity: Dict[str, bool] = Field(
        default_factory=lambda: {"baseline": False, "prismos": False}
    )


class BenchmarkResult(BaseModel):
    """Full benchmark comparison data."""
    baseline_output: str = ""
    metrics: BenchmarkMetrics = Field(default_factory=BenchmarkMetrics)


# =============================================================================
# 7. Project Memory
# =============================================================================


class MemoryEntry(BaseModel):
    """A single entry in the project memory store."""
    id: Optional[str] = None
    project_id: str
    session_id: Optional[str] = None
    entry_type: MemoryEntryType
    title: str
    content: str
    agents_involved: List[str] = Field(default_factory=list)
    feature_classification: Optional[str] = None
    relevance_tags: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None


# =============================================================================
# 8. Database Row Models
# =============================================================================


class SessionRow(BaseModel):
    """Maps to the `sessions` table."""
    id: Optional[str] = None
    project_id: Optional[str] = None
    session_token: Optional[str] = None
    feature_request: str
    feature_classification: Optional[str] = None
    context_provided: bool = False
    step_completed: int = 0
    status: str = "running"
    verdict: Optional[str] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None
    oss_artefact_url: Optional[str] = None


class ProductContextRow(BaseModel):
    """Maps to the `product_contexts` table."""
    id: Optional[str] = None
    session_id: str
    product_type: Optional[str] = None
    frontend_stack: Optional[str] = None
    backend_stack: Optional[str] = None
    database_models: List[str] = Field(default_factory=list)
    current_api_routes: List[str] = Field(default_factory=list)
    constraints_and_risks: List[str] = Field(default_factory=list)
    raw_analysis: Optional[str] = None
    context_inputs: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None


class AgentOutputRow(BaseModel):
    """Maps to the `agent_outputs` table."""
    id: Optional[str] = None
    session_id: str
    agent: str
    step: int
    output: str
    created_at: Optional[str] = None


class ConflictLogRow(BaseModel):
    """Maps to the `conflict_logs` table."""
    id: Optional[str] = None
    session_id: str
    conflict_id: str
    agents_involved: List[str]
    summary: str
    resolution: str
    rationale: str
    created_at: Optional[str] = None


class BenchmarkRecordRow(BaseModel):
    """Maps to the `benchmark_records` table."""
    id: Optional[str] = None
    session_id: str
    baseline_output: Optional[str] = None
    baseline_issues_count: Optional[int] = None
    prismos_issues_count: Optional[int] = None
    prismos_conflict_count: Optional[int] = None
    prismos_edge_cases: Optional[int] = None
    verdict_clarity: Optional[bool] = None
    created_at: Optional[str] = None


class ProjectRow(BaseModel):
    """Maps to the `projects` table."""
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    session_token: Optional[str] = None
    created_at: Optional[str] = None
    last_run_at: Optional[str] = None


class MemoryEntryRow(BaseModel):
    """Maps to the `memory_entries` table."""
    id: Optional[str] = None
    project_id: str
    session_id: Optional[str] = None
    entry_type: str
    title: str
    content: str
    agents_involved: List[str] = Field(default_factory=list)
    feature_classification: Optional[str] = None
    relevance_tags: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None


# =============================================================================
# 9. API Request / Response Models
# =============================================================================


class CreateRunRequest(BaseModel):
    """POST /api/v1/runs"""
    project_id: Optional[str] = None
    feature_request: str
    feature_classification: FeatureClassification = "new_feature"
    mode: Literal["full", "baseline"] = "full"
    context_inputs: Optional[ContextInputPayload] = None


class CreateRunResponse(BaseModel):
    """POST /api/v1/runs → 202"""
    session_id: str
    stream_url: str


class SessionSummary(BaseModel):
    """Single item in the sessions list response."""
    id: str
    feature_request: str
    feature_classification: Optional[str] = None
    verdict: Optional[str] = None
    created_at: Optional[str] = None
    step_completed: int = 0
    context_provided: bool = False
    conflicts_resolved: int = 0
    run_duration_seconds: int = 0


class SessionListResponse(BaseModel):
    """GET /api/v1/sessions"""
    sessions: List[SessionSummary]


class SessionDetailResponse(BaseModel):
    """GET /api/v1/sessions/{id}"""
    id: str
    feature_request: str
    feature_classification: Optional[str] = None
    product_context: Optional[ProductContextSummary] = None
    intake: Optional[Dict[str, Any]] = None
    prd: Optional[Dict[str, Any]] = None
    architect_response: Optional[Dict[str, Any]] = None
    uiux_response: Optional[Dict[str, Any]] = None
    engineer_response: Optional[Dict[str, Any]] = None
    qa_response: Optional[Dict[str, Any]] = None
    conflicts: List[Dict[str, Any]] = Field(default_factory=list)
    final_package: Optional[Dict[str, Any]] = None
    benchmark: Optional[Dict[str, Any]] = None


class BenchmarkResponse(BaseModel):
    """GET /api/v1/benchmark/{sessionId}"""
    session_id: str
    baseline_output: Optional[str] = None
    metrics: Optional[BenchmarkMetrics] = None


class CreateProjectRequest(BaseModel):
    """POST /api/v1/projects"""
    name: str
    description: Optional[str] = None


class CreateProjectResponse(BaseModel):
    """POST /api/v1/projects → 201"""
    id: str
    name: str
    created_at: str


class UpdateProjectRequest(BaseModel):
    """PUT /api/v1/projects/{id}"""
    name: str
    description: Optional[str] = None


class UpdateProjectResponse(BaseModel):
    """PUT /api/v1/projects/{id} → 200"""
    id: str
    name: str
    description: Optional[str] = None


class ProjectMemoryResponse(BaseModel):
    """GET /api/v1/projects/{id}/memory"""
    project_id: str
    entry_count: int
    entries: List[MemoryEntry]
