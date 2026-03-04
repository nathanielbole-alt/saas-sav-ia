'use client'

import { motion } from 'framer-motion'

type OverviewHeaderProps = {
  userName?: string | null
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export function OverviewHeader({ userName }: OverviewHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2"
    >
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {getGreeting()},{' '}
        <span className="text-[#E8856C]">
          {userName?.split(' ')[0] ?? 'Agent'}
        </span>
      </h1>
      <p className="text-base text-[#86868b]">
        Voici un résumé de l&apos;activité de votre support client aujourd&apos;hui.
      </p>
    </motion.div>
  )
}
