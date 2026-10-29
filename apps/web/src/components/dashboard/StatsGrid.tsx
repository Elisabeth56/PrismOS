'use client'
// src/components/dashboard/StatsGrid.tsx

import { motion } from 'framer-motion'

const STATS = [
  { icon: '◈', value: '24', label: 'Total runs', delta: '+8%', up: true, color: '#3b82f6' },
  { icon: '✓', value: '19', label: 'Shippable verdicts', delta: '+12%', up: true, color: '#22c55e' },
  { icon: '⚖', value: '47', label: 'Conflicts resolved', delta: '+5%', up: true, color: '#f59e0b' },
  { icon: '⚡', value: '2.4m', label: 'Avg. run time', delta: '−0.3m', up: false, color: '#8b5cf6' },
]

export default function StatsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
      {STATS.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl p-5 overflow-hidden group"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${stat.color}1f 0%, transparent 70%)` }}
            aria-hidden="true"
          />
          <div
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-[15px] mb-4"
            style={{ background: `${stat.color}1f`, color: stat.color }}
          >
            {stat.icon}
          </div>
          <div className="font-display text-[26px] font-bold tracking-tight text-white mb-1">
            {stat.value}
          </div>
          <div className="text-[12px] text-white/40 mb-2.5">{stat.label}</div>
          <div className={`text-[11px] font-semibold ${stat.up ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stat.up ? '↑' : '↓'} {stat.delta} from last week
          </div>
        </motion.div>
      ))}
    </div>
  )
}
