'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Plug, Brain, Send } from 'lucide-react'

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
    title: 'Validez et envoyez',
    description:
      "Relisez, ajustez si besoin, envoyez en un clic. Ou activez l'envoi automatique pour les cas simples.",
  },
]

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="how-it-works"
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
            Comment ça marche
          </span>
          <h2 className="mt-4 max-w-md text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Opérationnel
            <br />
            <span className="text-zinc-500">en 3 étapes.</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative grid gap-6 lg:grid-cols-3">
          {/* Connecting line — desktop only */}
          <div className="pointer-events-none absolute top-[52px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] hidden h-px bg-gradient-to-r from-white/10 via-white/[0.06] to-white/10 lg:block" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.15 }}
              className="group relative rounded-xl border border-white/[0.06] bg-[#0c0c10] p-8 transition-colors hover:border-white/[0.1]"
            >
              {/* Number + icon header */}
              <div className="mb-6 flex items-center gap-4">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
                  <step.icon className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-[#8b5cf6]" />
                </div>
                <span className="font-mono text-3xl font-bold text-white/10">
                  {step.number}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
