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

    const planGradients: Record<PlanKey, string> = {
        pro: 'from-violet-500/20 to-fuchsia-500/20',
        business: 'from-amber-500/20 to-orange-500/20',
        enterprise: 'from-cyan-500/20 to-sky-500/20',
    }

    const planBorders: Record<PlanKey, string> = {
        pro: 'border-violet-500/20 ring-violet-500/10',
        business: 'border-amber-500/20 ring-amber-500/10',
        enterprise: 'border-cyan-500/20 ring-cyan-500/10',
    }

    const planAccent: Record<PlanKey, string> = {
        pro: 'text-violet-400',
        business: 'text-amber-400',
        enterprise: 'text-cyan-400',
    }

    const currentPlanKey = (currentPlan in PLANS ? currentPlan : 'pro') as PlanKey
    const CurrentPlanIcon = planIcons[currentPlanKey]

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-5xl mx-auto p-8 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight">
                        Facturation
                    </h1>
                    <p className="mt-2 text-[13px] text-zinc-500">
                        Gérez votre abonnement et vos paiements
                    </p>
                </div>

                {success && (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 animate-in slide-in-from-top-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                        <div>
                            <p className="text-[13px] font-medium text-emerald-300">
                                Paiement réussi !
                            </p>
                            <p className="text-[11px] text-emerald-400/60">
                                Votre abonnement est désormais actif. Profitez de toutes les fonctionnalités.
                            </p>
                        </div>
                    </div>
                )}

                {canceled && (
                    <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <XCircle className="h-5 w-5 text-amber-400 shrink-0" />
                        <p className="text-[13px] text-amber-300">
                            Paiement annulé. Vous pouvez réessayer à tout moment.
                        </p>
                    </div>
                )}

                {subscription?.status === 'past_due' && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                        <p className="text-[12px] font-medium text-rose-300">
                            Paiement requis : votre essai est terminé ou votre paiement a échoué.
                        </p>
                    </div>
                )}

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-white/10',
                                planGradients[currentPlanKey]
                            )}>
                                <CurrentPlanIcon className={cn('h-6 w-6', planAccent[currentPlanKey])} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-[17px] font-bold text-white">
                                        Plan {PLANS[currentPlanKey].name}
                                    </h2>
                                    {subscription?.status === 'trialing' && trialDaysRemaining !== null && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 ring-1 ring-amber-500/30">
                                            Essai gratuit
                                            <span className="text-amber-200">{trialDaysRemaining} jours restants</span>
                                        </span>
                                    )}
                                    {subscription?.status === 'active' && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                                            <CheckCircle2 className="h-2.5 w-2.5" />
                                            Actif
                                        </span>
                                    )}
                                    {subscription?.cancelAtPeriodEnd && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 ring-1 ring-amber-500/20">
                                            Annulation prévue
                                        </span>
                                    )}
                                </div>
                                <p className="text-[12px] text-zinc-500 mt-0.5">
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
                            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-[12px] font-medium text-zinc-300 ring-1 ring-white/10 hover:bg-white/10 transition-all"
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

                {usage && (
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5">
                        <h3 className="text-[15px] font-bold text-white mb-4">
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
                                        className="rounded-xl border border-white/5 bg-white/[0.02] p-4 ring-1 ring-white/5"
                                    >
                                        <p className="text-[11px] font-medium text-zinc-500 mb-2">
                                            {item.label}
                                        </p>
                                        <p className="text-[17px] font-bold text-white mb-2">
                                            {item.current !== null ? item.current : '—'}
                                            <span className="text-[12px] font-normal text-zinc-500">
                                                {' / '}
                                                {isUnlimited ? '∞' : item.limit}
                                            </span>
                                        </p>
                                        {!isUnlimited && item.current !== null && (
                                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                <div
                                                    className={cn(
                                                        'h-full rounded-full transition-all duration-500',
                                                        isAtLimit
                                                            ? 'bg-red-500'
                                                            : isNearLimit
                                                                ? 'bg-amber-500'
                                                                : 'bg-violet-500'
                                                    )}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        )}
                                        {isUnlimited && (
                                            <p className="text-[10px] text-emerald-400/60">Illimité</p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

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
                                        'relative rounded-2xl border p-6 backdrop-blur-xl ring-1 transition-all duration-300 hover:scale-[1.02]',
                                        isCurrentPlan
                                            ? cn('bg-white/[0.04]', planBorders[key])
                                            : 'border-white/5 bg-white/[0.02] ring-white/5 hover:border-white/10'
                                    )}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500 px-3 py-1 text-[10px] font-bold text-white shadow-lg shadow-violet-500/30">
                                                <Sparkles className="h-3 w-3" />
                                                POPULAIRE
                                            </span>
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <div className={cn(
                                            'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-white/10 mb-4',
                                            planGradients[key]
                                        )}>
                                            <Icon className={cn('h-5 w-5', planAccent[key])} />
                                        </div>

                                        <h3 className="text-[15px] font-bold text-white">
                                            {plan.name}
                                        </h3>
                                        <p className="text-[11px] text-zinc-500 mt-1">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-white">
                                                {`${plan.price}€`}
                                            </span>
                                            <span className="text-[12px] text-zinc-500">/mois</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2.5">
                                                <Check className={cn('h-4 w-4 shrink-0 mt-0.5', planAccent[key])} />
                                                <span className="text-[12px] text-zinc-300">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-auto">
                                        {isCurrentPlan ? (
                                            <div className="flex items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-[12px] font-medium text-zinc-400 ring-1 ring-white/10">
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
                                                    'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[12px] font-bold transition-all active:scale-95',
                                                    isPopular
                                                        ? 'bg-violet-500 text-white hover:bg-violet-400 shadow-lg shadow-violet-500/20'
                                                        : 'bg-white text-black hover:bg-zinc-200',
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
                                            <p className="mt-2 text-center text-[10px] text-zinc-600">
                                                Seul le propriétaire peut changer de plan
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        }
                    )}
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5">
                    <h3 className="text-[15px] font-bold text-white mb-4">
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
                            <div key={i} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                <p className="text-[13px] font-medium text-zinc-200">
                                    {faq.q}
                                </p>
                                <p className="mt-1 text-[12px] text-zinc-500">
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
