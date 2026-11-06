import 'server-only'

import { NextResponse } from 'next/server'

import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

import { readGitHubToken } from './token'

const error = (status: number, code: string, message: string) =>
  NextResponse.json({ error: { code, message, details: {} } }, { status })

/** Sends a request to the API with the user's session and their GitHub token, both read on the server. */
export async function forwardWithGitHubToken(path: string, init: RequestInit = {}) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return error(401, 'not_signed_in', 'Sign in to continue.')
  const token = await readGitHubToken()
  if (!token) {
    return error(400, 'github_token_missing', 'Your GitHub sign-in has expired. Sign in again to see your repositories.')
  }

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'X-GitHub-Token': token,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    return new NextResponse(response.body, { status: response.status, headers: { 'Content-Type': 'application/json' } })
  } catch {
    return error(502, 'api_unreachable', "Can't reach the PrismOS server. It may be waking up; try again in a moment.")
  }
}
