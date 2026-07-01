'use client'
// src/components/landing/LogoStrip.tsx

import { motion } from 'framer-motion'

const LOGOS = ['Vertex', 'Northbeam', 'Quanta', 'Ledgerly', 'Forge', 'Hyperline']

export default function LogoStrip() {
  return (
    <section className="relative py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center text-[12px] tracking-widest uppercase text-white/25 font-medium mb-10"
        >
          Built on infrastructure trusted by
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6"
        >
          {LOGOS.map((logo) => (
            <span
              key={logo}
              className="font-display text-[19px] font-bold text-white/15 hover:text-white/35 transition-colors duration-300 tracking-tight cursor-default"
            >
              {logo}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
