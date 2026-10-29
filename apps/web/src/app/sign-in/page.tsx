'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

// Restyled with the PrismOS design system in #17.
function SignIn() {
  const params = useSearchParams()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(params.get('error') ? "Sign-in didn't complete. Try again." : '')

  async function signInWithGitHub() {
    setPending(true)
    const next = params.get('next') ?? '/dashboard'
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'github',
      // login only: repo access comes from installing the GitHub App, not from this token
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (error) {
      setError("Couldn't reach GitHub. Try again.")
      setPending(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Sign in to PrismOS</h1>
        <p style={{ margin: 0, opacity: 0.7 }}>We only read your GitHub name and email. Repo access is granted separately, per repo.</p>
        <button type="button" onClick={signInWithGitHub} disabled={pending} style={{ height: 44, borderRadius: 999, cursor: 'pointer' }}>
          {pending ? 'Opening GitHub…' : 'Continue with GitHub'}
        </button>
        {error && <p role="alert" style={{ margin: 0, color: '#d9908a' }}>{error}</p>}
      </div>
    </main>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  )
}
