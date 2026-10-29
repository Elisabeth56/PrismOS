'use client'
// src/components/landing/FinalCTASection.tsx

import { motion } from 'framer-motion'

interface FinalCTASectionProps {
  onWaitlist: () => void
}

export default function FinalCTASection({ onWaitlist }: FinalCTASectionProps) {
  return (
    <section className="relative pt-32 pb-0 px-6 overflow-hidden border-t border-white/[0.06]">
      {/* Mini hero-style background — reused design language, scaled down */}
      <div className="absolute inset-0 bg-black z-0" />
      <div
        className="absolute z-[1] pointer-events-none"
        style={{
          bottom: '-10%',
          left: '10%',
          width: '40%',
          height: '60%',
          background: 'radial-gradient(ellipse at 30% 100%, rgba(245,158,11,0.16) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'aurora-drift-slow 16s ease-in-out infinite',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute z-[1] pointer-events-none"
        style={{
          bottom: '-10%',
          right: '10%',
          width: '40%',
          height: '60%',
          background: 'radial-gradient(ellipse at 70% 100%, rgba(59,130,246,0.14) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'aurora-drift-slow 20s ease-in-out infinite reverse',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center mb-20">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[clamp(34px,5vw,60px)] font-bold tracking-tight leading-[1.05] mb-5"
        >
          The future of intelligent
          <br />
          software delivery.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-[15px] text-white/45 mb-9"
        >
          Stop prompting a single model. Start working with a team.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onClick={onWaitlist}
          className="bg-white text-black font-semibold text-[15px] px-9 py-4 rounded-full hover:opacity-88 transition-all duration-200 hover:-translate-y-0.5"
        >
          Join the waitlist →
        </motion.button>
      </div>

      {/* Oversized wordmark */}
      <div className="relative z-10 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-center font-extrabold leading-[0.8] select-none"
          style={{
            fontSize: 'clamp(56px, 11vw, 150px)',
            letterSpacing: '-0.03em',
            background:
              'linear-gradient(90deg, #c97c1a 0%, #f0c040 20%, #ffffff 45%, #93c5fd 68%, #6366f1 88%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            paddingTop: '12px',
          }}
        >
          PrismOS
        </motion.div>
      </div>
    </section>
  )
}
