import 'server-only'

import { cookies } from 'next/headers'

// The user's GitHub token proves which installations they can reach (ADR-001). Supabase hands it over
// once, at sign-in, and drops it from the session when the session refreshes. So the callback keeps it
// in an httpOnly cookie: the browser's scripts never see it, and only these server routes forward it.
export const GITHUB_TOKEN_COOKIE = 'prismos_gh'
const EIGHT_HOURS = 8 * 60 * 60 // GitHub App user tokens expire after 8 hours

export async function rememberGitHubToken(token: string) {
  ;(await cookies()).set(GITHUB_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/github',
    maxAge: EIGHT_HOURS,
  })
}

export async function readGitHubToken() {
  return (await cookies()).get(GITHUB_TOKEN_COOKIE)?.value
}
