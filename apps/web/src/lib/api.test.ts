import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./supabase/client', () => ({
  createClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 't' } } }) } }),
}))

const { api, onWaking } = await import('./api')

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

describe('a sleeping API', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('makes reads wait until it wakes, and says so meanwhile', async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('connection dropped'))
      .mockResolvedValueOnce(new Response('', { status: 502 }))
      .mockResolvedValueOnce(ok([]))
    vi.stubGlobal('fetch', fetch)
    const seen: boolean[] = []
    const stop = onWaking((waking) => seen.push(waking))

    const projects = api.projects()
    await vi.runAllTimersAsync()

    expect(await projects).toEqual([])
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(seen).toEqual([false, true, false])
    stop()
  })

  it('never repeats a write', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError('connection dropped'))
    vi.stubGlobal('fetch', fetch)

    await expect(api.retry('run_1')).rejects.toMatchObject({ code: 'api_unreachable' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
