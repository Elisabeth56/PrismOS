'use client'
// src/components/landing/AgentsSection.tsx

import { motion } from 'framer-motion'
import { AGENT_CONFIG, AGENT_ORDER } from '@/lib/constants'

export default function AgentsSection() {
  return (
    <section id="agents" className="relative py-32 px-6 bg-[#08080c] border-t border-b border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="section-eyebrow mb-6"
        >
          <span>✦</span>
          <span>The team</span>
        </motion.div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[clamp(32px,4vw,48px)] font-bold tracking-tight leading-[1.05]"
          >
            Seven agents.
            <br />
            One mission.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-[14px] text-white/45 max-w-xs leading-relaxed"
          >
            Each agent has a fixed role and the right to challenge any other agent&apos;s output before the workflow advances.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {AGENT_ORDER.map((key, i) => {
            const agent = AGENT_CONFIG[key]
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: (i % 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="relative rounded-2xl p-6 overflow-hidden group cursor-default"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: agent.hex }}
                />
                {/* hover glow */}
                <div
                  className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${agent.hex}1f 0%, transparent 70%)` }}
                  aria-hidden="true"
                />

                <div className="relative z-10">
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border mb-4 ${agent.tagColor}`}
                  >
                    {String(i).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-[16px] font-bold text-white mb-2 tracking-tight">
                    {agent.label}
                  </h3>
                  <p className="text-[12px] text-white/40 leading-relaxed mb-4 min-h-[54px]">
                    {agent.description}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {agent.outputs.map((out) => (
                      <div key={out} className="flex items-center gap-1.5 text-[11px] text-white/50">
                        <span className="text-white/25">→</span>
                        {out}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
