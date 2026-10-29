import { describe, expect, it } from 'vitest'

import { safeNext } from './safe-next'

describe('safeNext', () => {
  it('keeps same-site paths', () => {
    expect(safeNext('/runs/abc?tab=files')).toBe('/runs/abc?tab=files')
  })

  it.each(['//evil.com', '/\\evil.com', 'https://evil.com', '', null])('rejects %s', (value) => {
    expect(safeNext(value)).toBe('/runs/new')
  })
})
