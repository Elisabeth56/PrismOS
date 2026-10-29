'use client'
// REPLACES: src/components/landing/HeroSection.tsx

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface HeroSectionProps {
  onWaitlist: () => void
  onWatchDemo: () => void
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

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: i * 0.12 },
  }),
}

export default function HeroSection({ onWaitlist, onWatchDemo }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* ── Deep black base ── */}
      <div className="absolute inset-0 bg-black z-0" />

      {/* ── Fine dot grid — technical, "operating system" texture, fades toward edges ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 75%)',
        }}
        aria-hidden="true"
      />

      {/* ── Soft glow orb — amber, upper-left, slow drift ── */}
      <div
        className="absolute z-[2] pointer-events-none"
        style={{
          top: '8%',
          left: '12%',
          width: '420px',
          height: '420px',
          background: 'radial-gradient(circle, rgba(245,158,11,0.16) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'orb-drift-a 16s ease-in-out infinite',
        }}
        aria-hidden="true"
      />

      {/* ── Soft glow orb — blue, lower-right, slow drift ── */}
      <div
        className="absolute z-[2] pointer-events-none"
        style={{
          bottom: '5%',
          right: '10%',
          width: '460px',
          height: '460px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)',
          filter: 'blur(55px)',
          animation: 'orb-drift-b 20s ease-in-out infinite',
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
            'radial-gradient(ellipse 90% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%)',
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

        {/* CTAs — Watch Demo / Try Live Demo / Start building */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <a
            href="/demo"
            className="bg-white text-black font-semibold text-[14px] px-8 py-3.5 rounded-full hover:opacity-88 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            Try live demo →
          </a>
          <button
            onClick={onWatchDemo}
            className="flex items-center gap-2 text-[14px] font-medium text-white/70 border border-white/[0.14] px-8 py-3.5 rounded-full hover:text-white hover:border-white/25 transition-all duration-200"
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px]">▶</span>
            Watch demo
          </button>
        </motion.div>

        <motion.button
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          onClick={onWaitlist}
          className="mt-4 text-[12px] text-white/35 hover:text-white/60 underline underline-offset-4 decoration-white/20 transition-colors duration-200"
        >
          or join the waitlist for early access
        </motion.button>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="mt-12 flex flex-col items-center gap-2 text-white/20"
        >
          <span className="text-[11px] tracking-widest uppercase font-medium">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>
      </div>
    </section>
  )
}
