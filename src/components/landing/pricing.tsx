'use client'

import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { PLANS, type PlanKey } from '@/lib/plans'
import { Magnetic, SpotlightCard } from '@/components/landing/magnetic'

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

const planOrder: PlanKey[] = ['pro', 'business', 'enterprise']

const ctaByPlan: Record<PlanKey, string> = {
  pro: 'Essai gratuit 7 jours',
  business: 'Choisir Business',
  enterprise: 'Choisir Enterprise',
}

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="pricing"
      role="region"
      aria-labelledby="pricing-heading"
      className="border-t border-white/[0.06] py-32"
      ref={ref}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Centered header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-16 text-center"
        >
          <span className="text-xs uppercase tracking-widest text-[#777]">
            Tarifs
          </span>
          <h2
            id="pricing-heading"
            className="mt-4 text-4xl font-semibold tracking-tighter text-[#EDEDED] md:text-5xl"
          >
            Simple et{' '}
            <span className="text-[#E8856C]">transparent.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[48ch] text-sm leading-relaxed text-[#888]">
            Démarrez avec 7 jours d&apos;essai gratuit sur Pro. Sans carte
            bancaire. Hébergé en Europe.
          </p>

          {/* Annual / Monthly toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/[0.08] bg-[#131316] p-1">
            <button
              onClick={() => setIsAnnual(false)}
              aria-label="Afficher les tarifs mensuels"
              aria-pressed={!isAnnual}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${!isAnnual
                ? 'bg-[#E8856C] text-[#0B0B0F]'
                : 'text-[#888] hover:text-[#EDEDED]'
                }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              aria-label="Afficher les tarifs annuels"
              aria-pressed={isAnnual}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${isAnnual
                ? 'bg-[#E8856C] text-[#0B0B0F]'
                : 'text-[#888] hover:text-[#EDEDED]'
                }`}
            >
              Annuel
              <span className="ml-1.5 text-[10px] font-bold uppercase">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* 3-column cards grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={container}
          className="grid items-stretch gap-6 md:grid-cols-3"
        >
          {planOrder.map((planKey) => {
            const plan = PLANS[planKey]
            const isPopular = planKey === 'business'
            const monthlyPrice = plan.price
            const displayPrice = isAnnual
              ? Math.round(monthlyPrice * 0.8)
              : monthlyPrice

            return (
              <motion.div key={planKey} variants={fadeUp} className="relative flex h-full w-full">
                {isPopular && (
                  <div className="absolute -top-3 left-6 z-10">
                    <span className="rounded-full bg-[#E8856C] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0B0B0F]">
                      Populaire
                    </span>
                  </div>
                )}
                <SpotlightCard
                  className={`relative flex w-full flex-1 flex-col rounded-xl border p-8 transition-colors ${isPopular
                      ? 'border-[#E8856C]/25 bg-[#E8856C]/[0.02]'
                      : 'border-white/[0.06] bg-[#131316] hover:border-white/[0.1]'
                    }`}
                >

                  {/* Plan header */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#EDEDED]">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm text-[#777]">
                      {plan.description}
                    </p>
                    <div className="mt-5 flex items-baseline gap-1">
                      <span
                        className="text-4xl font-semibold text-[#EDEDED]"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {displayPrice}&euro;
                      </span>
                      <span className="text-sm text-[#777]">/mois</span>
                    </div>
                    {isAnnual && (
                      <p className="mt-1 text-xs text-[#E8856C]">
                        Facturé {displayPrice * 12}&euro;/an au lieu de{' '}
                        {monthlyPrice * 12}&euro;
                      </p>
                    )}
                  </div>

                  {/* Features — takes remaining space */}
                  <ul className="my-8 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5"
                      >
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${isPopular ? 'text-[#E8856C]' : 'text-[#777]'
                            }`}
                        />
                        <span className="text-sm text-[#888]">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA — always at bottom */}
                  <Magnetic>
                    <Link
                      href="/signup"
                      className={`mt-auto block w-full rounded-lg px-6 py-3 text-center text-sm font-medium transition-all active:scale-[0.97] ${isPopular
                        ? 'bg-[#E8856C] text-[#0B0B0F] hover:bg-[#F09E8A]'
                        : 'border border-white/[0.08] text-[#EDEDED]/70 hover:border-white/[0.15] hover:text-[#EDEDED]'
                        }`}
                    >
                      {ctaByPlan[planKey]}
                    </Link>
                  </Magnetic>
                </SpotlightCard>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
