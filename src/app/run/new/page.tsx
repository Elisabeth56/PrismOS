'use client'
// src/app/run/new/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ContextInputPanel from '@/components/run/ContextInputPanel'
import FeatureClassificationSelect from '@/components/run/FeatureClassificationSelect'
import { ContextInput, FeatureClassification } from '@/lib/types'
import { createRun } from '@/lib/api'

export default function NewRunPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [context, setContext] = useState<ContextInput>({})
  const [featureRequest, setFeatureRequest] = useState('')
  const [classification, setClassification] = useState<FeatureClassification | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = featureRequest.trim().length > 0 && classification !== null

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)

    const result = await createRun({
      feature_request: featureRequest,
      feature_classification: classification!,
      context_inputs: context,
    })

    // Use the real session id from the API
    if (!result.ok) {
      alert(`Failed to start run: ${result.error}`)
      setSubmitting(false)
      return
    }
    const sessionId = result.data.session_id
    router.push(`/run/${sessionId}?request=${encodeURIComponent(featureRequest)}&class=${classification}`)
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Ambient bg */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div
          className="absolute top-0 right-1/4 w-[500px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <a href="/dashboard" className="font-display text-[16px] font-bold tracking-tight text-white">
            Prism<span className="text-amber-400">OS</span>
          </a>
          <a href="/dashboard" className="text-[12px] text-white/35 hover:text-white/60 transition-colors">
            ← Back to dashboard
          </a>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-10">
          <StepDot active={step >= 1} done={step > 1} num={1} />
          <div className="flex-1 h-px bg-white/[0.08] relative overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-blue-500"
              initial={{ width: '0%' }}
              animate={{ width: step > 1 ? '100%' : '0%' }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <StepDot active={step >= 2} done={false} num={2} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-7">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
                  Step 1 of 2
                </span>
                <h1 className="font-display text-[28px] font-bold tracking-tight text-white mb-2">
                  What already exists?
                </h1>
                <p className="text-[13px] text-white/40 leading-relaxed">
                  Give the Context Analyst something to work with. Everything here is optional — but the more it knows, the fewer assumptions the rest of the team has to make.
                </p>
              </div>

              <ContextInputPanel value={context} onChange={setContext} />

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="bg-white text-black font-semibold text-[14px] px-7 py-3 rounded-full hover:opacity-88 transition-all duration-200 hover:-translate-y-px"
                >
                  Continue →
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-7">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 mb-4">
                  Step 2 of 2
                </span>
                <h1 className="font-display text-[28px] font-bold tracking-tight text-white mb-2">
                  What do you want to build?
                </h1>
                <p className="text-[13px] text-white/40 leading-relaxed">
                  Describe the feature in plain language. PrismOS will coordinate all 7 agents to deliver a shippable result.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-[12px] font-semibold text-white/60 mb-2">
                    Feature request
                  </label>
                  <textarea
                    autoFocus
                    placeholder="e.g. Add OTP login to the fintech app"
                    value={featureRequest}
                    onChange={(e) => setFeatureRequest(e.target.value)}
                    rows={4}
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-[15px] text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors duration-200 resize-none"
                  />
                </div>

                <FeatureClassificationSelect value={classification} onChange={setClassification} />

                {context.github_url || context.description ? (
                  <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3">
                    <span className="text-emerald-400 text-[13px]">✓</span>
                    <span className="text-[12px] text-white/50">
                      Context provided — Context Analyst will use it before planning begins
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="text-[13px] text-white/40 hover:text-white/70 transition-colors duration-200"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className="bg-white text-black font-semibold text-[14px] px-7 py-3 rounded-full hover:opacity-88 transition-all duration-200 hover:-translate-y-px disabled:opacity-30 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Starting run…' : 'Run all 7 agents →'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function StepDot({ active, done, num }: { active: boolean; done: boolean; num: number }) {
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-colors duration-300 ${
        done
          ? 'bg-blue-500 text-white'
          : active
          ? 'bg-white text-black'
          : 'bg-white/[0.06] text-white/30 border border-white/[0.1]'
      }`}
    >
      {done ? '✓' : num}
    </div>
  )
}
