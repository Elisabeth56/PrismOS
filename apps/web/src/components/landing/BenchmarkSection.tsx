'use client'
// src/components/landing/BenchmarkSection.tsx

import { motion } from 'framer-motion'

const METRICS = [
  { label: 'Requirements surfaced', baseline: '2 issues found', prismos: '9 issues found', delta: '+7' },
  { label: 'Design conflicts resolved', baseline: '0 conflicts', prismos: '3 conflicts logged', delta: '✓' },
  { label: 'Edge cases handled', baseline: '1 edge case', prismos: '6 edge cases', delta: '+5' },
  { label: 'Frontend QA checks', baseline: 'None run', prismos: 'Responsive, a11y, UX', delta: '✓' },
  { label: 'Security flags raised', baseline: 'None', prismos: 'OTP expiry, JWT scope', delta: '✓' },
  { label: 'Delivery verdict', baseline: 'No verdict', prismos: 'SHIPPABLE', delta: '✓' },
]

export default function BenchmarkSection() {
  return (
    <section id="benchmark" className="relative py-32 px-6 overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="section-eyebrow mb-6"
        >
          <span>📊</span>
          <span>Benchmark</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[clamp(32px,4vw,48px)] font-bold tracking-tight leading-[1.05] mb-4"
        >
          Multi-agent vs single model.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-[14px] text-white/45 max-w-md leading-relaxed mb-14"
        >
          A demo without the baseline is just a chatbot with extra steps. Here&apos;s the same feature request run both ways.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Header row */}
          <div className="grid grid-cols-[2fr_1fr_1fr] border-b border-white/[0.07]">
            <div className="px-7 py-4 text-[11px] font-bold uppercase tracking-wider text-white/35">Metric</div>
            <div className="px-7 py-4 text-[11px] font-bold uppercase tracking-wider text-white/35 border-l border-white/[0.07]">
              Mode A — Single model
            </div>
            <div className="px-7 py-4 text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/[0.06] border-l border-white/[0.07]">
              Mode B — PrismOS
            </div>
          </div>

          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="grid grid-cols-[2fr_1fr_1fr] border-b border-white/[0.05] last:border-0"
            >
              <div className="px-7 py-4 text-[13px] text-white/60 flex items-center">{m.label}</div>
              <div className="px-7 py-4 text-[13px] text-white/30 border-l border-white/[0.05] flex items-center">
                {m.baseline}
              </div>
              <div className="px-7 py-4 text-[13px] text-white font-medium border-l border-white/[0.05] bg-blue-500/[0.03] flex items-center gap-2">
                {m.prismos}
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                  {m.delta}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
