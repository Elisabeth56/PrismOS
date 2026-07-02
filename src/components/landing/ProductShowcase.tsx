'use client'
// src/components/landing/ProductShowcase.tsx

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function ProductShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [40, -40])

  return (
    <section ref={ref} className="relative py-0 overflow-hidden -mt-24 z-10">
      {/* Ambient glow behind showcase */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(59,130,246,0.07) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div style={{ y }} className="will-change-transform">
          {/* Outer glow ring */}
          <div
            className="relative rounded-2xl"
            style={{
              padding: '1px',
              background:
                'linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(255,255,255,0.06) 40%, rgba(59,130,246,0.20) 100%)',
              boxShadow:
                '0 0 0 1px rgba(255,255,255,0.04), 0 40px 120px rgba(0,0,0,0.7), 0 0 60px rgba(245,158,11,0.08), 0 0 100px rgba(59,130,246,0.06)',
            }}
          >
            {/* Inner glass frame */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(10,10,16,0.85)',
                backdropFilter: 'blur(32px)',
              }}
            >
              {/* Toolbar chrome */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex items-center gap-2 text-white/30 text-[12px]">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-400"
                    style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                  />
                  <span>PrismOS — Add OTP login to fintech app</span>
                </div>
                <div className="w-20" />
              </div>

              {/* Mini dashboard mockup — built from the same tokens as the real dashboard,
                  so this reads as an actual screenshot rather than a generic placeholder.
                  Swap for <Image>/<video> once a real capture exists, same aspect-ratio wrapper. */}
              <div className="relative aspect-[16/9] w-full">
                <div
                  className="absolute inset-0 flex"
                  style={{ background: 'linear-gradient(135deg, #0a0a10 0%, #0d0d15 50%, #08080d 100%)' }}
                >
                  {/* Mini sidebar */}
                  <div className="w-[15%] min-w-[86px] border-r border-white/[0.06] flex flex-col py-3 px-2 gap-3">
                    <div className="flex items-center gap-1.5 px-1">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(135deg,#f59e0b,#3b82f6)' }} />
                      <div className="h-1 w-8 rounded-full bg-white/20" />
                    </div>
                    <div className="rounded-md bg-white/[0.05] border border-white/[0.08] px-1.5 py-1.5 flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg,#f59e0b,#3b82f6)' }} />
                      <div className="h-1 w-6 rounded-full bg-white/25" />
                    </div>
                    <div className="flex flex-col gap-1.5 mt-1">
                      {[
                        { active: true, w: 60 },
                        { active: false, w: 45 },
                        { active: false, w: 50 },
                        { active: false, w: 40 },
                        { active: false, w: 55 },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-1.5 px-1.5 py-1.5 rounded-md ${item.active ? 'bg-white/[0.06]' : ''}`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-sm ${item.active ? 'bg-white/50' : 'bg-white/15'}`} />
                          <div className={`h-1 rounded-full ${item.active ? 'bg-white/35' : 'bg-white/10'}`} style={{ width: `${item.w}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex-1" />
                    <div className="rounded-md h-5" style={{ background: 'rgba(255,255,255,0.9)' }} />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 flex flex-col min-w-0">
                    {/* Mini topbar */}
                    <div className="h-8 border-b border-white/[0.06] flex items-center px-4 gap-3 flex-shrink-0">
                      <div className="h-1 w-10 rounded-full bg-white/15" />
                      <div className="flex-1 max-w-[140px] h-3.5 rounded-full bg-white/[0.05] border border-white/[0.08]" />
                      <div className="ml-auto flex items-center gap-1.5">
                        <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-400" />
                          <div className="h-1 w-8 rounded-full bg-emerald-400/40" />
                        </div>
                        <div className="w-4 h-4 rounded-full" style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }} />
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 p-4 flex flex-col gap-3 min-h-0">
                      {/* Stat cards row */}
                      <div className="grid grid-cols-4 gap-2 flex-shrink-0">
                        {[
                          { v: '24', c: '#3b82f6' },
                          { v: '19', c: '#22c55e' },
                          { v: '47', c: '#f59e0b' },
                          { v: '2.4m', c: '#8b5cf6' },
                        ].map((stat, i) => (
                          <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-2.5 py-2">
                            <div className="w-3.5 h-3.5 rounded-md mb-1.5" style={{ background: `${stat.c}25` }} />
                            <div className="text-[10px] font-bold text-white/70">{stat.v}</div>
                            <div className="h-1 w-8 rounded-full bg-white/10 mt-1" />
                          </div>
                        ))}
                      </div>

                      {/* Agent run row — the money shot */}
                      <div className="flex-1 rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 flex flex-col gap-2 min-h-0">
                        <div className="flex items-center justify-between flex-shrink-0">
                          <div className="h-1.5 w-24 rounded-full bg-white/20" />
                          <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5">
                            <span className="w-1 h-1 rounded-full bg-blue-400" style={{ animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
                            <div className="h-1 w-6 rounded-full bg-blue-400/50" />
                          </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-0">
                          {[
                            { c: '#10b981', done: true },
                            { c: '#f97316', done: true },
                            { c: '#f59e0b', done: true },
                            { c: '#f43f5e', done: true },
                            { c: '#3b82f6', done: false },
                            { c: '#14b8a6', done: false },
                            { c: '#8b5cf6', done: false },
                          ].map((agent, i) => (
                            <div
                              key={i}
                              className="rounded-md p-1.5 flex flex-col gap-1"
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderTop: `1.5px solid ${agent.c}`,
                                opacity: agent.done ? 1 : 0.4,
                              }}
                            >
                              <div className="w-1 h-1 rounded-full" style={{ background: agent.c }} />
                              {[70, 90, 50].map((w, j) => (
                                <div
                                  key={j}
                                  className="h-[3px] rounded-full"
                                  style={{
                                    width: `${w}%`,
                                    background: agent.c,
                                    opacity: agent.done ? 0.45 : 0.2,
                                    animation: agent.done ? undefined : `shimmer-line ${1.4 + i * 0.15 + j * 0.1}s ease-in-out infinite`,
                                  }}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overlay gradients to blend the mockup into the frame */}
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent 60%, rgba(10,10,16,0.9) 100%)',
                  }}
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background:
                      'linear-gradient(to right, rgba(10,10,16,0.3) 0%, transparent 15%, transparent 85%, rgba(10,10,16,0.3) 100%)',
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* Bottom bloom */}
          <div
            className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-3/4 h-24 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)',
              filter: 'blur(20px)',
            }}
            aria-hidden="true"
          />
        </motion.div>
      </div>
    </section>
  )
}