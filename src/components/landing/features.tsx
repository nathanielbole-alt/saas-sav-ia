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
import { SpotlightCard } from '@/components/landing/magnetic'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  },
}

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
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
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
      role="region"
      aria-labelledby="features-heading"
      className="border-t border-white/[0.06] py-32"
      ref={ref}
    >
      <div className="mx-auto max-w-[1400px] px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-20"
        >
          <span className="text-xs uppercase tracking-widest text-[#777]">
            Fonctionnalités
          </span>
          <h2
            id="features-heading"
            className="mt-4 max-w-xl text-4xl font-semibold tracking-tighter text-[#EDEDED] md:text-5xl"
          >
            Trois outils.
            <br />
            <span className="text-[#E8856C]">Zéro friction.</span>
          </h2>
        </motion.div>

        {/* Bento Grid — Zig-zag asymmetric (2fr/1fr) per taste-skill */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={container}
          className="grid gap-4"
        >
          {/* Row 1: Inbox (2fr) + AI Agent (1fr) */}
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            {/* Feature 1: Inbox */}
            <motion.div variants={fadeUp}>
              <SpotlightCard className="h-full rounded-xl border border-white/[0.06] bg-[#131316] p-8 transition-colors hover:border-white/[0.1] lg:p-10">
                <span className="text-[10px] uppercase tracking-widest text-[#E8856C]">
                  01 — Inbox unifiée
                </span>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[#EDEDED]">
                  Tous vos canaux. Une seule vue.
                </h3>
                <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-[#888]">
                  Emails, Instagram DMs, Messenger, avis Google, tickets Shopify
                  — tout arrive dans une inbox unique, triée par priorité.
                </p>

                {/* Channel pills */}
                <div className="mt-8 flex flex-wrap gap-2">
                  {channelList.map((ch) => (
                    <div
                      key={ch.label}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 ${ch.bg} transition-transform active:scale-[0.97]`}
                    >
                      <ch.icon className={`h-3.5 w-3.5 ${ch.color}`} />
                      <span className="text-xs text-[#EDEDED]/70">
                        {ch.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Flow indicator */}
                <div className="mt-5 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  <ArrowRight className="h-4 w-4 text-[#E8856C]" />
                  <span className="text-[10px] text-[#E8856C]">INBOX</span>
                </div>
              </SpotlightCard>
            </motion.div>

            {/* Feature 2: AI Agent */}
            <motion.div variants={fadeUp}>
              <SpotlightCard className="h-full rounded-xl border border-white/[0.06] bg-[#131316] p-8 transition-colors hover:border-white/[0.1] lg:p-10">
                <span className="text-[10px] uppercase tracking-widest text-[#E8856C]">
                  02 — Agent IA
                </span>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[#EDEDED]">
                  Réponses en 30s.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#888]">
                  L&apos;IA analyse le contexte complet et rédige une réponse
                  adaptée.
                </p>

                {/* AI response preview skeleton */}
                <div
                  className="mt-8 rounded-lg border border-[#E8856C]/10 bg-[#E8856C]/[0.02] p-5"
                  style={{
                    boxShadow: 'inset 0 1px 0 rgba(232,133,108,0.05)',
                  }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-4 w-4 items-center justify-center rounded bg-[#E8856C]/20">
                      <span className="text-[7px] text-[#E8856C]">AI</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Savly IA — Envoyé automatiquement · 30s
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-white/[0.06]" />
                    <div className="h-2 w-4/5 rounded-full bg-white/[0.06]" />
                    <div className="h-2 w-3/5 rounded-full bg-white/[0.06]" />
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          </div>

          {/* Row 2: Analytics — full width with asymmetric inner grid (1fr/2fr) */}
          <motion.div variants={fadeUp}>
            <SpotlightCard className="rounded-xl border border-white/[0.06] bg-[#131316] p-8 transition-colors hover:border-white/[0.1] lg:p-10">
              <div className="grid items-center gap-10 lg:grid-cols-[1fr_2fr]">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#E8856C]">
                    03 — Analytics temps réel
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[#EDEDED]">
                    Mesurez tout. Améliorez constamment.
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#888]">
                    Temps de réponse, satisfaction CSAT, volume par canal, taux
                    de résolution IA — des métriques actionables.
                  </p>
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {analyticsStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg bg-white/[0.03] p-4"
                    >
                      <span
                        className="text-2xl font-semibold text-[#EDEDED]"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {stat.value}
                      </span>
                      <p className="mt-1 text-[10px] text-[#777]">
                        {stat.label}
                      </p>
                      <span
                        className="mt-2 inline-block text-[10px] text-emerald-400"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {stat.trend}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
