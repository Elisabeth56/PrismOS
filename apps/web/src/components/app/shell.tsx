'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { PrismMark } from '@/components/landing/logo'

import { ButtonLink } from '@/components/ui'
import { api } from '@/lib/api'
import { PROJECTS_CHANGED } from '@/lib/projects-changed'
import { useApi } from '@/lib/use-api'

import { AccountProvider, Avatar, type Account } from './account'
import { DemoBanner } from './demo-banner'
import { WakingNotice } from './waking-notice'

/** The app frame: projects on the left, one view on the right. ⌘K starts a new run from anywhere. */
export function Shell({ account, children }: { account: Account; children: React.ReactNode }) {
  const router = useRouter()
  const path = usePathname()
  const projects = useApi(api.projects, 'projects')
  const { reload } = projects
  // the mobile menu belongs to the page it was opened on, so navigating closes it
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === path

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!account.readOnly && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        router.push('/runs/new')
      }
      if (event.key === 'Escape') setOpenOn(null)
    }
    const onProjectsChanged = () => void reload()
    window.addEventListener('keydown', onKey)
    window.addEventListener(PROJECTS_CHANGED, onProjectsChanged)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(PROJECTS_CHANGED, onProjectsChanged)
    }
  }, [router, reload, account.readOnly])

  const navItem = (active: boolean) =>
    `flex items-center justify-between gap-2 truncate rounded-[8px] px-2 py-1.5 ${
      active ? 'bg-surface-3 text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
    }`

  const sidebar = (
    <>
      <Link href="/projects" className="flex items-center gap-2.5 px-2 text-[17px] leading-6 font-semibold tracking-[-0.02em] text-ink">
        <PrismMark size={20} />
        PrismOS
      </Link>
      {!account.readOnly && (
        <ButtonLink href="/runs/new" variant="primary" className="justify-between" shortcut="⌘K">
          New run
        </ButtonLink>
      )}
      <nav aria-label="Projects" className="flex flex-col gap-1">
        <Link href="/projects" aria-current={path === '/projects' ? 'page' : undefined} className={navItem(path === '/projects')}>
          <span className="text-[12px] leading-4 font-medium tracking-[0.02em]">All projects</span>
          {projects.data && <span className="font-mono text-[12px] text-ink-3">{projects.data.length}</span>}
        </Link>
        {projects.loading && [0, 1].map((i) => <span key={i} className="mx-2 my-1.5 h-5 rounded-[6px] bg-surface-3" />)}
        {projects.data?.map((project) => {
          const href = `/projects/${project.id}`
          const active = path.startsWith(href)
          return (
            <Link key={project.id} href={href} aria-current={active ? 'page' : undefined} className={navItem(active)}>
              <span className="truncate">{project.name}</span>
              <span className="font-mono text-[12px] text-ink-3">{project.run_count}</span>
            </Link>
          )
        })}
        {!account.readOnly && (
          <ButtonLink href="/projects/new" size="sm" variant="ghost" className="mt-1 justify-start">
            + New project
          </ButtonLink>
        )}
      </nav>
      <div className="mt-auto flex flex-col gap-2">
        <Link href="/profile" aria-current={path === '/profile' ? 'page' : undefined} className={`${navItem(path === '/profile')} !justify-start`}>
          <Avatar account={account} />
          <span className="flex min-w-0 flex-col leading-4">
            <span className="truncate text-[13px] text-ink">{account.name ?? account.login}</span>
            <span className="truncate text-[12px] text-ink-3">Profile and settings</span>
          </span>
        </Link>
      </div>
    </>
  )

  return (
    <AccountProvider value={account}>
      <div className="flex min-h-dvh flex-col md:flex-row">
        <header className="flex items-center justify-between border-b border-hairline bg-surface-1 px-4 py-3 md:hidden">
          <Link href="/projects" className="flex items-center gap-2 font-semibold text-ink">
            <PrismMark size={18} /> PrismOS
          </Link>
          <button type="button" className="px-btn px-btn--sm" aria-expanded={open} onClick={() => setOpenOn(open ? null : path)}>
            {open ? 'Close' : 'Menu'}
          </button>
        </header>
        {open && <aside className="flex flex-col gap-6 bg-surface-1 px-4 pb-5 md:hidden">{sidebar}</aside>}
        <aside className="sticky top-0 hidden h-dvh w-[260px] flex-none flex-col gap-6 bg-surface-1 px-4 py-5 md:flex">
          {sidebar}
        </aside>
        <main className="min-w-0 flex-1">
          {account.readOnly && <DemoBanner />}
          <WakingNotice />
          {children}
        </main>
      </div>
    </AccountProvider>
  )
}
