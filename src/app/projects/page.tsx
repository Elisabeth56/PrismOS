'use client'
// src/app/projects/page.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createProject, getProjects } from '@/lib/api'

interface Project {
  id: string
  name: string
  description: string
  run_count: number
  memory_entry_count: number
  last_run_at: string
  verdict_breakdown: { shippable: number; needs_revision: number }
}

const GRADIENT_COLORS = [
  'from-amber-500 to-orange-500',
  'from-blue-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500',
]

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  } catch {
    return dateStr
  }
}

export default function ProjectsPage() {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProjects().then((result) => {
      if (result.ok) {
        const mapped: Project[] = result.data.projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          run_count: p.run_count,
          memory_entry_count: p.memory_entry_count,
          last_run_at: formatTimeAgo(p.last_run_at),
          verdict_breakdown: { shippable: 0, needs_revision: 0 },
        }))
        setProjects(mapped)
      }
      setLoading(false)
    })
  }, [])

  const handleCreate = async () => {
    if (!newName.trim() || creating) return
    setCreating(true)

    const result = await createProject({
      name: newName.trim(),
      description: newDesc.trim(),
    })

    setCreating(false)
    setShowCreate(false)
    setNewName('')
    setNewDesc('')

    // Navigate to the new project if the API returned an id
    if (result.ok) {
      router.push(`/projects/${result.data.id}`)
    }
  }

  return (
    <div className="relative min-h-screen bg-black">
      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <a href="/dashboard" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">Dashboard</a>
              <span className="text-white/20 text-[11px]">/</span>
              <span className="text-[12px] text-white/60">Projects</span>
            </div>
            <h1 className="font-display text-[28px] font-bold tracking-tight text-white">Projects</h1>
            <p className="text-[13px] text-white/40 mt-0.5">Each project has its own memory space that persists across runs.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-white text-black font-semibold text-[13px] px-5 py-2.5 rounded-full hover:opacity-88 transition-all duration-200 hover:-translate-y-px"
          >
            + New project
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-20 text-[13px] text-white/25">Loading projects…</div>
        )}

        {/* Project grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => (
              <motion.button
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="text-left rounded-2xl p-6 border border-white/[0.07] hover:border-white/[0.14] transition-all duration-300 group overflow-hidden relative"
                style={{ background: 'rgba(255,255,255,0.025)' }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />

                {/* Project avatar */}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENT_COLORS[i % GRADIENT_COLORS.length]} flex items-center justify-center text-[14px] font-bold text-black mb-4`}>
                  {project.name.charAt(0)}
                </div>

                <div className="font-display text-[17px] font-bold text-white mb-1 tracking-tight">
                  {project.name}
                </div>
                <div className="text-[12px] text-white/40 leading-relaxed mb-5 line-clamp-2">
                  {project.description}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Runs', value: project.run_count },
                    { label: 'Memory', value: project.memory_entry_count },
                    { label: 'Shipped', value: project.verdict_breakdown.shippable },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/[0.04] rounded-lg px-2.5 py-2 text-center">
                      <div className="text-[15px] font-bold text-white">{stat.value}</div>
                      <div className="text-[10px] text-white/35">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/30">Last run {project.last_run_at}</span>
                  <span className="text-white/25 text-[12px] group-hover:text-white/60 transition-colors">→</span>
                </div>
              </motion.button>
            ))}

            {/* Empty state card */}
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: projects.length * 0.07 }}
              onClick={() => setShowCreate(true)}
              className="rounded-2xl p-6 border border-dashed border-white/[0.1] hover:border-white/[0.2] transition-all duration-300 flex flex-col items-center justify-center gap-3 min-h-[240px] group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center text-[18px] text-white/30 group-hover:text-white/60 transition-colors">
                +
              </div>
              <span className="text-[13px] text-white/30 group-hover:text-white/55 transition-colors">Create new project</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Create project modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-6"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md rounded-2xl p-8"
              style={{ background: 'rgba(15,15,22,0.97)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(40px)' }}
            >
              <button onClick={() => setShowCreate(false)}
                className="absolute top-5 right-5 w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors text-[12px]">
                ✕
              </button>
              <h2 className="font-display text-[22px] font-bold tracking-tight text-white mb-1.5">New project</h2>
              <p className="text-[13px] text-white/40 mb-6 leading-relaxed">Projects group related runs under one shared memory space.</p>
              <label className="block text-[12px] font-semibold text-white/55 mb-2">Project name</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Fintech App"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors mb-3"
              />
              <label className="block text-[12px] font-semibold text-white/55 mb-2">Description <span className="text-white/25 font-normal">(optional)</span></label>
              <textarea
                placeholder="Briefly describe the product this project is for..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors resize-none mb-5"
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="w-full bg-white text-black font-bold text-[14px] py-3 rounded-xl hover:opacity-88 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating…' : 'Create project →'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
