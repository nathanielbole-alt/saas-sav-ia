'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { PLANS, type PlanKey } from '@/lib/plans'

const planOrder: PlanKey[] = ['pro', 'business', 'enterprise']

const ctaByPlan: Record<PlanKey, string> = {
  pro: 'Essai gratuit 7 jours',
  business: 'Choisir Business',
  enterprise: 'Choisir Enterprise',
}

export function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="pricing"
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
            Tarifs
          </span>
          <h2 className="mt-4 max-w-md text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Simple et
            <br />
            <span className="text-zinc-500">transparent.</span>
          </h2>
          <p className="mt-4 text-base text-zinc-500">
            Démarrez avec 7 jours d&apos;essai gratuit sur Pro. Sans carte
            bancaire.
          </p>
        </motion.div>

        {/* Plan cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {planOrder.map((planKey, i) => {
            const plan = PLANS[planKey]
            const isPopular = planKey === 'business'

            return (
              <motion.div
                key={planKey}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                className={`relative rounded-xl border p-8 transition-colors ${isPopular
                    ? 'border-[#8b5cf6]/30 bg-[#8b5cf6]/[0.02]'
                    : 'border-white/[0.06] bg-[#0c0c10] hover:border-white/[0.1]'
                  }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-6">
                    <span className="rounded-full bg-[#8b5cf6] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#09090b]">
                      Populaire
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-white">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {plan.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-bold text-white">
                    {plan.price}&euro;
                  </span>
                  <span className="font-mono text-sm text-zinc-600">/mois</span>
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${isPopular ? 'text-[#8b5cf6]' : 'text-zinc-600'
                          }`}
                      />
                      <span className="text-sm text-zinc-400">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`mt-8 block rounded-lg py-2.5 text-center font-mono text-sm font-medium transition-all ${isPopular
                      ? 'bg-[#8b5cf6] text-[#09090b] hover:bg-[#a78bfa] hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                      : 'border border-white/[0.08] text-zinc-300 hover:border-white/[0.15] hover:text-white'
                    }`}
                >
                  {ctaByPlan[planKey]}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
