'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Mail,
  Instagram,
  MessageSquare,
  ShoppingBag,
  Star,
  ArrowRight,
} from 'lucide-react'

const channelList = [
  { icon: Mail, label: 'Gmail', color: 'text-red-400', bg: 'bg-red-500/10' },
  {
    icon: Instagram,
    label: 'Instagram',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    icon: MessageSquare,
    label: 'Messenger',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: ShoppingBag,
    label: 'Shopify',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    icon: Star,
    label: 'Reviews',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
]

const analyticsStats = [
  { label: 'Temps réponse', value: '< 2min', trend: '-68%' },
  { label: 'CSAT', value: '4.8/5', trend: '+12%' },
  { label: 'Résolu par IA', value: '73%', trend: '+25%' },
]

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="features"
      className="border-t border-white/[0.06] py-32"
      ref={ref}
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-600">
            Fonctionnalités
          </span>
          <h2 className="mt-4 max-w-xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Trois outils.
            <br />
            <span className="text-[#8b5cf6]">Zéro friction.</span>
          </h2>
        </motion.div>

        {/* Feature cards */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Feature 1: Inbox */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="group rounded-xl border border-white/[0.06] bg-[#0c0c10] p-8 transition-colors hover:border-white/[0.1] lg:p-10"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#8b5cf6]">
              01 — Inbox unifiée
            </span>
            <h3 className="mt-4 text-2xl font-bold tracking-tight text-white">
              Tous vos canaux. Une seule vue.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Emails, Instagram DMs, Messenger, avis Google, tickets Shopify —
              tout arrive dans une inbox unique, triée par priorité.
            </p>

            {/* Channel pills */}
            <div className="mt-8 flex flex-wrap gap-2">
              {channelList.map((ch) => (
                <div
                  key={ch.label}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 ${ch.bg}`}
                >
                  <ch.icon className={`h-3.5 w-3.5 ${ch.color}`} />
                  <span className="text-xs text-zinc-300">{ch.label}</span>
                </div>
              ))}
            </div>

            {/* Flow indicator */}
            <div className="mt-5 flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              <ArrowRight className="h-4 w-4 text-[#8b5cf6]" />
              <span className="font-mono text-[10px] text-[#8b5cf6]">
                INBOX
              </span>
            </div>
          </motion.div>

          {/* Feature 2: AI Agent */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="group rounded-xl border border-white/[0.06] bg-[#0c0c10] p-8 transition-colors hover:border-white/[0.1] lg:p-10"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#8b5cf6]">
              02 — Agent IA
            </span>
            <h3 className="mt-4 text-2xl font-bold tracking-tight text-white">
              Réponses intelligentes en 30s.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              L&apos;IA analyse le contexte client complet — historique,
              commandes Shopify, ancienneté — et rédige une réponse adaptée.
              Vous validez ou modifiez.
            </p>

            {/* AI response preview */}
            <div className="mt-8 rounded-lg border border-[#8b5cf6]/10 bg-[#8b5cf6]/[0.02] p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-4 w-4 items-center justify-center rounded bg-[#8b5cf6]/20">
                  <span className="text-[7px] text-[#8b5cf6]">✦</span>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#8b5cf6]">
                  Brouillon IA — confiance 94%
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full rounded-full bg-white/[0.06]" />
                <div className="h-2 w-4/5 rounded-full bg-white/[0.06]" />
                <div className="h-2 w-3/5 rounded-full bg-white/[0.06]" />
              </div>
              <div className="mt-5 flex gap-2">
                <span className="rounded bg-white/[0.06] px-3 py-1.5 font-mono text-[9px] text-zinc-400">
                  Modifier
                </span>
                <span className="rounded bg-[#8b5cf6] px-3 py-1.5 font-mono text-[9px] font-medium text-[#09090b]">
                  Envoyer
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature 3: Analytics — full width */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-4 rounded-xl border border-white/[0.06] bg-[#0c0c10] p-8 transition-colors hover:border-white/[0.1] lg:p-10"
        >
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#8b5cf6]">
                03 — Analytics temps réel
              </span>
              <h3 className="mt-4 text-2xl font-bold tracking-tight text-white">
                Mesurez tout. Améliorez constamment.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Temps de réponse, satisfaction CSAT, volume par canal, taux de
                résolution IA — des métriques actionables pour piloter votre
                SAV.
              </p>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-3">
              {analyticsStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg bg-white/[0.03] p-4 text-center"
                >
                  <span className="font-mono text-2xl font-bold text-white">
                    {stat.value}
                  </span>
                  <p className="mt-1 text-[10px] text-zinc-500">
                    {stat.label}
                  </p>
                  <span className="mt-2 inline-block font-mono text-[10px] text-emerald-400">
                    {stat.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
