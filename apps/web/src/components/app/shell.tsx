'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { PrismMark } from '@/components/landing/logo'
import { Kbd, ThemeToggle } from '@/components/ui'
import { api } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import { useApi } from '@/lib/use-api'

/** The app frame: projects on the left, one view on the right. ⌘K starts a new run from anywhere. */
export function Shell({ login, children }: { login: string; children: React.ReactNode }) {
  const router = useRouter()
  const path = usePathname()
  const projects = useApi(api.projects, 'projects')
  // the mobile menu belongs to the page it was opened on, so navigating closes it
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === path

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        router.push('/runs/new')
      }
      if (event.key === 'Escape') setOpenOn(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])

  async function signOut() {
    await createClient().auth.signOut()
    router.push('/')
  }

  const sidebar = (
    <>
      <Link href="/runs/new" className="flex items-center gap-2.5 px-2 text-[17px] leading-6 font-semibold tracking-[-0.02em] text-ink">
        <PrismMark size={20} />
        PrismOS
      </Link>
      <Link href="/runs/new" className="px-btn justify-between">
        New run <Kbd>⌘K</Kbd>
      </Link>
      <nav aria-label="Projects" className="flex flex-col gap-1">
        <span className="px-2 text-[12px] leading-4 font-medium tracking-[0.02em] text-ink-3">Projects</span>
        {projects.loading && [0, 1].map((i) => <span key={i} className="mx-2 my-1.5 h-5 rounded-[6px] bg-surface-3" />)}
        {projects.data?.map((project) => {
          const href = `/projects/${project.id}`
          const active = path.startsWith(href)
          return (
            <Link
              key={project.id}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`truncate rounded-[8px] p-2 ${active ? 'bg-surface-3 text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'}`}
            >
              {project.name}
            </Link>
          )
        })}
        <Link href="/projects/connect" className="p-2 text-[12px] text-ink-3 hover:text-ink">
          Add a repo
        </Link>
      </nav>
      <div className="mt-auto flex items-center justify-between gap-2 px-2 text-[12px] leading-[18px] text-ink-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-6 flex-none items-center justify-center rounded-full bg-surface-3 text-[11px] font-medium text-ink uppercase">
            {login.slice(0, 2)}
          </span>
          <span className="truncate">{login}</span>
        </span>
        <button type="button" onClick={signOut} className="text-ink-3 hover:text-ink">
          Sign out
        </button>
      </div>
      <div className="px-1">
        <ThemeToggle />
      </div>
    </>
  )

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <header className="flex items-center justify-between border-b border-hairline bg-surface-1 px-4 py-3 md:hidden">
        <Link href="/runs/new" className="flex items-center gap-2 font-semibold text-ink">
          <PrismMark size={18} /> PrismOS
        </Link>
        <button type="button" className="px-btn px-btn--sm" aria-expanded={open} onClick={() => setOpenOn(open ? null : path)}>
          {open ? 'Close' : 'Menu'}
        </button>
      </header>
      {open && <aside className="flex flex-col gap-6 bg-surface-1 px-4 pb-5 md:hidden">{sidebar}</aside>}
      <aside className="sticky top-0 hidden h-dvh w-[260px] flex-none flex-col gap-6 bg-surface-1 px-4 py-5 md:flex">{sidebar}</aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
