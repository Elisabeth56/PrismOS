import { after, NextResponse } from 'next/server'

import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

// a shared, read-only account (app_metadata.read_only): the API refuses its writes and the
// database won't let it change its own sign-in, so the credentials can be public
const DEMO_EMAIL = process.env.DEMO_EMAIL ?? 'demo@prismos.dev'
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'prismos-demo'

/** Signs the visitor into the demo account and opens its project, so reviewers don't need GitHub. */
export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  // start waking the free API host now, so it's up by the time the projects page asks it for data
  after(() => fetch(env.NEXT_PUBLIC_API_BASE_URL.replace(/\/api\/v1$/, '/health')).catch(() => undefined))
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
  if (error) {
    const query = new URLSearchParams({ error: 'demo', reason: "the demo account isn't available right now." })
    return NextResponse.redirect(`${origin}/sign-in?${query}`)
  }
  return NextResponse.redirect(`${origin}/projects`)
}
