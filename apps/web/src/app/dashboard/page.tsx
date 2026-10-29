'use client'
// src/app/dashboard/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Topbar from '@/components/dashboard/Topbar'
import Sidebar from '@/components/dashboard/Sidebar'
import StatsGrid from '@/components/dashboard/StatsGrid'
import ProjectMemoryCard from '@/components/dashboard/ProjectMemoryCard'
import SessionsTable from '@/components/dashboard/SessionsTable'
import { Session } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const [, setSelectedSession] = useState<Session | null>(null)

  const handleOpenRun = (session: Session) => {
    setSelectedSession(session)
    router.push(`/run/${session.id}`)
  }

  const handleNewRun = () => {
    router.push('/run/new')
  }

  return (
    <div className="relative h-screen flex flex-col bg-black overflow-hidden">
      {/* Ambient ombient glow — same design language as landing, dialed way down */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute top-0 left-0 w-[500px] h-[300px]"
          style={{
            background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute top-0 right-0 w-[500px] h-[300px]"
          style={{
            background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full">
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
                  All agent sessions across your projects · Last 30 days
                </p>
              </div>
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
