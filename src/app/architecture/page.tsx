'use client'
// NEW FILE: src/app/architecture/page.tsx

import { motion } from 'framer-motion'
import { AGENT_CONFIG, AGENT_ORDER, WORKFLOW_STEPS } from '@/lib/constants'

export default function ArchitecturePage() {
  return (
    <div className="relative min-h-screen bg-black">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 left-1/3 w-[600px] h-[350px]"
          style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px]"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.05) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-4">
            <a href="/" className="font-display text-[16px] font-bold tracking-tight text-white">
              Prism<span className="text-amber-400">OS</span>
            </a>
            <span className="text-white/20">/</span>
            <span className="text-[13px] text-white/50">Architecture</span>
          </div>
          <h1 className="font-display text-[clamp(32px,4vw,48px)] font-bold tracking-tight text-white mb-4">
            How PrismOS works
          </h1>
          <p className="text-[15px] text-white/45 leading-relaxed max-w-xl">
            A software operating system for autonomous feature delivery. Not a code generator — an operating system that loads project memory, understands your existing product, and activates specialized agents across product, design, engineering, and QA.
          </p>
        </div>

        {/* Stack */}
        <Section title="Stack" eyebrow="Infrastructure">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Frontend', value: 'Next.js · TypeScript · Tailwind' },
              { label: 'Motion', value: 'Framer Motion' },
              { label: 'Backend', value: 'FastAPI · LangGraph' },
              { label: 'LLM', value: 'Qwen3-235B-A22B' },
              { label: 'Streaming', value: 'Server-Sent Events' },
              { label: 'Storage', value: 'Supabase + Alibaba OSS' },
              { label: 'Hosting', value: 'Alibaba Cloud ECS' },
              { label: 'Auth', value: 'None (hackathon build)' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl px-4 py-3.5"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-[10px] font-bold uppercase tracking-wide text-white/30 mb-1">{item.label}</div>
                <div className="text-[13px] text-white/70">{item.value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Agent roster */}
        <Section title="The 7-agent roster" eyebrow="Agents">
          <div className="flex flex-col gap-2">
            {AGENT_ORDER.map((key, i) => {
              const agent = AGENT_CONFIG[key]
              return (
                <motion.div key={key}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="flex items-center gap-4 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0"
                    style={{ background: agent.hex }}>
                    {i}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-white">{agent.label}</div>
                    <div className="text-[12px] text-white/40 truncate">{agent.description}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </Section>

        {/* Workflow */}
        <Section title="Workflow — steps 0 through 9" eyebrow="Pipeline">
          <div className="flex flex-col gap-1">
            {WORKFLOW_STEPS.map((step, i) => (
              <motion.div key={step.num}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                className="flex items-center gap-4 px-4 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-[11px] font-mono text-white/25 w-6 flex-shrink-0">{step.num}</span>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: step.color }} />
                <span className="text-[13px] font-semibold text-white w-28 flex-shrink-0">{step.label}</span>
                <span className="text-[12px] text-white/40">{step.desc}</span>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Key mechanics */}
        <Section title="Key mechanics" eyebrow="Design">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: 'Project Memory', desc: 'Architecture decisions, shipped features, and conflict history persist across runs within a project. Loaded automatically before every new run.' },
              { title: 'Conflict resolution', desc: 'Agents are designed to disagree. DISAGREES, PUSHBACK, and SECURITY FLAG markers trigger the Release Manager to issue a binding decision with logged rationale.' },
              { title: 'Context-first planning', desc: 'The Context Analyst maps your existing product before any agent proposes a design — preventing incompatible stack assumptions.' },
              { title: 'Frontend QA', desc: 'QA runs responsive, accessibility, and UI-consistency checks in addition to functional tests before issuing a SHIPPABLE verdict.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl p-5"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-[13px] font-bold text-white mb-2">{item.title}</div>
                <div className="text-[12px] text-white/45 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* CTA */}
        <div className="flex items-center gap-3 mt-12 pt-8 border-t border-white/[0.06]">
          <a href="/demo" className="bg-white text-black font-semibold text-[14px] px-6 py-3 rounded-full hover:opacity-88 transition-all duration-200">
            Try the live demo →
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"
            className="text-[14px] font-medium text-white/50 border border-white/[0.12] px-6 py-3 rounded-full hover:text-white hover:border-white/25 transition-all duration-200">
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  )
}

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="mb-12">
      <div className="section-eyebrow mb-4">
        <span>◈</span>
        <span>{eyebrow}</span>
      </div>
      <h2 className="font-display text-[20px] font-bold text-white mb-5 tracking-tight">{title}</h2>
      {children}
    </div>
  )
}
