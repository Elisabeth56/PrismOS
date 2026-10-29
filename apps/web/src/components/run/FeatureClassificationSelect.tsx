'use client'
// src/components/run/FeatureClassificationSelect.tsx

import { FeatureClassification } from '@/lib/types'

interface FeatureClassificationSelectProps {
  value: FeatureClassification | null
  onChange: (value: FeatureClassification) => void
}

const OPTIONS: { value: FeatureClassification; label: string; desc: string; icon: string }[] = [
  { value: 'new_feature', label: 'New feature', desc: 'Something that does not exist yet', icon: '✦' },
  { value: 'enhancement', label: 'Enhancement', desc: 'Extends something that already exists', icon: '↗' },
  { value: 'refactor', label: 'Refactor', desc: 'Restructure without changing behavior', icon: '⟲' },
  { value: 'bug_fix', label: 'Bug fix', desc: 'Something is broken and needs fixing', icon: '⚠' },
]

export default function FeatureClassificationSelect({ value, onChange }: FeatureClassificationSelectProps) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-white/60 mb-2.5">
        What kind of change is this?
      </label>
      <div className="grid grid-cols-2 gap-2.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-left rounded-xl px-4 py-3.5 border transition-all duration-200 ${
              value === opt.value
                ? 'bg-blue-500/[0.08] border-blue-500/40'
                : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[13px] ${value === opt.value ? 'text-blue-400' : 'text-white/40'}`}>
                {opt.icon}
              </span>
              <span className="text-[13px] font-semibold text-white">{opt.label}</span>
            </div>
            <div className="text-[11px] text-white/35 leading-relaxed">{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
