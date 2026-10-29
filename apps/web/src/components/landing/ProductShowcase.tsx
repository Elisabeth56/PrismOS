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

              {/* Dashboard emulation — mirrors the real /dashboard layout (Topbar, Sidebar,
                  StatsGrid, SessionsTable) at legible sizes so it reads as an actual screenshot.
                  Swap for <Image>/<video> of the real page once Tailwind rendering is confirmed. */}
              <div className="relative aspect-[16/9] w-full">
                <div
                  className="absolute inset-0 flex flex-col"
                  style={{ background: 'linear-gradient(135deg, #0a0a10 0%, #0d0d15 50%, #08080d 100%)' }}
                >
                  {/* Topbar */}
                  <div className="flex items-center gap-4 px-4 py-2.5 border-b border-white/[0.06] flex-shrink-0">
                    <span className="font-display text-[13px] font-bold text-white">
                      Prism<span className="text-amber-400">OS</span>
                    </span>
                    <div className="w-px h-4 bg-white/[0.08]" />
                    <span className="text-[11px] font-semibold text-white/70 flex items-center gap-1.5">
                      <span className="text-amber-400">✦</span> Command Center
                    </span>
                    <div className="flex-1 max-w-[180px] mx-auto h-6 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center px-3">
                      <span className="text-[10px] text-white/25">⌕ Search runs...</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }} />
                        <span className="text-[9px] font-medium text-emerald-400">All agents online</span>
                      </div>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-black" style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}>
                        JD
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 min-h-0">
                    {/* Sidebar */}
                    <div className="w-[150px] flex-shrink-0 border-r border-white/[0.06] flex flex-col py-3 px-2.5 gap-3">
                      <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-2">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-black flex-shrink-0" style={{ background: 'linear-gradient(135deg,#f59e0b,#3b82f6)' }}>
                          F
                        </div>
                        <div className="min-w-0">
                          <div className="text-[9px] font-semibold text-white truncate">Fintech App</div>
                          <div className="text-[8px] text-white/35">14 memory entries</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {[
                          { icon: '⌂', label: 'Overview', active: true },
                          { icon: '◈', label: 'Projects', active: false },
                          { icon: '✦', label: 'Sessions', active: false },
                          { icon: '⚖', label: 'Conflicts', active: false },
                          { icon: '◇', label: 'Benchmark', active: false },
                          { icon: '⚙', label: 'Settings', active: false },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[9.5px] font-medium ${
                              item.active ? 'bg-white/[0.07] text-white' : 'text-white/40'
                            }`}
                          >
                            <span className="text-[10px] opacity-70">{item.icon}</span>
                            {item.label}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1" />
                      <div className="rounded-lg py-1.5 text-center text-[9.5px] font-bold text-black" style={{ background: '#fff' }}>
                        ✦ New run
                      </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 p-3.5 flex flex-col gap-3 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="text-[13px] font-bold text-white">Run overview</div>
                        <div className="text-[9px] text-white/35">All agent sessions · Last 30 days</div>
                      </div>

                      {/* Stat cards */}
                      <div className="grid grid-cols-4 gap-2 flex-shrink-0">
                        {[
                          { icon: '◈', v: '24', label: 'Total runs', c: '#3b82f6' },
                          { icon: '✓', v: '19', label: 'Shippable', c: '#22c55e' },
                          { icon: '⚖', v: '47', label: 'Conflicts', c: '#f59e0b' },
                          { icon: '⚡', v: '2.4m', label: 'Avg. time', c: '#8b5cf6' },
                        ].map((stat) => (
                          <div key={stat.label} className="rounded-lg bg-white/[0.03] border border-white/[0.07] px-2.5 py-2">
                            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] mb-1.5" style={{ background: `${stat.c}20`, color: stat.c }}>
                              {stat.icon}
                            </div>
                            <div className="text-[13px] font-bold text-white leading-none">{stat.v}</div>
                            <div className="text-[8.5px] text-white/35 mt-1">{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Sessions table */}
                      <div className="flex-1 rounded-lg bg-white/[0.03] border border-white/[0.07] overflow-hidden flex flex-col min-h-0">
                        <div className="grid grid-cols-[2.5fr_1fr_1fr] px-3 py-1.5 border-b border-white/[0.06] text-[8px] font-bold uppercase tracking-wide text-white/30 flex-shrink-0">
                          <div>Feature request</div>
                          <div>Verdict</div>
                          <div className="text-right">Time</div>
                        </div>
                        {[
                          { req: 'Add OTP login to a fintech app', verdict: 'SHIPPABLE', color: '#4ade80', time: '2m 18s' },
                          { req: 'Build real-time chat with WebSockets', verdict: 'SHIPPABLE', color: '#4ade80', time: '3m 04s' },
                          { req: 'Add Stripe payment integration', verdict: 'NEEDS REVISION', color: '#fbbf24', time: '4m 41s' },
                          { req: 'Implement rate limiting middleware', verdict: 'SHIPPABLE', color: '#4ade80', time: '1m 52s' },
                        ].map((row) => (
                          <div key={row.req} className="grid grid-cols-[2.5fr_1fr_1fr] px-3 py-2 border-b border-white/[0.04] last:border-0 items-center">
                            <div className="text-[9.5px] text-white/75 truncate pr-2">&quot;{row.req}&quot;</div>
                            <div>
                              <span
                                className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ color: row.color, background: `${row.color}20` }}
                              >
                                {row.verdict}
                              </span>
                            </div>
                            <div className="text-[9px] text-white/35 text-right">{row.time}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overlay gradients to blend the mockup into the frame */}
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent 65%, rgba(10,10,16,0.85) 100%)',
                  }}
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background:
                      'linear-gradient(to right, rgba(10,10,16,0.25) 0%, transparent 12%, transparent 88%, rgba(10,10,16,0.25) 100%)',
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