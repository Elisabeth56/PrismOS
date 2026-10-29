'use client'
// src/components/shared/WaitlistModal.tsx

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { joinWaitlist } from '@/lib/api'

interface WaitlistModalProps {
  open: boolean
  onClose: () => void
}

export default function WaitlistModal({ open, onClose }: WaitlistModalProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!email.includes('@')) {
      setError(true)
      return
    }
    setError(false)
    setSubmitting(true)

    const result = await joinWaitlist({ email, name: name || undefined })

    setSubmitting(false)

    if (!result.ok) {
      // Still show success in hackathon mode — backend may not be live yet
      console.warn('Waitlist API failed, showing success anyway:', result.error)
    }

    setSubmitted(true)
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setSubmitted(false)
      setEmail('')
      setName('')
      setError(false)
    }, 300)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm px-6"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-2xl p-9"
            style={{
              background: 'rgba(15,15,22,0.95)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(40px)',
              boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 80px rgba(59,130,246,0.08)',
            }}
          >
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.1] transition-all duration-200"
              aria-label="Close"
            >
              ✕
            </button>

            {!submitted ? (
              <>
                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 rounded-full px-3.5 py-1 text-[12px] font-semibold text-amber-400 mb-5">
                  ✦ Early access
                </span>
                <h3 className="font-display text-[26px] font-bold tracking-tight mb-2.5">
                  Join the waitlist
                </h3>
                <p className="text-[13px] text-white/45 leading-relaxed mb-7">
                  PrismOS is in private beta. Get early access and be the first to ship features with a full AI engineering team.
                </p>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-4 py-3.5 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-blue-500/50 transition-colors duration-200 mb-3"
                />
                <input
                  type="email"
                  placeholder="Work email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(false) }}
                  className={`w-full bg-white/[0.05] border rounded-xl px-4 py-3.5 text-[14px] text-white placeholder:text-white/30 outline-none transition-colors duration-200 mb-4 ${
                    error ? 'border-red-500/50' : 'border-white/[0.12] focus:border-blue-500/50'
                  }`}
                />
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-white text-black font-bold text-[14px] py-3.5 rounded-xl hover:opacity-88 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting…' : 'Request early access →'}
                </button>
              </>
            ) : (
              <div className="text-center py-5">
                <div className="text-[44px] mb-4">✦</div>
                <h3 className="font-display text-[22px] font-bold mb-2">You&apos;re on the list.</h3>
                <p className="text-[13px] text-white/45 leading-relaxed">
                  We&apos;ll reach out when your spot is ready. We&apos;re shipping fast.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
