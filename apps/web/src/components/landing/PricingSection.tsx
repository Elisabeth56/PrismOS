'use client'
// src/components/landing/PricingSection.tsx

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PRICING_TIERS } from '@/lib/constants'

interface PricingSectionProps {
  onWaitlist: () => void
}

export default function PricingSection({ onWaitlist }: PricingSectionProps) {
  const [yearly, setYearly] = useState(false)

  return (
    <section id="pricing" className="relative py-32 px-6 bg-[#08080c] border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="section-eyebrow mb-6"
        >
          <span>◇</span>
          <span>Pricing</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[clamp(32px,4vw,48px)] font-bold tracking-tight leading-[1.05] mb-10"
        >
          Simple pricing. Full team.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center bg-white/[0.05] border border-white/[0.08] rounded-full p-1 mb-12"
        >
          <button
            onClick={() => setYearly(false)}
            className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
              !yearly ? 'bg-white text-black' : 'text-white/40'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
              yearly ? 'bg-white text-black' : 'text-white/40'
            }`}
          >
            Yearly <span className="text-amber-400 font-semibold ml-1">30% off</span>
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {PRICING_TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`relative rounded-2xl p-9 flex flex-col overflow-hidden ${
                tier.featured ? 'lg:scale-[1.02]' : ''
              }`}
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: tier.featured ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.07)',
                boxShadow: tier.featured
                  ? '0 0 60px rgba(59,130,246,0.1), inset 0 0 60px rgba(59,130,246,0.02)'
                  : 'none',
              }}
            >
              {tier.featured && (
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
              )}

              <div className="text-[19px] font-bold text-white mb-1.5">{tier.name}</div>
              <div className="text-[13px] text-white/40 mb-7 leading-relaxed">{tier.description}</div>

              <div className="mb-7">
                {tier.price ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-[48px] font-bold tracking-tight text-white">
                      ${yearly ? tier.price.yearly : tier.price.monthly}
                    </span>
                    <span className="text-[13px] text-white/35">/month</span>
                  </div>
                ) : (
                  <div className="font-display text-[34px] font-bold tracking-tight text-white">
                    HyperSonic
                  </div>
                )}
              </div>

              <button
                onClick={onWaitlist}
                className={`text-center w-full py-3 rounded-full text-[14px] font-semibold mb-7 transition-all duration-200 hover:-translate-y-px ${
                  tier.featured
                    ? 'bg-white text-black hover:opacity-88'
                    : 'bg-white/[0.07] text-white border border-white/[0.12] hover:bg-white/[0.1]'
                }`}
              >
                {tier.cta} →
              </button>

              <div className="h-px bg-white/[0.07] mb-6" />

              <div className="flex flex-col gap-3 flex-1">
                {tier.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5 text-[13px] text-white/55">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-[9px] text-emerald-400">
                      ✓
                    </span>
                    {feat}
                  </div>
                ))}
              </div>

              {tier.socialProof && (
                <div className="mt-7 pt-5 border-t border-white/[0.06] text-[12px] text-white/30 text-center">
                  {tier.socialProof}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
