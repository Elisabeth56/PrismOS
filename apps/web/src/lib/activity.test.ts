import { describe as group, expect, it } from 'vitest'

import { describe } from './activity'

const item = (type: string, payload: Record<string, unknown> = {}) => ({
  run_id: 'r',
  run_title: 't',
  seq: 1,
  type,
  payload,
  created_at: '',
})

group('activity descriptions', () => {
  it('names critic steps the way people say them', () => {
    expect(describe(item('step_done', { step: 'critic_security' }))).toBe('Finished security critic')
  })

  it('says where and why a run failed', () => {
    expect(describe(item('run_failed', { step: 'plan', message: 'Gemini refused.' }))).toBe(
      'Failed at plan: Gemini refused.',
    )
  })

  it('counts what the review found', () => {
    expect(describe(item('review_done', { conflicts: 1, notes: 2 }))).toBe('Review finished: 1 conflicts, 2 notes')
  })
})
