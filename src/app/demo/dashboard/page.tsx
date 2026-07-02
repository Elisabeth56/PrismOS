'use client'
// NEW FILE: src/app/demo/dashboard/page.tsx

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Topbar from '@/components/dashboard/Topbar'
import Sidebar from '@/components/dashboard/Sidebar'
import StatsGrid from '@/components/dashboard/StatsGrid'
import ProjectMemoryCard from '@/components/dashboard/ProjectMemoryCard'
import SessionsTable from '@/components/dashboard/SessionsTable'
import { Session } from '@/lib/types'

export default function DemoDashboardPage() {
  const router = useRouter()

  const handleOpenRun = () => {
    // Demo runs always route to the auto-playing /demo run, regardless of which row was clicked
    router.push('/demo')
  }

  const handleNewRun = () => {
    router.push('/demo')
  }

  return (
    <div className="relative h-screen flex flex-col bg-black overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute top-0 left-0 w-[500px] h-[300px]"
          style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute top-0 right-0 w-[500px] h-[300px]"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Demo banner */}
        <div className="flex items-center justify-center gap-2 bg-amber-500/[0.08] border-b border-amber-500/20 px-4 py-2 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }} />
          <span className="text-[11px] font-medium text-amber-300">
            Demo workspace — pre-loaded with sample runs. Nothing here is saved.
          </span>
        </div>

        <Topbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar onNewRun={handleNewRun} />
          <main className="flex-1 overflow-y-auto px-7 py-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between mb-6"
            >
              <div>
                <h1 className="font-display text-[22px] font-bold tracking-tight text-white">
                  Run overview
                </h1>
                <p className="text-[12px] text-white/35 mt-0.5">
                  Fintech App · 14 runs over the past 2 weeks
                </p>
              </div>
              <a
                href="/demo"
                className="bg-white text-black font-bold text-[13px] px-5 py-2.5 rounded-full hover:opacity-88 transition-all duration-200 hover:-translate-y-px"
              >
                ✦ Watch a run
              </a>
            </motion.div>

            <StatsGrid />
            <ProjectMemoryCard />
            <SessionsTable onOpenRun={handleOpenRun} />
          </main>
        </div>
      </div>
    </div>
  )
}
