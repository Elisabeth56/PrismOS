'use client'
// src/components/run/ContextInputPanel.tsx

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ContextInput } from '@/lib/types'

interface ContextInputPanelProps {
  value: ContextInput
  onChange: (value: ContextInput) => void
}

export default function ContextInputPanel({ value, onChange }: ContextInputPanelProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const files = Array.from(fileList).slice(0, 5)
    onChange({ ...value, files })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* GitHub URL */}
      <div>
        <label className="block text-[12px] font-semibold text-white/60 mb-2">
          GitHub repository
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-[13px]">⌥</span>
          <input
            type="text"
            placeholder="github.com/your-org/your-repo"
            value={value.github_url || ''}
            onChange={(e) => onChange({ ...value, github_url: e.target.value })}
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors duration-200"
          />
        </div>
        <p className="text-[11px] text-white/30 mt-1.5">Public repos only for now. Private repo support is coming soon.</p>
      </div>

      {/* File upload */}
      <div>
        <label className="block text-[12px] font-semibold text-white/60 mb-2">
          Upload files
        </label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
          className={`relative rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors duration-200 ${
            dragOver ? 'border-blue-500/50 bg-blue-500/[0.04]' : 'border-white/[0.1] bg-white/[0.02]'
          }`}
        >
          <input
            type="file"
            multiple
            accept=".py,.ts,.tsx,.js,.jsx,.json,.sql,.md,.png,.jpg,.jpeg"
            onChange={(e) => handleFiles(e.target.files)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="text-[20px] mb-2 opacity-40">⇧</div>
          <div className="text-[13px] text-white/50">
            Drop schemas, source files, or screenshots — or click to browse
          </div>
          <div className="text-[11px] text-white/25 mt-1">Up to 5 files, 500KB each</div>
        </div>
        {value.files && value.files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {value.files.map((f) => (
              <span
                key={f.name}
                className="inline-flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.1] rounded-full px-3 py-1 text-[11px] text-white/60"
              >
                📄 {f.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Product URL */}
      <div>
        <label className="block text-[12px] font-semibold text-white/60 mb-2">
          Live product URL <span className="text-white/25 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="https://yourapp.com"
          value={value.product_url || ''}
          onChange={(e) => onChange({ ...value, product_url: e.target.value })}
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors duration-200"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-[12px] font-semibold text-white/60 mb-2">
          Describe what already exists <span className="text-white/25 font-normal">(optional)</span>
        </label>
        <textarea
          placeholder="e.g. Mobile-first fintech app with existing email/password login, transaction history, and a KYC flow..."
          value={value.description || ''}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          rows={3}
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors duration-200 resize-none"
        />
      </div>

      {/* Stack info */}
      <div>
        <label className="block text-[12px] font-semibold text-white/60 mb-2">
          Known stack <span className="text-white/25 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Next.js + FastAPI + PostgreSQL + Redis"
          value={value.stack_info || ''}
          onChange={(e) => onChange({ ...value, stack_info: e.target.value })}
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors duration-200"
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-start gap-2.5 bg-emerald-500/[0.05] border border-emerald-500/15 rounded-xl px-4 py-3"
      >
        <span className="text-emerald-400 text-[13px] mt-0.5">ⓘ</span>
        <p className="text-[12px] text-white/45 leading-relaxed">
          Nothing here is required. If you skip this step, the Context Analyst runs in minimal-context mode and notes that no existing product information was supplied.
        </p>
      </motion.div>
    </div>
  )
}
