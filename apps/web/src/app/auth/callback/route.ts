import { NextResponse } from 'next/server'

import { safeNext } from '@/lib/safe-next'
import { createClient } from '@/lib/supabase/server'

/** GitHub sends the user back here; we swap the one-time code for a session cookie. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }
  // Supabase passes GitHub's refusal along; show it rather than a bare "try again"
  const reason = searchParams.get('error_description')
  const query = new URLSearchParams({ error: 'callback', ...(reason && { reason: reason.slice(0, 200) }) })
  return NextResponse.redirect(`${origin}/sign-in?${query}`)
}
