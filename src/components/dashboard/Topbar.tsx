'use client'
// src/components/dashboard/Topbar.tsx

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Topbar() {
  return (
    <header
      className="relative z-20 flex items-center h-16 px-6 gap-5 border-b border-white/[0.06] flex-shrink-0"
      style={{ background: 'rgba(8,8,12,0.9)', backdropFilter: 'blur(24px)' }}
    >
      <Link href="/" className="font-display text-[16px] font-bold tracking-tight text-white whitespace-nowrap">
        Prism<span className="text-amber-400">OS</span>
      </Link>

      <div className="w-px h-5 bg-white/[0.08]" />

      <div className="flex items-center gap-2 text-[14px] font-semibold text-white whitespace-nowrap">
        <span className="text-amber-400 text-[13px]">✦</span>
        Command Center
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm mx-auto relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 text-[13px]">⌕</span>
        <input
          type="text"
          placeholder="Search runs, projects..."
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-full pl-9 pr-4 py-2 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-white/20 transition-colors duration-200"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 ml-auto">
        <motion.div
          className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
          />
          <span className="text-[11px] font-medium text-emerald-400">All agents online</span>
        </motion.div>

        <button className="relative w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all duration-200">
          <span className="text-[14px]">🔔</span>
        </button>

        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-black"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
          >
            JD
          </div>
          <div className="hidden sm:block">
            <div className="text-[12px] font-medium text-white leading-tight">James Dev</div>
            <div className="text-[10px] text-white/35 leading-tight">Anonymous session</div>
          </div>
        </div>
      </div>
    </header>
  )
}
