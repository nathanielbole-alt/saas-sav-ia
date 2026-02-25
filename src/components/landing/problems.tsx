'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
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
    number: '\u221E',
    title: 'canaux à surveiller',
    description:
      'Gmail, Instagram, Messenger, Shopify, Google Reviews. Impossible de tout suivre manuellement.',
  },
]

export function Problems() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      role="region"
      aria-labelledby="problems-heading"
      className="border-t border-white/[0.06] py-32"
      ref={ref}
    >
      <div className="mx-auto max-w-[1400px] px-6">
        {/* Header — left aligned per taste-skill ANTI-CENTER BIAS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-20"
        >
          <span className="text-xs uppercase tracking-widest text-[#777]">
            Le problème
          </span>
          <h2
            id="problems-heading"
            className="mt-4 max-w-lg text-4xl font-semibold tracking-tighter text-[#EDEDED] md:text-5xl"
          >
            Votre SAV vous
            <br />
            <span className="text-[#777]">freine dans votre croissance.</span>
          </h2>
        </motion.div>

        {/* Stats — 2x2 grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={container}
          className="grid gap-4 sm:grid-cols-2"
        >
          {problems.map((problem) => (
            <motion.div key={problem.number} variants={fadeUp} className="h-full">
              <SpotlightCard className="h-full rounded-xl border border-white/[0.06] bg-[#131316] p-8 transition-colors hover:border-white/[0.1]">
                <span
                  className="text-5xl font-semibold tracking-tight text-[#E8856C]"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {problem.number}
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-[#EDEDED]">
                  {problem.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#777]">
                  {problem.description}
                </p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
