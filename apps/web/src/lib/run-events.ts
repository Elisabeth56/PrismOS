// Following a run live (ADR-004): replay stored events from the API, then subscribe to new rows over
// Supabase Realtime. RLS on run_events means the subscription only ever delivers the caller's runs.
import { API_BASE } from './api'
import { createClient } from './supabase/client'

export interface RunEvent {
  seq: number
  type: string
  payload: Record<string, unknown>
  created_at: string
}

/** Adds new events to the list in seq order, ignoring ones already there (replay and Realtime can overlap). */
export function mergeEvents(existing: RunEvent[], incoming: RunEvent[]): RunEvent[] {
  if (incoming.length === 0) return existing
  const bySeq = new Map(existing.map((event) => [event.seq, event]))
  for (const event of incoming) bySeq.set(event.seq, event)
  return [...bySeq.values()].sort((a, b) => a.seq - b.seq)
}

export function lastSeq(events: RunEvent[]): number {
  return events.length ? events[events.length - 1].seq : 0
}

async function fetchEventsAfter(runId: string, after: number, accessToken: string): Promise<RunEvent[]> {
  const response = await fetch(`${API_BASE}/runs/${runId}/events?after=${after}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`events request failed with ${response.status}`)
  return response.json()
}

/**
 * Calls onEvents with every event after `after`, then with each new one as it arrives.
 * Returns a function that stops following.
 */
export async function followRun(
  runId: string,
  after: number,
  onEvents: (events: RunEvent[]) => void,
): Promise<() => void> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('not signed in')

  let seen = after
  const deliver = (events: RunEvent[]) => {
    const fresh = events.filter((event) => event.seq > seen)
    if (fresh.length === 0) return
    seen = Math.max(seen, ...fresh.map((event) => event.seq))
    onEvents(fresh)
  }

  deliver(await fetchEventsAfter(runId, seen, token))

  const channel = supabase
    .channel(`run:${runId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'run_events', filter: `run_id=eq.${runId}` },
      (change) => deliver([change.new as RunEvent]),
    )
    .subscribe(async (status) => {
      // anything written between the replay and the subscription going live is fetched once more
      if (status === 'SUBSCRIBED') deliver(await fetchEventsAfter(runId, seen, token))
    })

  return () => {
    void supabase.removeChannel(channel)
  }
}
