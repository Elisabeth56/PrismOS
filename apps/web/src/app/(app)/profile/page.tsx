'use client'

import { useRouter } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'

import { Avatar, useAccount } from '@/components/app/account'
import { Button, ButtonLink } from '@/components/ui'
import { api } from '@/lib/api'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/client'
import { applyTheme, THEME_KEY, type ThemeChoice } from '@/lib/theme'
import { useApi } from '@/lib/use-api'

const THEMES: [ThemeChoice, string][] = [
  ['system', 'Match system'],
  ['dark', 'Dark'],
  ['light', 'Light'],
]

const listeners = new Set<() => void>()
function readTheme(): ThemeChoice {
  try {
    return (localStorage.getItem(THEME_KEY) as ThemeChoice) || 'system'
  } catch {
    return 'system'
  }
}

export default function Profile() {
  const account = useAccount()
  const router = useRouter()
  const projects = useApi(api.projects, 'projects')
  const theme = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    readTheme,
    () => 'system' as ThemeChoice,
  )
  const [signingOut, setSigningOut] = useState(false)

  const owned = projects.data?.filter((p) => p.role === 'owner').length ?? 0
  const runs = projects.data?.reduce((sum, p) => sum + p.run_count, 0) ?? 0

  async function signOut() {
    setSigningOut(true)
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex max-w-[760px] flex-col gap-6 px-4 py-8 sm:px-8">
      <h1 className="text-title-1 font-semibold">Profile</h1>

      <section className="flex flex-wrap items-center gap-5 rounded-[16px] bg-surface-1 p-6">
        <Avatar account={account} size={64} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-title-3 font-medium">{account.name ?? account.login}</span>
          <span className="truncate text-ink-2">
            @{account.login}
            {account.email && ` · ${account.email}`}
          </span>
          <span className="text-[12px] text-ink-3">
            Member since {new Date(account.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <a href={`https://github.com/${account.login}`} className="px-btn" target="_blank" rel="noreferrer">
          GitHub profile
        </a>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {[
          ['Projects', projects.data?.length],
          ['You own', projects.data ? owned : undefined],
          ['Runs', projects.data ? runs : undefined],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 rounded-[16px] bg-surface-1 p-4">
            <span className="text-[12px] text-ink-3">{label}</span>
            <span className="font-mono text-title-2 font-semibold">{value ?? '–'}</span>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4 rounded-[16px] bg-surface-1 p-6">
        <h2 className="text-title-3 font-medium">Appearance</h2>
        <div role="radiogroup" aria-label="Theme" className="inline-flex flex-wrap gap-1 self-start rounded-full bg-surface-2 p-1">
          {THEMES.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={theme === value}
              onClick={() => {
                applyTheme(value)
                listeners.forEach((listener) => listener())
              }}
              className={`h-8 rounded-full px-3.5 text-[13px] font-medium ${theme === value ? 'bg-surface-3 text-ink' : 'text-ink-2 hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-[16px] bg-surface-1 p-6">
        <h2 className="text-title-3 font-medium">GitHub access</h2>
        <p className="text-ink-2">
          PrismOS only sees the repositories you install its GitHub App on. Add or remove repositories, or uninstall it,
          from GitHub.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://github.com/apps/${env.NEXT_PUBLIC_GITHUB_APP_SLUG}/installations/new`}
            className="px-btn"
            target="_blank"
            rel="noreferrer"
          >
            Manage repositories
          </a>
          {!account.readOnly && <ButtonLink href="/projects/new">New project</ButtonLink>}
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] bg-surface-1 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-title-3 font-medium">Sign out</h2>
          <p className="text-ink-2">Runs keep going after you sign out.</p>
        </div>
        <Button onClick={signOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </section>
    </div>
  )
}
