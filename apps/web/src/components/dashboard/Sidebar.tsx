'use client'
// src/components/dashboard/Sidebar.tsx

import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { icon: '⌂', label: 'Overview', href: '/dashboard' },
  { icon: '◈', label: 'Projects', href: '/projects' },
  { icon: '✦', label: 'Sessions', href: '/sessions' },
  { icon: '⚖', label: 'Conflicts', href: '/conflicts' },
  { icon: '◇', label: 'Benchmark', href: '/benchmark' },
  { icon: '⚙', label: 'Settings', href: '/settings' },
]

interface SidebarProps {
  onNewRun: () => void
}

export default function Sidebar({ onNewRun }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside
      className="w-[228px] flex-shrink-0 flex flex-col border-r border-white/[0.06] py-5"
      style={{ background: 'rgba(8,8,12,0.6)', backdropFilter: 'blur(20px)' }}
    >
      {/* Current project indicator */}
      <div className="px-4 mb-5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2 px-1">
          Active project
        </div>
        <button
          onClick={() => router.push('/projects')}
          className="w-full flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 hover:bg-white/[0.06] transition-colors duration-200 group"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold text-black flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #3b82f6)' }}
          >
            F
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-[12px] font-semibold text-white truncate">Fintech App</div>
            <div className="text-[10px] text-white/35">14 memory entries</div>
          </div>
          <span className="text-white/25 text-[11px] group-hover:text-white/50 transition-colors">⌄</span>
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href

          return (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                e.preventDefault()
                router.push(item.href)
              }}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                isActive ? 'text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-white/[0.07] border border-white/[0.08]"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className={`relative z-10 text-[14px] ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                {item.icon}
              </span>
              <span className="relative z-10">{item.label}</span>
            </a>
          )
        })}
      </nav>

      <div className="flex-1" />

      <div className="px-3">
        <button
          onClick={onNewRun}
          className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold text-[13px] py-2.5 rounded-xl hover:opacity-88 transition-all duration-200 hover:-translate-y-px"
        >
          <span>✦</span> New run
        </button>
      </div>
    </aside>
  )
}
