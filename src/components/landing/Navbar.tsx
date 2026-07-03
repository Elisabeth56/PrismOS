'use client'
// REPLACES: src/components/landing/Navbar.tsx

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { NAV_LINKS } from '@/lib/constants'

interface NavbarProps {
  onWaitlist: () => void
}

export default function Navbar({ onWaitlist }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 transition-all duration-500 ${
        scrolled
          ? 'bg-black/70 backdrop-blur-2xl border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      {/* Logo */}
      <Link href="/" className="font-display text-xl font-bold tracking-tight text-white">
        Prism<span className="text-amber-400">OS</span>
      </Link>

      {/* Desktop nav links - pill container */}
      <div className="hidden md:flex items-center gap-1 bg-white/[0.05] border border-white/[0.08] rounded-full px-2 py-1.5">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[13px] font-medium text-white/60 hover:text-white px-4 py-1.5 rounded-full transition-all duration-200 hover:bg-white/[0.07]"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/demo"
          className="text-[13px] font-medium text-white/60 hover:text-white px-4 py-1.5 rounded-full transition-all duration-200 hover:bg-white/[0.07]"
        >
          Demo
        </Link>
        <Link
          href="/dashboard"
          className="text-[13px] font-medium text-white/60 hover:text-white px-4 py-1.5 rounded-full transition-all duration-200 hover:bg-white/[0.07]"
        >
          Dashboard
        </Link>
      </div>

      {/* CTA */}
      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={onWaitlist}
          className="text-[13px] font-semibold bg-white text-black px-5 py-2 rounded-full hover:opacity-85 transition-all duration-200 hover:-translate-y-px active:translate-y-0"
        >
          Start building
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden flex flex-col gap-1.5 p-2"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span className={`block w-5 h-px bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-5 h-px bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
        <span className={`block w-5 h-px bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-2xl border-b border-white/[0.06] flex flex-col px-6 py-4 gap-1 md:hidden"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[15px] text-white/70 hover:text-white py-3 border-b border-white/[0.06] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/demo"
              className="text-[15px] text-white/70 hover:text-white py-3 border-b border-white/[0.06] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Demo
            </Link>
            <Link
              href="/dashboard"
              className="text-[15px] text-white/70 hover:text-white py-3 border-b border-white/[0.06] last:border-0 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
            <button
              onClick={() => { setMenuOpen(false); onWaitlist() }}
              className="mt-3 text-[14px] font-semibold bg-white text-black px-5 py-2.5 rounded-full"
            >
              Start building
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
