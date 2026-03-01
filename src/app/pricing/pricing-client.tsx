'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { PLANS, type PlanKey } from '@/lib/plans'
import { createCheckoutSession } from '@/lib/actions/billing'

const planOrder: PlanKey[] = ['pro', 'business', 'enterprise']

const ctaLabel: Record<PlanKey, string> = {
  pro: 'Essai gratuit 7 jours',
  business: 'Choisir Business',
  enterprise: 'Choisir Enterprise',
}

export function PricingClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter()
  const [isAnnual, setIsAnnual] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null)

  async function handleChoosePlan(planKey: PlanKey) {
    if (!isLoggedIn) {
      router.push(`/signup?plan=${planKey}`)
      return
    }

    setLoadingPlan(planKey)
    try {
      const result = await createCheckoutSession(planKey)
      if (result.url) {
        window.location.href = result.url
      } else if (result.error) {
        alert(result.error)
      }
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <>
      {/* Toggle mensuel / annuel */}
      <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/[0.08] bg-[#131316] p-1">
        <button
          onClick={() => setIsAnnual(false)}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            !isAnnual
              ? 'bg-[#E8856C] text-[#0B0B0F]'
              : 'text-[#888] hover:text-[#EDEDED]'
          }`}
        >
          Mensuel
        </button>
        <button
          onClick={() => setIsAnnual(true)}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            isAnnual
              ? 'bg-[#E8856C] text-[#0B0B0F]'
              : 'text-[#888] hover:text-[#EDEDED]'
          }`}
        >
          Annuel
          <span className="ml-1.5 text-[10px] font-bold uppercase">-20%</span>
        </button>
      </div>

      {/* Grille des plans */}
      <div className="mt-16 grid items-stretch gap-6 md:grid-cols-3">
        {planOrder.map((planKey) => {
          const plan = PLANS[planKey]
          const isPopular = planKey === 'business'
          const monthlyPrice = plan.price
          const displayPrice = isAnnual
            ? Math.round(monthlyPrice * 0.8)
            : monthlyPrice
          const isLoading = loadingPlan === planKey

          return (
            <div key={planKey} className="relative flex h-full w-full">
              {isPopular && (
                <div className="absolute -top-3 left-6 z-10">
                  <span className="rounded-full bg-[#E8856C] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0B0B0F]">
                    Populaire
                  </span>
                </div>
              )}
              <div
                className={`relative flex w-full flex-1 flex-col rounded-xl border p-8 transition-colors ${
                  isPopular
                    ? 'border-[#E8856C]/25 bg-[#E8856C]/[0.02]'
                    : 'border-white/[0.06] bg-[#131316] hover:border-white/[0.1]'
                }`}
              >
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

                <ul className="my-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          isPopular ? 'text-[#E8856C]' : 'text-[#777]'
                        }`}
                      />
                      <span className="text-sm text-[#888]">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleChoosePlan(planKey)}
                  disabled={isLoading}
                  className={`mt-auto block w-full rounded-lg px-6 py-3 text-center text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none ${
                    isPopular
                      ? 'bg-[#E8856C] text-[#0B0B0F] hover:bg-[#F09E8A]'
                      : 'border border-white/[0.08] text-[#EDEDED]/70 hover:border-white/[0.15] hover:text-[#EDEDED]'
                  }`}
                >
                  {isLoading ? 'Redirection…' : ctaLabel[planKey]}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Note sous les plans */}
      <p className="mt-10 text-center text-xs text-[#555]">
        Tous les plans incluent un essai gratuit de 7 jours sur Pro. Sans engagement.{' '}
        <Link href="/#faq" className="text-[#E8856C] hover:underline">
          Questions fréquentes
        </Link>
      </p>
    </>
  )
}
