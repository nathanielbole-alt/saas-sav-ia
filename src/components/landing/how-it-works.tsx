'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Plug, Brain, Send } from 'lucide-react'
import { SpotlightCard } from '@/components/landing/magnetic'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  },
}

const steps = [
  {
    number: '01',
    icon: Plug,
    title: 'Connectez vos canaux',
    description:
      'Branchez Gmail, Shopify, Instagram ou Messenger en quelques clics. Tout arrive dans une seule inbox.',
  },
  {
    number: '02',
    icon: Brain,
    title: "L'IA analyse et rédige",
    description:
      "Pour chaque message, l'IA identifie l'intention du client, classe la demande, et propose une réponse adaptée.",
  },
  {
    number: '03',
    icon: Send,
    title: "L'IA envoie. Vous supervisez.",
    description:
      "Pour les cas simples, la réponse est envoyée automatiquement en 28 secondes — sans intervention. Vous gardez la main sur les cas complexes.",
  },
]

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="how-it-works"
      role="region"
      aria-labelledby="how-it-works-heading"
      className="border-t border-white/[0.06] py-32"
      ref={ref}
    >
      <div className="mx-auto max-w-[1400px] px-6">
        {/* Asymmetric layout: Sticky header left + steps right */}
        <div className="grid gap-16 lg:grid-cols-[1fr_1.5fr]">
          {/* Left — sticky header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="lg:sticky lg:top-32 lg:self-start"
          >
            <span className="text-xs uppercase tracking-widest text-[#777]">
              Comment ça marche
            </span>
            <h2
              id="how-it-works-heading"
              className="mt-4 max-w-md text-4xl font-semibold tracking-tighter text-[#EDEDED] md:text-5xl"
            >
              Opérationnel
              <br />
              <span className="text-[#777]">en 3 étapes.</span>
            </h2>
            <p className="mt-6 max-w-[40ch] text-sm leading-relaxed text-[#888]">
              Pas de configuration complexe. Connectez, laissez l&apos;IA
              apprendre, et commencez à répondre plus vite que jamais.
            </p>
          </motion.div>

          {/* Right — steps */}
          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={container}
            className="space-y-4"
          >
            {steps.map((step) => (
              <motion.div key={step.number} variants={fadeUp}>
                <SpotlightCard className="group rounded-xl border border-white/[0.06] bg-[#131316] p-8 transition-colors hover:border-white/[0.1]">
                  {/* Number + icon header */}
                  <div className="mb-6 flex items-center gap-4">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
                      <step.icon className="h-5 w-5 text-[#888] transition-colors group-hover:text-[#E8856C]" />
                    </div>
                    <span className="text-3xl font-semibold text-white/10">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-[#EDEDED]">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-[#777]">
                    {step.description}
                  </p>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
