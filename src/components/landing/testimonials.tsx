'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { SpotlightCard } from '@/components/landing/magnetic'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  },
}

const stats = [
  {
    value: '5h',
    label: 'Objectif de gain / sem.',
    description: 'Le temps moyen que nous visons à vous faire économiser.',
  },
  {
    value: '-70%',
    label: 'Cible : temps de réponse',
    description: "L'IA rédigera instantanément. Vous n'aurez qu'à valider.",
  },
  {
    value: '95%',
    label: 'Notre ambition CSAT',
    description: 'Pour que vos réponses rapides créent des clients fidèles.',
  },
  {
    value: '30s',
    label: 'Génération IA',
    description: "Analyse du contexte complet et proposition d'une réponse.",
  },
]

const testimonials = [
  {
    text: "Connectez vos canaux de support en quelques clics (Shopify, Gmail, Instagram). L'IA assimile votre historique instantanément pour des réponses précises.",
    author: 'Déploiement',
    role: 'Sans friction',
    initials: '⚡',
  },
  {
    text: "Savly s'adapte à votre ton et à vos politiques de retour. Plus vous l'utilisez, plus les réponses générées deviennent complètes et indétectables.",
    author: 'Apprentissage',
    role: 'IA Contextuelle',
    initials: '🧠',
  },
  {
    text: "Gardez la main sur les cas complexes. L'IA gère le volume récurrent, vous gérez l'exceptionnel grâce à une interface de validation fluide.",
    author: 'Supervision',
    role: 'Contrôle Humain',
    initials: '🛡️',
  },
]

export function Testimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      role="region"
      aria-labelledby="testimonials-heading"
      className="border-t border-white/[0.06] py-32"
      ref={ref}
    >
      <div className="mx-auto max-w-[1400px] px-6">
        {/* Centered Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-16 text-center"
        >
          <span className="text-xs uppercase tracking-widest text-[#777]">
            Résultats
          </span>
          <h2
            id="testimonials-heading"
            className="mt-4 text-4xl font-semibold tracking-tighter text-[#EDEDED] md:text-5xl"
          >
            Des résultats concrets,{' '}
            <span className="text-[#E8856C]">dès la première semaine.</span>
          </h2>
        </motion.div>

        {/* Stats — 4 Equal Columns */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={container}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div key={stat.value} variants={fadeUp} className="flex">
              <SpotlightCard className="flex w-full flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-[#131316] p-8 text-center transition-colors hover:border-white/[0.1]">
                <span
                  className="text-4xl font-semibold text-[#EDEDED]"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {stat.value}
                </span>
                <p className="mt-2 text-sm font-medium text-[#EDEDED]/90">
                  {stat.label}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-[#777]">
                  {stat.description}
                </p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials — 3 Equal Columns */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={container}
          className="mt-8 grid gap-6 md:grid-cols-3"
        >
          {testimonials.map((t) => (
            <motion.div key={t.author} variants={fadeUp} className="flex">
              <SpotlightCard className="relative flex w-full flex-col justify-between rounded-xl border border-white/[0.06] bg-[#131316] p-8 transition-colors hover:border-white/[0.1]">
                <div>
                  <span className="absolute -top-3 left-5 text-4xl text-[#E8856C]/15">
                    &ldquo;
                  </span>
                  <p className="text-sm leading-relaxed text-[#EDEDED]/80">
                    {t.text}
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8856C]/10 text-sm font-semibold text-[#E8856C]">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#EDEDED]">
                      {t.author}
                    </p>
                    <p className="text-xs text-[#777]">{t.role}</p>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
