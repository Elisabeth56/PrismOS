import { describe, expect, it } from 'vitest'

import { diffRows } from './diff-file'

describe('diffRows', () => {
  it('marks added and removed lines', () => {
    expect(diffRows('a\nb\n', 'a\nc\n').map((r) => r.kind)).toEqual(['same', 'rem', 'add'])
  })

  it('collapses long unchanged stretches into one gap', () => {
    const before = Array.from({ length: 20 }, (_, i) => `line ${i}`).join('\n') + '\n'
    const after = before.replace('line 10', 'changed')
    const kinds = diffRows(before, after).map((r) => r.kind)
    expect(kinds.filter((k) => k === 'gap')).toHaveLength(2)
    expect(kinds).toContain('add')
  })

  it('shows a new file as all additions', () => {
    expect(diffRows('', 'x\ny\n').every((r) => r.kind === 'add')).toBe(true)
  })
})
