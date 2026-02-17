'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const problems = [
  {
    number: '67%',
    title: 'des clients ne reviennent pas',
    description:
      'après une mauvaise expérience SAV. Chaque minute de retard coûte cher.',
  },
  {
    number: '5h',
    title: 'perdues chaque semaine',
    description:
      'à copier-coller les mêmes réponses. Votre équipe mérite mieux.',
  },
  {
    number: '23%',
    title: 'des messages sans réponse',
    description:
      'Les emails se perdent entre les boîtes. Les avis Google restent ignorés.',
  },
  {
    number: '∞',
    title: 'canaux à surveiller',
    description:
      'Gmail, Instagram, Messenger, Shopify, Google Reviews. Impossible de tout suivre manuellement.',
  },
]

export function Problems() {
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
            Le problème
          </span>
          <h2 className="mt-4 max-w-lg text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Votre SAV est un
            <br />
            <span className="text-zinc-500">goulet d&apos;étranglement.</span>
          </h2>
        </motion.div>

        {/* Stats grid — separated by 1px borders */}
        <div className="overflow-hidden rounded-xl bg-white/[0.06]">
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4">
            {problems.map((problem, i) => (
              <motion.div
                key={problem.number}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group bg-[#09090b] p-8 transition-colors hover:bg-[#0c0c10]"
              >
                <span className="font-mono text-4xl font-bold text-[#8b5cf6] sm:text-5xl">
                  {problem.number}
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-white">
                  {problem.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {problem.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
