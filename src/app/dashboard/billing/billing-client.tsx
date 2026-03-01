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
    CheckCircle2,
    XCircle,
    Sparkles,
    Shield,
    Rocket,
    Ticket,
    Bot,
    Users,
    ExternalLink,
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
        pro: 'bg-[#0a84ff]/20 text-[#0a84ff] border border-[#0a84ff]/30 shadow-[0_0_15px_rgba(10,132,255,0.2)]',
        business: 'bg-[#ff9f0a]/20 text-[#ff9f0a] border border-[#ff9f0a]/30 shadow-[0_0_15px_rgba(255,159,10,0.2)]',
        enterprise: 'bg-[#bf5af2]/20 text-[#bf5af2] border border-[#bf5af2]/30 shadow-[0_0_15px_rgba(191,90,242,0.2)]',
    }

    const planAccent: Record<PlanKey, string> = {
        pro: 'text-[#0a84ff]',
        business: 'text-[#ff9f0a]',
        enterprise: 'text-[#bf5af2]',
    }

    const currentPlanKey = (currentPlan in PLANS ? currentPlan : 'pro') as PlanKey
    const CurrentPlanIcon = planIcons[currentPlanKey]

    return (
        <div className="h-full overflow-y-auto bg-transparent mt-2 mb-4 mx-4 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl custom-scrollbar">
            <div className="max-w-5xl mx-auto p-8 space-y-8">
                <div>
                    <h1 className="text-[24px] font-semibold text-white tracking-tight shadow-sm">
                        Facturation
                    </h1>
                    <p className="mt-1 text-[14px] text-[#86868b]">
                        Gérez votre abonnement et vos paiements
                    </p>
                </div>

                {success && (
                    <div className="flex items-center gap-3 rounded-2xl bg-[#30d158]/10 border border-[#30d158]/20 p-5 shadow-[0_0_20px_rgba(48,209,88,0.15)] backdrop-blur-xl">
                        <CheckCircle2 className="h-6 w-6 text-[#30d158] shrink-0 drop-shadow-md" />
                        <div>
                            <p className="text-[14px] font-semibold text-[#30d158] shadow-sm">
                                Paiement réussi !
                            </p>
                            <p className="text-[13px] text-[#30d158]/80 mt-0.5">
                                Votre abonnement est désormais actif. Profitez de toutes les fonctionnalités.
                            </p>
                        </div>
                    </div>
                )}

                {canceled && (
                    <div className="flex items-center gap-3 rounded-2xl bg-[#ff9f0a]/10 border border-[#ff9f0a]/20 p-5 shadow-[0_0_20px_rgba(255,159,10,0.15)] backdrop-blur-xl">
                        <XCircle className="h-6 w-6 text-[#ff9f0a] shrink-0 drop-shadow-md" />
                        <p className="text-[14px] font-medium text-[#ff9f0a] shadow-sm">
                            Paiement annulé. Vous pouvez réessayer à tout moment.
                        </p>
                    </div>
                )}

                {subscription?.status === 'past_due' && (
                    <div className="rounded-2xl bg-[#ff453a]/10 border border-[#ff453a]/20 p-5 shadow-[0_0_20px_rgba(255,69,58,0.15)] backdrop-blur-xl">
                        <p className="text-[14px] font-semibold text-[#ff453a] shadow-sm">
                            Paiement requis : votre essai est terminé ou votre paiement a échoué.
                        </p>
                    </div>
                )}

                {/* Current Plan */}
                <div className="rounded-3xl bg-black/20 backdrop-blur-2xl border border-white/5 shadow-inner p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className={cn(
                                'flex h-16 w-16 items-center justify-center rounded-full shadow-inner',
                                planColors[currentPlanKey]
                            )}>
                                <CurrentPlanIcon className="h-7 w-7 drop-shadow-md" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h2 className="text-[20px] font-bold text-white tracking-tight shadow-sm">
                                        Plan {PLANS[currentPlanKey].name}
                                    </h2>
                                    {subscription?.status === 'trialing' && trialDaysRemaining !== null && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff9f0a]/20 border border-[#ff9f0a]/30 px-3 py-1 text-[11px] font-bold tracking-wider text-[#ff9f0a] shadow-[0_0_10px_rgba(255,159,10,0.2)]">
                                            Essai gratuit
                                            <span className="font-medium opacity-80 bg-white/10 px-1.5 py-0.5 rounded-md ml-1">{trialDaysRemaining} jours</span>
                                        </span>
                                    )}
                                    {subscription?.status === 'active' && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#30d158]/20 border border-[#30d158]/30 px-3 py-1 text-[11px] font-bold tracking-wider text-[#30d158] shadow-[0_0_10px_rgba(48,209,88,0.2)]">
                                            <CheckCircle2 className="h-3.5 w-3.5 drop-shadow-sm" />
                                            Actif
                                        </span>
                                    )}
                                    {subscription?.cancelAtPeriodEnd && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff9f0a]/20 border border-[#ff9f0a]/30 px-3 py-1 text-[11px] font-bold tracking-wider text-[#ff9f0a] shadow-[0_0_10px_rgba(255,159,10,0.2)]">
                                            Annulation prévue
                                        </span>
                                    )}
                                </div>
                                <p className="text-[13px] text-[#86868b] mt-1.5">
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
                            className="flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/10 px-5 py-3 text-[13px] font-semibold text-white hover:bg-white/20 hover:border-white/20 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                        >
                            {loading === 'portal' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ExternalLink className="h-4 w-4" />
                            )}
                            Gérer l&apos;abonnement
                        </button>
                    </div>
                </div>

                {/* Usage */}
                {usage && (
                    <div className="rounded-3xl bg-black/20 backdrop-blur-2xl border border-white/5 shadow-inner p-6 md:p-8">
                        <h3 className="text-[17px] font-semibold text-white mb-6 shadow-sm">
                            Utilisation de vos quotas
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                            {([
                                {
                                    label: 'Tickets',
                                    current: usage.tickets.current,
                                    limit: usage.tickets.limit,
                                    icon: Ticket,
                                },
                                {
                                    label: 'Réponses IA',
                                    current: null,
                                    limit: usage.aiResponses.limit,
                                    icon: Bot,
                                },
                                {
                                    label: 'Intégrations',
                                    current: usage.integrations.current,
                                    limit: usage.integrations.limit,
                                    icon: Zap,
                                },
                                {
                                    label: 'Utilisateurs',
                                    current: usage.users.current,
                                    limit: usage.users.limit,
                                    icon: Users,
                                },
                            ] as const).map((item) => {
                                const isUnlimited = item.limit === Infinity || !Number.isFinite(item.limit)
                                const percentage = isUnlimited || item.current === null
                                    ? 0
                                    : Math.min(100, Math.round((item.current / item.limit) * 100))
                                const isNearLimit = percentage >= 80
                                const isAtLimit = percentage >= 100
                                const Icon = item.icon

                                return (
                                    <div
                                        key={item.label}
                                        className="rounded-2xl bg-white/5 border border-white/5 p-5 shadow-sm"
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 rounded-full bg-white/10 border border-white/10">
                                                <Icon className="h-3.5 w-3.5 text-[#86868b]" />
                                            </div>
                                            <p className="text-[13px] font-semibold text-[#86868b] tracking-wide uppercase">
                                                {item.label}
                                            </p>
                                        </div>
                                        <p className="text-[24px] font-bold text-white mb-2 shadow-sm">
                                            {item.current !== null ? item.current : '—'}
                                            <span className="text-[14px] font-medium text-[#86868b] ml-1">
                                                {' / '}
                                                {isUnlimited ? '∞' : item.limit}
                                            </span>
                                        </p>
                                        {!isUnlimited && item.current !== null && (
                                            <div className="h-2 rounded-full bg-black/40 border border-white/5 overflow-hidden shadow-inner mt-3">
                                                <div
                                                    className={cn(
                                                        'h-full rounded-full transition-all duration-1000 ease-out',
                                                        isAtLimit
                                                            ? 'bg-[#ff453a] shadow-[0_0_10px_rgba(255,69,58,0.5)]'
                                                            : isNearLimit
                                                                ? 'bg-[#ff9f0a] shadow-[0_0_10px_rgba(255,159,10,0.5)]'
                                                                : 'bg-[#0a84ff] shadow-[0_0_10px_rgba(10,132,255,0.5)]'
                                                    )}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        )}
                                        {isUnlimited && (
                                            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#30d158]/20 border border-[#30d158]/30 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-[#30d158] shadow-[0_0_8px_rgba(48,209,88,0.2)]">
                                                <span>Illimité</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(
                        ([key, plan]) => {
                            const isCurrentPlan = currentPlanKey === key
                            const Icon = planIcons[key]
                            const isPopular = key === 'business'

                            return (
                                <div
                                    key={key}
                                    className={cn(
                                        'relative rounded-3xl p-6 md:p-8 transition-all duration-300 flex flex-col',
                                        isCurrentPlan
                                            ? 'bg-black/40 backdrop-blur-2xl border border-[#0a84ff]/30 shadow-[0_0_30px_rgba(10,132,255,0.1)]'
                                            : 'bg-white/[0.03] backdrop-blur-2xl border border-white/5 hover:bg-white/5 hover:-translate-y-1 shadow-xl'
                                    )}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff9f0a] to-[#ff375f] px-4 py-1.5 text-[11px] font-bold text-white shadow-[0_0_15px_rgba(255,159,10,0.5)]">
                                                <Sparkles className="h-3.5 w-3.5" />
                                                POPULAIRE
                                            </span>
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <div className={cn(
                                            'flex h-12 w-12 items-center justify-center rounded-2xl mb-5 shadow-inner',
                                            planColors[key]
                                        )}>
                                            <Icon className="h-6 w-6 drop-shadow-md" />
                                        </div>

                                        <h3 className="text-[18px] font-semibold text-white tracking-tight shadow-sm">
                                            {plan.name}
                                        </h3>
                                        <p className="text-[13px] text-[#86868b] mt-1.5 min-h-[40px]">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="mb-8">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[36px] font-bold text-white tracking-tight shadow-sm">
                                                {`${plan.price}€`}
                                            </span>
                                            <span className="text-[14px] font-medium text-[#86868b]">/mois</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-4 mb-8 flex-1">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <div className={cn("p-0.5 rounded-full bg-white/5 border border-white/10 shrink-0 mt-0.5", planAccent[key])}>
                                                    <Check className="h-3 w-3" />
                                                </div>
                                                <span className="text-[13px] text-[#86868b] leading-tight">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-auto">
                                        {isCurrentPlan ? (
                                            <div className="flex items-center justify-center gap-2 rounded-full bg-white/5 border border-white/5 px-4 py-3 text-[13px] font-semibold text-white shadow-inner">
                                                <Shield className="h-4 w-4" />
                                                {subscription?.status === 'trialing'
                                                    ? 'Plan actuel (essai)'
                                                    : 'Plan actuel'}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleUpgrade(key)}
                                                disabled={loading !== null || !isOwner}
                                                className={cn(
                                                    'flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[14px] font-semibold transition-all shadow-sm active:scale-95',
                                                    isPopular
                                                        ? 'bg-gradient-to-r from-[#ff9f0a] to-[#ff375f] text-white hover:opacity-90 shadow-[0_0_20px_rgba(255,159,10,0.3)]'
                                                        : 'bg-white text-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.2)]',
                                                    (loading !== null || !isOwner) && 'opacity-50 cursor-not-allowed transform-none hover:opacity-50 hover:bg-white'
                                                )}
                                            >
                                                {loading === key ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Rocket className="h-4 w-4" />
                                                )}
                                                {loading === key ? 'Redirection...' : 'Passer au plan'}
                                                {loading !== key && <ArrowRight className="h-4 w-4" />}
                                            </button>
                                        )}
                                        {!isOwner && !isCurrentPlan && (
                                            <p className="mt-3 text-center text-[11px] font-medium text-[#555]">
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
                <div className="rounded-3xl bg-black/20 backdrop-blur-2xl border border-white/5 shadow-inner p-6 md:p-8">
                    <h3 className="text-[17px] font-semibold text-white mb-6 shadow-sm">
                        Questions fréquentes
                    </h3>
                    <div className="space-y-6">
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
                            <div key={i} className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
                                <p className="text-[14px] font-semibold text-white shadow-sm">
                                    {faq.q}
                                </p>
                                <p className="mt-1.5 text-[13px] text-[#86868b] leading-relaxed">
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
