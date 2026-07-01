'use client'
// src/components/landing/HeroSection.tsx

import { useEffect, useRef } from 'react'
import { motion, Variants } from 'framer-motion'

interface HeroSectionProps {
  onWaitlist: () => void
}

// Minimal canvas particle system — lightweight, no deps
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    const particles: { x: number; y: number; vx: number; vy: number; alpha: number; size: number }[] = []
    const W = () => canvas.width
    const H = () => canvas.height

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Seed particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -Math.random() * 0.25 - 0.05,
        alpha: Math.random() * 0.5 + 0.1,
        size: Math.random() * 1.2 + 0.3,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, W(), H())
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.alpha -= 0.0008
        if (p.alpha <= 0 || p.y < -10) {
          p.x = Math.random() * W()
          p.y = H() + 10
          p.alpha = Math.random() * 0.4 + 0.1
          p.vy = -Math.random() * 0.25 - 0.05
          p.vx = (Math.random() - 0.5) * 0.15
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[1]"
      aria-hidden="true"
    />
  )
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 },
  }),
}

export default function HeroSection({ onWaitlist }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* ── Deep black base ── */}
      <div className="absolute inset-0 bg-black z-0" />

      {/* ── Aurora layer 1 — orange bloom from bottom-left ── */}
      <div
        className="absolute z-[2] pointer-events-none"
        style={{
          bottom: '-10%',
          left: '-5%',
          width: '55%',
          height: '70%',
          background:
            'radial-gradient(ellipse at 30% 80%, rgba(245,158,11,0.22) 0%, rgba(249,115,22,0.12) 35%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'aurora-drift-slow 14s ease-in-out infinite',
        }}
        aria-hidden="true"
      />

      {/* ── Aurora layer 2 — blue/indigo from bottom-right ── */}
      <div
        className="absolute z-[2] pointer-events-none"
        style={{
          bottom: '-15%',
          right: '-10%',
          width: '60%',
          height: '75%',
          background:
            'radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.20) 0%, rgba(99,102,241,0.10) 40%, transparent 70%)',
          filter: 'blur(70px)',
          animation: 'aurora-drift-slow 18s ease-in-out infinite reverse',
        }}
        aria-hidden="true"
      />

      {/* ── Aurora layer 3 — central vertical column ── */}
      <div
        className="absolute z-[2] pointer-events-none"
        style={{
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40%',
          height: '65%',
          background:
            'linear-gradient(to top, rgba(245,158,11,0.15) 0%, rgba(139,92,246,0.08) 40%, transparent 100%)',
          filter: 'blur(50px)',
          animation: 'aurora-drift 10s ease-in-out infinite',
        }}
        aria-hidden="true"
      />

      {/* ── Planet horizon arc ── */}
      <div
        className="absolute z-[3] pointer-events-none"
        style={{
          bottom: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(1100px, 120vw)',
          height: '440px',
          borderRadius: '50%',
          border: '1px solid rgba(245,158,11,0.18)',
          boxShadow:
            '0 -24px 80px rgba(245,158,11,0.08), 0 -4px 30px rgba(99,102,241,0.10), inset 0 40px 80px rgba(0,0,0,0.5)',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* ── Particles ── */}
      <ParticleCanvas />

      {/* ── Radial vignette ── */}
      <div
        className="absolute inset-0 z-[4] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, transparent 0%, rgba(0,0,0,0.7) 100%)',
        }}
        aria-hidden="true"
      />

      {/* ── Hero content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto pt-28 pb-16">
        {/* Badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2.5 bg-white/[0.06] border border-white/[0.10] rounded-full px-4 py-1.5 mb-8"
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-amber-400"
            style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
          />
          <span className="text-[12px] font-medium text-white/70 tracking-wide">
            Built for Qwen Cloud Hackathon · Track 3: Agent Society
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="font-display text-[clamp(42px,7.5vw,96px)] font-bold leading-[0.95] tracking-[-2.5px] text-white mb-6"
        >
          Ship features with
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ffffff 45%, #93c5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            a full AI team.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-[17px] text-white/50 max-w-[520px] leading-relaxed mb-10"
        >
          Seven specialized agents — from Context Analyst to Release Manager — coordinate in real time to turn any feature request into production-ready code.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <button
            onClick={onWaitlist}
            className="group relative bg-white text-black font-semibold text-[14px] px-8 py-3.5 rounded-full hover:opacity-88 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            Start building →
          </button>
          <a
            href="#benchmark"
            className="text-[14px] font-medium text-white/50 border border-white/[0.12] px-8 py-3.5 rounded-full hover:text-white hover:border-white/25 transition-all duration-200"
          >
            See the benchmark
          </a>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="mt-16 flex flex-col items-center gap-2 text-white/20"
        >
          <span className="text-[11px] tracking-widest uppercase font-medium">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>
      </div>
    </section>
  )
}
