import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/** GitHub sends the user back here; we swap the one-time code for a session cookie. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // only same-site paths, so the redirect can't be pointed at another domain
  const next = searchParams.get('next')?.startsWith('/') ? searchParams.get('next')! : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`${origin}/sign-in?error=callback`)
}
