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

              {/* Image/video placeholder */}
              <div className="relative aspect-[16/9] w-full">
                {/* Replace this div with <Image> or <video> when ready */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                  style={{
                    background:
                      'linear-gradient(135deg, #0a0a14 0%, #0d0d1a 50%, #080810 100%)',
                  }}
                >
                  {/* Placeholder agent panel preview */}
                  <div className="w-full h-full p-5 grid grid-cols-7 gap-2 opacity-60">
                    {[
                      { label: 'Context', color: '#10b981' },
                      { label: 'PM', color: '#f97316' },
                      { label: 'Architect', color: '#f59e0b' },
                      { label: 'UX', color: '#f43f5e' },
                      { label: 'Engineer', color: '#3b82f6' },
                      { label: 'QA', color: '#14b8a6' },
                      { label: 'Release', color: '#8b5cf6' },
                    ].map((agent, i) => (
                      <div
                        key={agent.label}
                        className="rounded-xl border border-white/[0.06] p-3 flex flex-col gap-2"
                        style={{
                          background: 'rgba(255,255,255,0.025)',
                          borderTopColor: agent.color,
                          borderTopWidth: 2,
                        }}
                      >
                        <div className="text-[9px] font-bold" style={{ color: agent.color }}>
                          {agent.label}
                        </div>
                        {[80, 60, 90, 50, 70].map((w, j) => (
                          <div
                            key={j}
                            className="h-1 rounded-full"
                            style={{
                              width: `${w}%`,
                              background: agent.color,
                              opacity: 0.3,
                              animation: `shimmer-line ${1.5 + i * 0.2 + j * 0.1}s ease-in-out infinite`,
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Placeholder text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-white/20 text-[13px] font-medium mb-1">
                        Product screenshot / screen recording
                      </div>
                      <div className="text-white/10 text-[11px]">
                        Replace placeholder div with {'<Image>'} or {'<video>'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overlay gradients to blend image into frame */}
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
