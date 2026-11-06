import type { Metadata } from 'next'

import { RunFixtures } from './fixtures-view'

export const metadata: Metadata = { title: 'Run views', robots: { index: false } }

/** The run page with fixture data, to check its layouts without a signed-in session. */
export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams
  return <RunFixtures initial={state === 'review' ? 'review' : 'live'} />
}
