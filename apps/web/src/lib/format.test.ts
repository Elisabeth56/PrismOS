import { describe, expect, it } from 'vitest'

import { ago, shortId } from './format'

describe('ago', () => {
  const now = Date.parse('2026-10-29T12:00:00Z')
  it('reads like a person would say it', () => {
    expect(ago('2026-10-29T11:57:00Z', now)).toMatch(/3 minutes ago/)
    expect(ago('2026-10-29T11:59:58Z', now)).toBe('just now')
  })
})

describe('shortId', () => {
  it('keeps the first four characters', () => {
    expect(shortId('7f3a9c00-0000-4000-8000-000000000000')).toBe('run_7f3a')
  })
})
