import { describe, expect, it } from 'vitest'

import { lastSeq, mergeEvents, type RunEvent } from './run-events'

const event = (seq: number, type = 'step_done'): RunEvent => ({ seq, type, payload: {}, created_at: '' })

describe('mergeEvents', () => {
  it('keeps events in seq order', () => {
    expect(mergeEvents([event(1)], [event(3), event(2)]).map((e) => e.seq)).toEqual([1, 2, 3])
  })

  it('drops duplicates when replay and realtime overlap', () => {
    expect(mergeEvents([event(1), event(2)], [event(2), event(3)]).map((e) => e.seq)).toEqual([1, 2, 3])
  })

  it('returns the same list when nothing is new', () => {
    const current = [event(1)]
    expect(mergeEvents(current, [])).toBe(current)
  })
})

describe('lastSeq', () => {
  it('is 0 for an empty stream and the highest seq otherwise', () => {
    expect(lastSeq([])).toBe(0)
    expect(lastSeq([event(1), event(4)])).toBe(4)
  })
})
