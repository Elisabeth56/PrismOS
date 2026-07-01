'use client'
// src/components/landing/KickstartSection.tsx

import { motion } from 'framer-motion'

const STEPS = [
  {
    num: '01',
    title: 'Drop in your context',
    desc: 'Paste a GitHub URL, upload files, or describe your product. No setup, no account linking required.',
    bullets: [
      'Connect a public GitHub repo',
      'Upload code, schemas, or docs',
      'Or just describe what exists',
    ],
    visual: 'context',
  },
  {
    num: '02',
    title: 'Describe the feature',
    desc: 'Type the feature in plain language. Classify it as new, an enhancement, a refactor, or a fix.',
    bullets: [
      'Plain-language feature request',
      'Auto-classified by the PM agent',
      'Project memory loaded automatically',
    ],
    visual: 'request',
  },
  {
    num: '03',
    title: 'Watch the team ship it',
    desc: 'All 7 agents run in sequence. Conflicts get resolved live. You get a SHIPPABLE verdict or a clear list of what to fix.',
    bullets: [
      'Live streaming agent panels',
      'Conflict log with rationale',
      'Production code + QA verdict',
    ],
    visual: 'ship',
  },
]

export default function KickstartSection() {
  return (
    <section id="how" className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="section-eyebrow mb-6"
        >
          <span>⚡</span>
          <span>Steps to use</span>
        </motion.div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[clamp(32px,4vw,48px)] font-bold tracking-tight leading-[1.05]"
          >
            3 steps to kickstart
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[14px] text-white/45 max-w-xs leading-relaxed"
          >
            From feature request to validated code — made effortless in three steps.
          </motion.p>
        </div>

        {/* Connecting line with step numbers */}
        <div className="hidden md:flex items-center justify-between mb-10 px-2">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <span className="text-[12px] font-mono text-white/30">{s.num}</span>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-gradient-to-r from-white/15 to-white/5 mx-4" />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[280px]"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {/* Left: text content */}
              <div className="p-9 flex flex-col justify-center relative z-10">
                <h3 className="font-display text-[24px] font-bold text-white mb-3 tracking-tight leading-tight">
                  {step.title}
                </h3>
                <p className="text-[13px] text-white/40 leading-relaxed mb-6 max-w-sm">
                  {step.desc}
                </p>
                <div className="flex flex-col gap-2.5">
                  {step.bullets.map((b) => (
                    <div key={b} className="flex items-center gap-2.5 text-[13px] text-white/65">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-[9px] text-emerald-400">
                        ✓
                      </span>
                      {b}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: visual */}
              <div className="relative bg-gradient-to-br from-white/[0.02] to-transparent border-t md:border-t-0 md:border-l border-white/[0.06] flex items-center justify-center p-8 overflow-hidden">
                {step.visual === 'context' && <ContextVisual />}
                {step.visual === 'request' && <RequestVisual />}
                {step.visual === 'ship' && <ShipVisual />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContextVisual() {
  return (
    <div className="w-full max-w-[280px] flex flex-col gap-3">
      <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5">
        <span className="text-[13px]">⌥</span>
        <span className="text-[11px] text-white/50 font-mono truncate">github.com/user/fintech-app</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {['.py', '.tsx', '.sql'].map((ext) => (
          <div key={ext} className="bg-white/[0.04] border border-white/[0.08] rounded-lg py-3 flex items-center justify-center text-[10px] font-mono text-white/35">
            {ext}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }} />
        Stack detected: Next.js + FastAPI
      </div>
    </div>
  )
}

function RequestVisual() {
  return (
    <div className="w-full max-w-[280px] flex flex-col gap-3">
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-3.5">
        <div className="text-[11px] text-white/55 leading-relaxed">
          &quot;Add OTP login to the fintech app&quot;
        </div>
      </div>
      <div className="flex gap-2">
        <span className="text-[10px] bg-orange-500/15 text-orange-400 border border-orange-500/20 rounded-full px-3 py-1">
          Enhancement
        </span>
      </div>
      <div className="text-[11px] text-white/30 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
        12 memory entries loaded
      </div>
    </div>
  )
}

function ShipVisual() {
  return (
    <div className="w-full max-w-[280px] flex flex-col gap-2.5">
      {[
        { label: 'PM Agent', color: '#f97316', done: true },
        { label: 'Architect', color: '#f59e0b', done: true },
        { label: 'Engineer', color: '#3b82f6', done: true },
        { label: 'QA Agent', color: '#14b8a6', done: true },
      ].map((a) => (
        <div key={a.label} className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.color }} />
          <span className="text-[11px] text-white/55 flex-1">{a.label}</span>
          <span className="text-[9px] text-emerald-400">✓</span>
        </div>
      ))}
      <div className="mt-1 text-center text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg py-2">
        SHIPPABLE ✓
      </div>
    </div>
  )
}
