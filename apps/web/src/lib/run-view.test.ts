import { describe, expect, it } from 'vitest'

import type { RunDetail } from './api'
import { criticState, runView } from './run-view'

const base: RunDetail = {
  id: 'r1',
  project_id: 'p1',
  feature_request: 'Add rate limiting to login',
  base_branch: 'main',
  status: 'running',
  current_step: 'critic_security',
  verdict: null,
  pr_url: null,
  pr_number: null,
  error: null,
  tokens_in: 0,
  tokens_out: 0,
  created_at: '',
  started_at: null,
  finished_at: null,
  steps: {
    read_files: { files: { 'a.py': '', 'b.py': '' } },
    plan: { summary: 's', items: [{ id: '1', text: 'x' }, { id: '2', text: 'y' }] },
    critic_architect: { critic: 'architect', objections: [{ item_id: '2', severity: 'major', concern: 'c', proposed_change: 'p' }] },
  },
  conflicts: [],
  changes: [],
}

describe('runView', () => {
  it('builds the step rail from finished steps and the live one', () => {
    const view = runView(base)
    expect(view.rail.map((s) => s.state)).toEqual(['done', 'done', 'active', 'todo', 'todo', 'todo'])
    expect(view.rail[0].label).toBe('Read 2 files')
    expect(view.liveLabel).toBe('Reviewing spec')
  })

  it('marks spec items with the critics that objected', () => {
    expect(runView(base).markers('2')).toEqual(['architect'])
    expect(runView(base).markers('1')).toEqual([])
  })

  it('shows resolve as skipped when the critics raised no conflicts', () => {
    const view = runView({
      ...base,
      current_step: 'build',
      steps: {
        ...base.steps,
        critic_security: { critic: 'security', objections: [] },
        critic_ux: { critic: 'ux', objections: [] },
      },
    })
    expect(view.rail[3].state).toBe('skipped')
    expect(view.rail[4].state).toBe('active')
  })

  it('treats objections outside conflicts as notes', () => {
    expect(runView(base).notes).toHaveLength(1)
    const contested = { ...base, conflicts: [{ id: 'c', label: 'c1', item_id: '2', kind: 'contested' as const, objections: [], ruling: null, rationale: null, owner: null }] }
    expect(runView(contested).notes).toHaveLength(0)
  })
})

describe('criticState', () => {
  it('says what the critic did in plain words', () => {
    expect(criticState(null, true).state).toBe('Reading the spec')
    expect(criticState({ critic: 'ux', objections: [] }, false)).toEqual({ state: 'No objections', count: 0 })
    const two = { critic: 'security' as const, objections: [
      { item_id: '2', severity: 'major' as const, concern: '', proposed_change: '' },
      { item_id: '3', severity: 'blocking' as const, concern: '', proposed_change: '' },
    ] }
    expect(criticState(two, false)).toEqual({ state: 'Blocks items 2 and 3', count: 2 })
  })
})
