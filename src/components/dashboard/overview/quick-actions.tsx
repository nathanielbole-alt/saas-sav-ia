'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

type QuickActionsProps = {
  delay?: number
}

export function QuickActions({ delay = 0 }: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:flex-row lg:p-8"
    >
      <div>
        <h3 className="mb-2 text-lg font-semibold text-white">
          Configurez vos intégrations
        </h3>
        <p className="max-w-xl text-sm text-[#86868b]">
          Connectez Savly à Shopify, Gmail, ou Instagram pour centraliser vos
          demandes clients et laisser l&apos;IA y répondre.
        </p>
      </div>
      <Link
        href="/dashboard/settings?tab=integrations"
        className="flex-none rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition-all hover:bg-zinc-200"
      >
        Gérer les intégrations
      </Link>
    </motion.div>
  )
}
