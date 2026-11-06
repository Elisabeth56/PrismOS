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

from typing import Any, Literal

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
    github_url: str | None = None
    file_contents: list[FileContent] | None = None
    screenshot_urls: list[str] | None = None
    product_url: str | None = None
    description: str | None = None
    stack_info: str | None = None


class ProductContextSummary(BaseModel):
    """Structured output from Agent 0 — Context Analyst."""
    product_type: str = ""
    core_existing_features: list[str] = Field(default_factory=list)
    frontend_stack: str = ""
    backend_stack: str = ""
    database_models: list[str] = Field(default_factory=list)
    current_api_routes: list[str] = Field(default_factory=list)
    constraints_and_risks: list[str] = Field(default_factory=list)
    raw_analysis: str = ""


# =============================================================================
# 3. Agent Outputs
# =============================================================================


class IntakeOutput(BaseModel):
    """Step 1 — Feature intake (structured restatement + classification)."""
    restated_request: str = ""
    feature_classification: str = ""
    classification_reason: str = ""
    ambiguities: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    raw_output: str = ""


class PRDOutput(BaseModel):
    """Step 2 — PM Agent output."""
    prd: str = ""
    user_stories: list[str] = Field(default_factory=list)
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
    code_files: list[dict[str, str]] = Field(default_factory=list)
    change_manifest: str = ""
    setup_guide: str = ""
    raw_output: str = ""


class QAOutput(BaseModel):
    """Step 6 — QA Agent output."""
    test_scenarios: list[str] = Field(default_factory=list)
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
    agents_involved: list[str]
    summary: str
    topic: str = ""


class ReleaseDecision(BaseModel):
    """A binding decision issued by the Release Manager."""
    conflict_id: str
    agents_involved: list[str]
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
    change_summary: ChangeSummary | None = None
    files: list[FileChange] = Field(default_factory=list)


class BenchmarkMetrics(BaseModel):
    """Comparison metrics between baseline (Mode A) and PrismOS (Mode B)."""
    requirement_coverage: dict[str, int] = Field(
        default_factory=lambda: {"baseline": 0, "prismos": 0}
    )
    conflict_count: int = 0
    edge_cases_handled: dict[str, int] = Field(
        default_factory=lambda: {"baseline": 0, "prismos": 0}
    )
    verdict_clarity: dict[str, bool] = Field(
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
    id: str | None = None
    project_id: str
    session_id: str | None = None
    entry_type: MemoryEntryType
    title: str
    content: str
    agents_involved: list[str] = Field(default_factory=list)
    feature_classification: str | None = None
    relevance_tags: list[str] = Field(default_factory=list)
    created_at: str | None = None


# =============================================================================
# 8. Database Row Models
# =============================================================================


class SessionRow(BaseModel):
    """Maps to the `sessions` table."""
    id: str | None = None
    project_id: str | None = None
    session_token: str | None = None
    feature_request: str
    feature_classification: str | None = None
    context_provided: bool = False
    step_completed: int = 0
    status: str = "running"
    verdict: str | None = None
    created_at: str | None = None
    completed_at: str | None = None


class ProductContextRow(BaseModel):
    """Maps to the `product_contexts` table."""
    id: str | None = None
    session_id: str
    product_type: str | None = None
    frontend_stack: str | None = None
    backend_stack: str | None = None
    database_models: list[str] = Field(default_factory=list)
    current_api_routes: list[str] = Field(default_factory=list)
    constraints_and_risks: list[str] = Field(default_factory=list)
    raw_analysis: str | None = None
    context_inputs: dict[str, Any] | None = None
    created_at: str | None = None


class AgentOutputRow(BaseModel):
    """Maps to the `agent_outputs` table."""
    id: str | None = None
    session_id: str
    agent: str
    step: int
    output: str
    created_at: str | None = None


class ConflictLogRow(BaseModel):
    """Maps to the `conflict_logs` table."""
    id: str | None = None
    session_id: str
    conflict_id: str
    agents_involved: list[str]
    summary: str
    resolution: str
    rationale: str
    created_at: str | None = None


class BenchmarkRecordRow(BaseModel):
    """Maps to the `benchmark_records` table."""
    id: str | None = None
    session_id: str
    baseline_output: str | None = None
    baseline_issues_count: int | None = None
    prismos_issues_count: int | None = None
    prismos_conflict_count: int | None = None
    prismos_edge_cases: int | None = None
    verdict_clarity: bool | None = None
    created_at: str | None = None


class ProjectRow(BaseModel):
    """Maps to the `projects` table."""
    id: str | None = None
    name: str
    description: str | None = None
    session_token: str | None = None
    created_at: str | None = None
    last_run_at: str | None = None


class MemoryEntryRow(BaseModel):
    """Maps to the `memory_entries` table."""
    id: str | None = None
    project_id: str
    session_id: str | None = None
    entry_type: str
    title: str
    content: str
    agents_involved: list[str] = Field(default_factory=list)
    feature_classification: str | None = None
    relevance_tags: list[str] = Field(default_factory=list)
    created_at: str | None = None


# =============================================================================
# 9. API Request / Response Models
# =============================================================================


class CreateRunRequest(BaseModel):
    """POST /api/v1/runs"""
    project_id: str | None = None
    feature_request: str
    feature_classification: FeatureClassification = "new_feature"
    context_inputs: ContextInputPayload | None = None


class CreateRunResponse(BaseModel):
    """POST /api/v1/runs → 202"""
    session_id: str
    stream_url: str


class SessionSummary(BaseModel):
    """Single item in the sessions list response."""
    id: str
    feature_request: str
    feature_classification: str | None = None
    verdict: str | None = None
    created_at: str | None = None
    step_completed: int = 0
    context_provided: bool = False
    conflicts_resolved: int = 0
    run_duration_seconds: int = 0


class SessionListResponse(BaseModel):
    """GET /api/v1/sessions"""
    sessions: list[SessionSummary]


class SessionDetailResponse(BaseModel):
    """GET /api/v1/sessions/{id}"""
    id: str
    feature_request: str
    feature_classification: str | None = None
    product_context: ProductContextSummary | None = None
    intake: dict[str, Any] | None = None
    prd: dict[str, Any] | None = None
    architect_response: dict[str, Any] | None = None
    uiux_response: dict[str, Any] | None = None
    engineer_response: dict[str, Any] | None = None
    qa_response: dict[str, Any] | None = None
    conflicts: list[dict[str, Any]] = Field(default_factory=list)
    final_package: dict[str, Any] | None = None
    benchmark: dict[str, Any] | None = None


class BenchmarkResponse(BaseModel):
    """GET /api/v1/benchmark/{sessionId}"""
    session_id: str
    baseline_output: str | None = None
    metrics: BenchmarkMetrics | None = None


class CreateProjectRequest(BaseModel):
    """POST /api/v1/projects"""
    name: str
    description: str | None = None


class CreateProjectResponse(BaseModel):
    """POST /api/v1/projects → 201"""
    id: str
    name: str
    created_at: str


class UpdateProjectRequest(BaseModel):
    """PUT /api/v1/projects/{id}"""
    name: str
    description: str | None = None


class UpdateProjectResponse(BaseModel):
    """PUT /api/v1/projects/{id} → 200"""
    id: str
    name: str
    description: str | None = None


class ProjectMemoryResponse(BaseModel):
    """GET /api/v1/projects/{id}/memory"""
    project_id: str
    entry_count: int
    entries: list[MemoryEntry]
