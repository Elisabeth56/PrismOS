'use client'
// NEW FILE: src/components/shared/DemoVideoModal.tsx

import { motion, AnimatePresence } from 'framer-motion'

interface DemoVideoModalProps {
  open: boolean
  onClose: () => void
  videoUrl?: string // YouTube/Loom embed URL — replace when video is recorded
}

export default function DemoVideoModal({ open, onClose, videoUrl }: DemoVideoModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm px-6"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden"
            style={{
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 80px rgba(59,130,246,0.1)',
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 border border-white/[0.15] flex items-center justify-center text-white/60 hover:text-white hover:bg-black/80 transition-all duration-200"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="relative aspect-video bg-black">
              {videoUrl ? (
                <iframe
                  src={videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                // Placeholder until demo video is recorded
                <div className="w-full h-full flex flex-col items-center justify-center gap-4"
                  style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0d0d1a 50%, #080810 100%)' }}>
                  <div className="w-16 h-16 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-[22px]">
                    ▶
                  </div>
                  <div className="text-center">
                    <div className="text-white/40 text-[14px] font-medium mb-1">Demo video coming soon</div>
                    <div className="text-white/20 text-[12px]">
                      Pass a videoUrl prop once the walkthrough is recorded
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
