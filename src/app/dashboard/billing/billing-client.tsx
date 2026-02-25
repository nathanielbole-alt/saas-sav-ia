'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createCheckoutSession, createPortalSession, type UsageSummary } from '@/lib/actions/billing'
import { PLANS, type PlanKey } from '@/lib/plans'
import {
    Zap,
    Crown,
    Building2,
    Check,
    ArrowRight,
    Loader2,
    ExternalLink,
    CheckCircle2,
    XCircle,
    Sparkles,
    Shield,
    Rocket,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type SubscriptionInfo = {
    plan: PlanKey
    status: string
    currentPeriodEnd: Date | string | null
    cancelAtPeriodEnd: boolean
    trialEnd: number | null
} | null

export default function BillingClient({
    currentPlan,
    subscription,
    usage,
    isOwner,
}: {
    currentPlan: string
    subscription: SubscriptionInfo
    usage: UsageSummary | null
    isOwner: boolean
}) {
    const searchParams = useSearchParams()
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    const [loading, setLoading] = useState<string | null>(null)
    const trialDaysRemaining =
        subscription?.status === 'trialing' && typeof subscription.trialEnd === 'number'
            ? Math.max(
                0,
                Math.ceil((subscription.trialEnd * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
            )
            : null

    const handleUpgrade = async (planKey: string) => {
        if (!isOwner) return
        setLoading(planKey)
        try {
            const result = await createCheckoutSession(planKey)
            if (result.url) {
                window.location.href = result.url
            }
        } catch (error) {
            console.error('Checkout error:', error)
        } finally {
            setLoading(null)
        }
    }

    const handleManage = async () => {
        setLoading('portal')
        try {
            const result = await createPortalSession()
            if (result.url) {
                window.location.href = result.url
            }
        } catch (error) {
            console.error('Portal error:', error)
        } finally {
            setLoading(null)
        }
    }

    const planIcons: Record<PlanKey, typeof Zap> = {
        pro: Crown,
        business: Building2,
        enterprise: Rocket,
    }

    const planColors: Record<PlanKey, string> = {
        pro: 'bg-[#E8856C]/10 text-[#E8856C]',
        business: 'bg-[#ff9f0a]/10 text-[#ff9f0a]',
        enterprise: 'bg-[#5e5ce6]/10 text-[#5e5ce6]',
    }

    const planAccent: Record<PlanKey, string> = {
        pro: 'text-[#E8856C]',
        business: 'text-[#ff9f0a]',
        enterprise: 'text-[#5e5ce6]',
    }

    const currentPlanKey = (currentPlan in PLANS ? currentPlan : 'pro') as PlanKey
    const CurrentPlanIcon = planIcons[currentPlanKey]

    return (
        <div className="h-full overflow-y-auto bg-[#0B0B0F]">
            <div className="max-w-5xl mx-auto p-8 space-y-8">
                <div>
                    <h1 className="text-[22px] font-semibold text-[#EDEDED] tracking-tight">
                        Facturation
                    </h1>
                    <p className="mt-1 text-[13px] text-[#888]">
                        Gérez votre abonnement et vos paiements
                    </p>
                </div>

                {success && (
                    <div className="flex items-center gap-3 rounded-xl bg-[#30d158]/10 p-4">
                        <CheckCircle2 className="h-5 w-5 text-[#30d158] shrink-0" />
                        <div>
                            <p className="text-[13px] font-medium text-[#30d158]">
                                Paiement réussi !
                            </p>
                            <p className="text-[11px] text-[#30d158]/60">
                                Votre abonnement est désormais actif. Profitez de toutes les fonctionnalités.
                            </p>
                        </div>
                    </div>
                )}

                {canceled && (
                    <div className="flex items-center gap-3 rounded-xl bg-[#ff9f0a]/10 p-4">
                        <XCircle className="h-5 w-5 text-[#ff9f0a] shrink-0" />
                        <p className="text-[13px] text-[#ff9f0a]">
                            Paiement annulé. Vous pouvez réessayer à tout moment.
                        </p>
                    </div>
                )}

                {subscription?.status === 'past_due' && (
                    <div className="rounded-xl bg-[#ff453a]/10 p-4">
                        <p className="text-[12px] font-medium text-[#ff453a]">
                            Paiement requis : votre essai est terminé ou votre paiement a échoué.
                        </p>
                    </div>
                )}

                {/* Current Plan */}
                <div className="rounded-2xl bg-[#131316] p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                'flex h-12 w-12 items-center justify-center rounded-xl',
                                planColors[currentPlanKey]
                            )}>
                                <CurrentPlanIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-[17px] font-semibold text-[#EDEDED]">
                                        Plan {PLANS[currentPlanKey].name}
                                    </h2>
                                    {subscription?.status === 'trialing' && trialDaysRemaining !== null && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-[#ff9f0a]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ff9f0a]">
                                            Essai gratuit
                                            <span>{trialDaysRemaining} jours restants</span>
                                        </span>
                                    )}
                                    {subscription?.status === 'active' && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-[#30d158]/10 px-2 py-0.5 text-[10px] font-semibold text-[#30d158]">
                                            <CheckCircle2 className="h-2.5 w-2.5" />
                                            Actif
                                        </span>
                                    )}
                                    {subscription?.cancelAtPeriodEnd && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-[#ff9f0a]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ff9f0a]">
                                            Annulation prévue
                                        </span>
                                    )}
                                </div>
                                <p className="text-[12px] text-[#888] mt-0.5">
                                    {subscription?.status === 'trialing' && trialDaysRemaining !== null
                                        ? `Essai gratuit en cours - ${trialDaysRemaining} jours restants`
                                        : subscription?.currentPeriodEnd
                                            ? `Renouvellement le ${new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                            : 'Abonnement actif'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleManage}
                            disabled={loading === 'portal'}
                            className="flex items-center gap-2 rounded-lg bg-[#1A1A1F] px-4 py-2.5 text-[12px] font-medium text-[#EDEDED] hover:bg-[#3a3a3c] transition-colors"
                        >
                            {loading === 'portal' ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <ExternalLink className="h-3.5 w-3.5" />
                            )}
                            Gérer l&apos;abonnement
                        </button>
                    </div>
                </div>

                {/* Usage */}
                {usage && (
                    <div className="rounded-2xl bg-[#131316] p-6">
                        <h3 className="text-[15px] font-semibold text-[#EDEDED] mb-4">
                            Utilisation ce mois
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {([
                                {
                                    label: 'Tickets',
                                    current: usage.tickets.current,
                                    limit: usage.tickets.limit,
                                },
                                {
                                    label: 'Réponses IA / jour',
                                    current: null,
                                    limit: usage.aiResponses.limit,
                                },
                                {
                                    label: 'Intégrations',
                                    current: usage.integrations.current,
                                    limit: usage.integrations.limit,
                                },
                                {
                                    label: 'Utilisateurs',
                                    current: usage.users.current,
                                    limit: usage.users.limit,
                                },
                            ] as const).map((item) => {
                                const isUnlimited = item.limit === Infinity || !Number.isFinite(item.limit)
                                const percentage = isUnlimited || item.current === null
                                    ? 0
                                    : Math.min(100, Math.round((item.current / item.limit) * 100))
                                const isNearLimit = percentage >= 80
                                const isAtLimit = percentage >= 100

                                return (
                                    <div
                                        key={item.label}
                                        className="rounded-xl bg-[#1A1A1F] p-4"
                                    >
                                        <p className="text-[11px] font-medium text-[#888] mb-2">
                                            {item.label}
                                        </p>
                                        <p className="text-[17px] font-semibold text-[#EDEDED] mb-2">
                                            {item.current !== null ? item.current : '—'}
                                            <span className="text-[12px] font-normal text-[#888]">
                                                {' / '}
                                                {isUnlimited ? '∞' : item.limit}
                                            </span>
                                        </p>
                                        {!isUnlimited && item.current !== null && (
                                            <div className="h-1.5 rounded-full bg-[#3a3a3c] overflow-hidden">
                                                <div
                                                    className={cn(
                                                        'h-full rounded-full transition-all duration-500',
                                                        isAtLimit
                                                            ? 'bg-[#ff453a]'
                                                            : isNearLimit
                                                                ? 'bg-[#ff9f0a]'
                                                                : 'bg-[#30d158]'
                                                    )}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        )}
                                        {isUnlimited && (
                                            <p className="text-[10px] text-[#30d158]/60">Illimité</p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(
                        ([key, plan]) => {
                            const isCurrentPlan = currentPlanKey === key
                            const Icon = planIcons[key]
                            const isPopular = key === 'business'

                            return (
                                <div
                                    key={key}
                                    className={cn(
                                        'relative rounded-2xl p-6 transition-colors duration-150',
                                        isCurrentPlan
                                            ? 'bg-[#131316] border border-[rgba(255,255,255,0.12)]'
                                            : 'bg-[#131316] hover:bg-[#1A1A1F]'
                                    )}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-[#E8856C] px-3 py-1 text-[10px] font-semibold text-white">
                                                <Sparkles className="h-3 w-3" />
                                                POPULAIRE
                                            </span>
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <div className={cn(
                                            'flex h-10 w-10 items-center justify-center rounded-xl mb-4',
                                            planColors[key]
                                        )}>
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        <h3 className="text-[15px] font-semibold text-[#EDEDED]">
                                            {plan.name}
                                        </h3>
                                        <p className="text-[11px] text-[#888] mt-1">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[32px] font-semibold text-[#EDEDED]">
                                                {`${plan.price}€`}
                                            </span>
                                            <span className="text-[12px] text-[#888]">/mois</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2.5">
                                                <Check className={cn('h-4 w-4 shrink-0 mt-0.5', planAccent[key])} />
                                                <span className="text-[12px] text-[#888]">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-auto">
                                        {isCurrentPlan ? (
                                            <div className="flex items-center justify-center gap-2 rounded-xl bg-[#1A1A1F] px-4 py-3 text-[12px] font-medium text-[#888]">
                                                <Shield className="h-3.5 w-3.5" />
                                                {subscription?.status === 'trialing'
                                                    ? 'Plan actuel (essai)'
                                                    : 'Plan actuel'}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleUpgrade(key)}
                                                disabled={loading !== null || !isOwner}
                                                className={cn(
                                                    'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[12px] font-semibold transition-colors',
                                                    isPopular
                                                        ? 'bg-[#E8856C] text-white hover:bg-[#E8856C]/80'
                                                        : 'bg-[#f5f5f7] text-black hover:bg-[#e5e5e7]',
                                                    (loading !== null || !isOwner) && 'opacity-50 cursor-not-allowed'
                                                )}
                                            >
                                                {loading === key ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Rocket className="h-3.5 w-3.5" />
                                                )}
                                                {loading === key ? 'Redirection...' : 'Passer au plan'}
                                                {loading !== key && <ArrowRight className="h-3.5 w-3.5" />}
                                            </button>
                                        )}
                                        {!isOwner && !isCurrentPlan && (
                                            <p className="mt-2 text-center text-[10px] text-[#555]">
                                                Seul le propriétaire peut changer de plan
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        }
                    )}
                </div>

                {/* FAQ */}
                <div className="rounded-2xl bg-[#131316] p-6">
                    <h3 className="text-[15px] font-semibold text-[#EDEDED] mb-4">
                        Questions fréquentes
                    </h3>
                    <div className="space-y-4">
                        {[
                            {
                                q: 'Puis-je changer de plan à tout moment ?',
                                a: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement.',
                            },
                            {
                                q: 'Comment fonctionne la facturation ?',
                                a: 'Vous êtes facturé mensuellement. Vous pouvez annuler à tout moment et conserver l\'accès jusqu\'à la fin de votre période de facturation.',
                            },
                            {
                                q: 'Les paiements sont-ils sécurisés ?',
                                a: 'Oui, tous les paiements sont traités par Stripe, leader mondial du paiement en ligne. Vos données bancaires ne transitent jamais par nos serveurs.',
                            },
                        ].map((faq, i) => (
                            <div key={i} className="border-b border-[white/[0.06]] pb-4 last:border-0 last:pb-0">
                                <p className="text-[13px] font-medium text-[#EDEDED]">
                                    {faq.q}
                                </p>
                                <p className="mt-1 text-[12px] text-[#888]">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
