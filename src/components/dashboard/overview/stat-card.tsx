'use client'

import { motion } from 'framer-motion'
import type { ComponentType } from 'react'

type StatCardProps = {
  label: string
  value: number
  icon: ComponentType<{ className?: string }>
  accent: 'blue' | 'red' | 'green' | 'yellow'
  badge?: string
  delay?: number
}

const toneStyles = {
  blue: {
    glow: 'bg-[#0a84ff]/10 group-hover:bg-[#0a84ff]/20',
    icon: 'bg-[#0a84ff]/10 text-[#0a84ff]',
    badge: 'text-[#0a84ff]',
  },
  red: {
    glow: 'bg-[#ff453a]/10 group-hover:bg-[#ff453a]/20',
    icon: 'bg-[#ff453a]/10 text-[#ff453a]',
    badge: 'text-[#ff453a]',
  },
  green: {
    glow: 'bg-[#30d158]/10 group-hover:bg-[#30d158]/20',
    icon: 'bg-[#30d158]/10 text-[#30d158]',
    badge: 'text-[#30d158]',
  },
  yellow: {
    glow: 'bg-[#ffd60a]/10 group-hover:bg-[#ffd60a]/20',
    icon: 'bg-[#ffd60a]/10 text-[#ffd60a]',
    badge: 'text-[#ffd60a]',
  },
} as const

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  badge,
  delay = 0,
}: StatCardProps) {
  const tone = toneStyles[accent]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 24 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl transition-all ${tone.glow}`} />
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-medium text-[#86868b]">{label}</h3>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl font-bold tracking-tight text-white">{value}</span>
        {badge ? <span className={`text-xs font-medium ${tone.badge}`}>{badge}</span> : null}
      </div>
    </motion.div>
  )
}
