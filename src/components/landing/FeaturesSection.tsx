'use client'
// src/components/landing/FeaturesSection.tsx

import { useState } from 'react'
import { motion } from 'framer-motion'

const FEATURES = [
  {
    key: 'usage',
    tabLabel: 'Usage',
    tabIcon: '▤',
    tag: '✦ Live streaming',
    title: 'Watch every agent think in real time',
    desc: 'Each of the 7 agents streams its output token-by-token into its own panel. You see the debate as it happens — not a spinner and a final answer.',
    pills: [
      { label: 'Context Analyst maps repo', color: '#10b981' },
      { label: 'Engineer pushes back', color: '#3b82f6' },
      { label: 'Release Manager resolves', color: '#8b5cf6' },
    ],
  },
  {
    key: 'technology',
    tabLabel: 'Technology',
    tabIcon: '◇',
    tag: '⚖ Conflict resolution',
    title: 'Disagreement is the system working',
    desc: 'Agents are designed to conflict. The Release Manager reads every position, applies tradeoff logic, and issues a binding decision with a logged rationale.',
    pills: [
      { label: 'SMS vs email OTP', color: '#f59e0b' },
      { label: 'JWT vs sessions', color: '#3b82f6' },
      { label: 'OTP expiry window', color: '#f43f5e' },
    ],
  },
  {
    key: 'data',
    tabLabel: 'Data',
    tabIcon: '◈',
    tag: '📦 Final package',
    title: 'Code, UX spec, tests — and a verdict',
    desc: 'Every run delivers a complete package: production code with file paths, a full UX spec, a QA test report, and an explicit SHIPPABLE or NEEDS REVISION verdict.',
    pills: [
      { label: 'Runnable code', color: '#22c55e' },
      { label: 'UX interaction spec', color: '#22c55e' },
      { label: 'Ship verdict', color: '#22c55e' },
    ],
  },
]

export default function FeaturesSection() {
  const [active, setActive] = useState(0)

  return (
    <section id="features" className="relative py-32 px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="section-eyebrow mb-6"
        >
          <span>◈</span>
          <span>Features</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-16 items-start">
          {/* Left sticky column */}
          <div className="lg:sticky lg:top-32">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-[clamp(30px,3.2vw,44px)] font-bold tracking-tight leading-[1.05] mb-4"
            >
              Built for real delivery.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-[14px] text-white/45 leading-relaxed mb-8"
            >
              Every feature is designed around one goal: getting from request to shippable code, faster, without losing context of what already exists.
            </motion.p>

            <div className="flex flex-col gap-1">
              {FEATURES.map((f, i) => (
                <button
                  key={f.key}
                  onClick={() => setActive(i)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-[14px] font-medium transition-all duration-200 border-b-2 ${
                    active === i
                      ? 'text-white border-blue-500'
                      : 'text-white/35 border-transparent hover:text-white/60'
                  }`}
                >
                  <span className={`text-[15px] ${active === i ? 'opacity-100' : 'opacity-40'}`}>
                    {f.tabIcon}
                  </span>
                  {f.tabLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Right cards — scroll-triggered slide-in */}
          <div className="flex flex-col gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.key}
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-120px' }}
                transition={{ duration: 0.75, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                onViewportEnter={() => setActive(i)}
                className="relative rounded-2xl p-8 overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* subtle glow accent */}
                <div
                  className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${f.pills[0].color}15 0%, transparent 70%)`,
                  }}
                  aria-hidden="true"
                />

                <div className="relative z-10">
                  <span className="inline-flex items-center gap-2 text-[12px] text-white/55 border border-white/[0.1] rounded-full px-3.5 py-1 mb-5">
                    {f.tag}
                  </span>
                  <h3 className="font-display text-[22px] font-bold text-white mb-2.5 tracking-tight">
                    {f.title}
                  </h3>
                  <p className="text-[14px] text-white/45 leading-relaxed mb-6 max-w-lg">
                    {f.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {f.pills.map((pill) => (
                      <span
                        key={pill.label}
                        className="inline-flex items-center gap-2 text-[12px] text-white/60 bg-white/[0.04] border border-white/[0.07] rounded-full px-3.5 py-1.5"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: pill.color }}
                        />
                        {pill.label}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
