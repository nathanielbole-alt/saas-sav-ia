'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const stats = [
  {
    value: '5h',
    label: 'gagnées / semaine',
    description: 'Temps moyen économisé par nos utilisateurs.',
  },
  {
    value: '-70%',
    label: 'temps de réponse',
    description: "L'IA rédige instantanément. Vous n'avez qu'à valider.",
  },
  {
    value: '95%',
    label: 'satisfaction client',
    description: 'Réponses rapides et personnalisées = clients fidèles.',
  },
  {
    value: '30s',
    label: 'pour une réponse IA',
    description: 'Analyse du contexte complet et génération automatique.',
  },
]

export function Testimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="border-t border-white/[0.06] py-32" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-600">
            Résultats
          </span>
          <h2 className="mt-4 max-w-lg text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Des résultats concrets,
            <br />
            <span className="text-zinc-500">dès la première semaine.</span>
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="overflow-hidden rounded-xl bg-white/[0.06]">
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.value}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-[#09090b] p-8 text-center transition-colors hover:bg-[#0c0c10]"
              >
                <span className="font-mono text-4xl font-bold text-white">
                  {stat.value}
                </span>
                <p className="mt-2 text-sm font-medium text-zinc-300">
                  {stat.label}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-zinc-600">
                  {stat.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quotes Grid */}
        <div className="mx-auto mt-16 grid max-w-2xl gap-6 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
          {[
            {
              text: "On répondait à nos clients en 24h. Maintenant c'est en moins de 2 heures, et la qualité des réponses est meilleure. L'IA comprend vraiment le contexte de chaque demande.",
              author: "Sophie M.",
              role: "Responsable SAV — E-commerce mode",
              initials: "SM",
            },
            {
              text: "J'étais sceptique au début mais le gain de temps est colossal. L'IA gère 80% des demandes simples (suivi de colis, remboursements) sans aucune intervention de ma part.",
              author: "Thomas L.",
              role: "Fondateur — Tech Start-up",
              initials: "TL",
            },
            {
              text: "L'intégration avec Shopify est parfaite. SAV IA récupère toutes les infos de la commande et rédige une réponse hyper personnalisée. Nos avis clients ont grimpé en flèche.",
              author: "Julie B.",
              role: "Directrice Opérations — DNVB",
              initials: "JB",
            },
          ].map((testimonial, i) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
              className="relative flex flex-col justify-between rounded-xl border border-white/[0.06] bg-[#0c0c10] p-8"
            >
              {/* Quote mark */}
              <span className="absolute -top-4 left-6 font-mono text-5xl text-[#8b5cf6]/20">
                &ldquo;
              </span>

              <p className="mb-6 text-base leading-relaxed text-zinc-300">
                {testimonial.text}
              </p>

              <div className="mt-auto flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-mono text-sm font-bold text-zinc-400">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {testimonial.author}
                  </p>
                  <p className="font-mono text-xs text-zinc-600">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
