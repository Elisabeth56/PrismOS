'use client'
// PLACE AT: src/app/settings/page.tsx

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { updateProject } from '@/lib/api'

export default function SettingsPage() {
  const [apiBase, setApiBase] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [projectName, setProjectName] = useState('Fintech App')
  const [projectDesc, setProjectDesc] = useState('Mobile-first fintech product with auth, transactions, and KYC flow.')
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiBase(process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.prismos.app/api/v1')
     
    setSessionToken(localStorage.getItem('session_token') || 'Not set — will be generated on first run')
  }, [])

  const handleSave = async (section: string) => {
    if (section === 'project') {
      const result = await updateProject('proj-1', {
        name: projectName,
        description: projectDesc,
      })
      setSaved(result.ok ? section : 'error')
    } else {
      setSaved(section)
    }
    setTimeout(() => setSaved(null), 2000)
  }

  const handleResetSession = () => {
    localStorage.removeItem('session_token')
    setSessionToken('Cleared — will regenerate on next run')
  }

  return (
    <div className="relative min-h-screen bg-black">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[400px] h-[300px]"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.05) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">Dashboard</Link>
            <span className="text-white/20 text-[11px]">/</span>
            <span className="text-[12px] text-white/60">Settings</span>
          </div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-white">Settings</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Configure your project and system preferences.</p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Project settings */}
          <SettingsCard title="Active project" desc="Settings for the currently selected project.">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-white/55 mb-2">Project name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-[14px] text-white outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-white/55 mb-2">Description</label>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-[14px] text-white outline-none focus:border-blue-500/50 transition-colors resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/30">Changes apply to this project only.</span>
                <button onClick={() => handleSave('project')}
                  className="bg-white text-black font-semibold text-[13px] px-5 py-2 rounded-full hover:opacity-88 transition-all">
                  {saved === 'project' ? '✓ Saved' : 'Save changes'}
                </button>
              </div>
            </div>
          </SettingsCard>

          {/* Project memory */}
          <SettingsCard title="Project memory" desc="Manage what PrismOS remembers across runs for this project.">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <div>
                  <div className="text-[13px] text-white font-medium">Memory entries</div>
                  <div className="text-[11px] text-white/35 mt-0.5">38 entries stored for Fintech App</div>
                </div>
                <Link href="/projects/proj-1" className="text-[12px] text-blue-400 hover:text-blue-300 transition-colors">View all →</Link>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-[13px] text-white font-medium">Clear project memory</div>
                  <div className="text-[11px] text-white/35 mt-0.5">Permanently deletes all memory entries for this project. Cannot be undone.</div>
                </div>
                <button className="text-[12px] font-semibold text-red-400 border border-red-500/25 bg-red-500/[0.06] rounded-full px-4 py-1.5 hover:bg-red-500/10 transition-colors">
                  Clear memory
                </button>
              </div>
            </div>
          </SettingsCard>

          {/* System settings */}
          <SettingsCard title="System" desc="Backend connection and session configuration.">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-white/55 mb-2">
                  API base URL
                  <span className="ml-2 text-[10px] font-normal text-white/25">from NEXT_PUBLIC_API_BASE_URL</span>
                </label>
                <input
                  type="text"
                  value={apiBase}
                  onChange={(e) => setApiBase(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-[13px] text-white font-mono outline-none focus:border-blue-500/50 transition-colors"
                />
                <p className="text-[11px] text-white/30 mt-1.5">Override at runtime. Restart required after changing the env var.</p>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div>
                <label className="block text-[12px] font-semibold text-white/55 mb-2">Session token</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-[11px] text-white/50 font-mono truncate">
                    {sessionToken}
                  </div>
                  <button onClick={handleResetSession}
                    className="text-[12px] font-semibold text-white/50 border border-white/[0.12] rounded-xl px-3.5 py-3 hover:text-white hover:border-white/25 transition-colors flex-shrink-0">
                    Reset
                  </button>
                </div>
                <p className="text-[11px] text-white/30 mt-1.5">
                  Anonymous sessions are tied to this token. Resetting it means your dashboard will no longer show previous runs on this device.
                </p>
              </div>
            </div>
          </SettingsCard>

          {/* About */}
          <SettingsCard title="About" desc="">
            <div className="flex flex-col gap-2.5 text-[13px]">
              {[
                { label: 'Version', value: 'PrismOS v1.2 — hackathon build' },
                { label: 'Built for', value: 'Qwen Cloud Global AI Hackathon · Track 3' },
                { label: 'Blueprint', value: 'v1.2 (Context Analyst + UI/UX Designer + Project Memory)' },
                { label: 'Auth', value: 'Disabled (hackathon build — anonymous sessions only)' },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4 py-2 border-b border-white/[0.05] last:border-0">
                  <span className="text-white/35 flex-shrink-0">{row.label}</span>
                  <span className="text-white/60 text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </SettingsCard>
        </div>
      </div>
    </div>
  )
}

function SettingsCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <div className="text-[14px] font-semibold text-white">{title}</div>
        {desc && <div className="text-[12px] text-white/35 mt-0.5">{desc}</div>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </motion.div>
  )
}
