'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { Button } from '@/components/ui'
import { safeNext } from '@/lib/safe-next'
import { createClient } from '@/lib/supabase/client'

function SignIn() {
  const params = useSearchParams()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(params.get('error') ? "Sign-in didn't complete. Try again." : '')

  async function signInWithGitHub() {
    setPending(true)
    const next = safeNext(params.get('next'))
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'github',
      // the App's OAuth credentials back this provider, so the token can list the user's installations
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (error) {
      setError("Couldn't reach GitHub. Try again.")
      setPending(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="flex w-full max-w-[360px] flex-col gap-4">
        <h1 className="text-title-1 font-semibold">Sign in to PrismOS</h1>
        <p className="text-ink-2">
          Sign in with GitHub. PrismOS only sees the repositories you install its GitHub App on, and asks before it
          opens any pull request.
        </p>
        <Button variant="primary" size="lg" onClick={signInWithGitHub} disabled={pending}>
          {pending ? 'Opening GitHub…' : 'Continue with GitHub'}
        </Button>
        {error && (
          <p role="alert" className="text-oxblood-text">
            {error}
          </p>
        )}
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
