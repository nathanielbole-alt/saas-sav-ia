'use client'

import { useState, useTransition } from 'react'
import { Building2, Zap, CheckCircle2, AlertCircle, RotateCcw, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Profile, Organization } from '@/types/database.types'
import { updateOrganization } from '@/lib/actions/settings'
import { resetOnboarding } from '@/lib/actions/onboarding'
import { PLANS, type PlanKey } from '@/lib/plans'
import { cn } from '@/lib/utils'

export function OrganizationSection({
    profile,
    organization,
}: {
    profile: Profile | null
    organization: Organization | null
}) {
    const router = useRouter()
    const [orgName, setOrgName] = useState(organization?.name ?? '')
    const [orgStatus, setOrgStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [isPending, startTransition] = useTransition()
    const [isResettingOnboarding, setIsResettingOnboarding] = useState(false)

    const canEditOrg = profile?.role === 'owner' || profile?.role === 'admin'

    const planConfig: Record<string, { label: string; color: string }> = {
        pro: {
            label: 'Pro',
            color: 'bg-[#0a84ff]/20 text-[#0a84ff]',
        },
        business: {
            label: 'Business',
            color: 'bg-[#ff9f0a]/20 text-[#ff9f0a]',
        },
        enterprise: {
            label: 'Enterprise',
            color: 'bg-[#5e5ce6]/10 text-[#5e5ce6]',
        },
    }
    const plan = planConfig[organization?.plan ?? 'pro'] ?? planConfig.pro

    const handleOrgSave = () => {
        startTransition(async () => {
            const result = await updateOrganization(orgName)
            setOrgStatus(result.success ? 'success' : 'error')
            setTimeout(() => setOrgStatus('idle'), 3000)
        })
    }

    const handleResetOnboarding = async () => {
        setIsResettingOnboarding(true)
        const result = await resetOnboarding()
        if (result.success) {
            router.push('/dashboard/onboarding')
        } else {
            setIsResettingOnboarding(false)
        }
    }

    // ── Linear-style Organization Section ────────────────────────────────────────

    return (
        <section className="mb-12">
            <div className="mb-4">
                <h2 className="text-[15px] font-semibold text-white">Organisation</h2>
                <p className="text-[13px] text-[#86868b]">Gérez les détails de votre entreprise et votre forfait actuel.</p>
            </div>

            <div className="divide-y divide-white/5 border-y border-white/5">
                {/* Name Row */}
                <div className="flex flex-col sm:flex-row sm:items-center py-5 gap-4">
                    <div className="w-full sm:w-1/3">
                        <label className="text-[13px] font-medium text-white">Nom de l'entreprise</label>
                        <p className="text-[12px] text-[#86868b]">Identifiant public.</p>
                    </div>
                    <div className="w-full sm:w-2/3">
                        <input
                            type="text"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            disabled={!canEditOrg}
                            placeholder="Nom de votre entreprise"
                            className={cn(
                                'w-full max-w-md rounded-lg border px-3 py-2 text-[13px] outline-none transition-all',
                                canEditOrg
                                    ? 'bg-white/5 border-white/5 text-white placeholder:text-[#555] focus:border-[#0a84ff]/50 focus:bg-white/10'
                                    : 'cursor-not-allowed bg-white/5 border-transparent text-[#86868b]'
                            )}
                        />
                    </div>
                </div>

                {/* Plan Row */}
                <div className="flex flex-col sm:flex-row sm:items-center py-5 gap-4">
                    <div className="w-full sm:w-1/3">
                        <label className="text-[13px] font-medium text-white">Forfait actuel</label>
                        <p className="text-[12px] text-[#86868b]">Facturation et limites.</p>
                    </div>
                    <div className="w-full sm:w-2/3 flex items-center justify-between max-w-md">
                        <div className={cn(
                            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider border',
                            organization?.plan === 'pro' ? 'bg-[#0a84ff]/10 text-[#0a84ff] border-[#0a84ff]/20' :
                                organization?.plan === 'business' ? 'bg-[#ff9f0a]/10 text-[#ff9f0a] border-[#ff9f0a]/20' :
                                    'bg-[#5e5ce6]/10 text-[#5e5ce6] border-[#5e5ce6]/20'
                        )}>
                            <Zap className="h-3 w-3" />
                            {plan!.label}
                        </div>
                        <button
                            className="text-[13px] font-medium text-[#0a84ff] hover:text-[#0a84ff]/80 transition-colors"
                            onClick={() => router.push('/dashboard/billing')}
                        >
                            Gérer l'abonnement
                        </button>
                    </div>
                </div>

                {/* Relancer Onboarding Row */}
                <div className="flex flex-col sm:flex-row sm:items-center py-5 gap-4">
                    <div className="w-full sm:w-1/3">
                        <label className="text-[13px] font-medium text-white">Assistant de configuration</label>
                        <p className="text-[12px] text-[#86868b]">Mettre à jour vos paramètres initiaux.</p>
                    </div>
                    <div className="w-full sm:w-2/3">
                        <button
                            onClick={handleResetOnboarding}
                            disabled={isResettingOnboarding || !canEditOrg}
                            className={cn(
                                'flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors border',
                                !canEditOrg ? 'cursor-not-allowed opacity-50 bg-white/5 text-[#86868b] border-transparent' :
                                    isResettingOnboarding
                                        ? 'cursor-wait bg-white/5 text-[#86868b] border-white/5'
                                        : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                            )}
                        >
                            {isResettingOnboarding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                            Relancer l'onboarding
                        </button>
                    </div>
                </div>
            </div>

            {/* Save Action */}
            {canEditOrg && (
                <div className="mt-5 flex items-center justify-end gap-3">
                    <div className="h-5">
                        {orgStatus === 'success' && (
                            <div className="flex items-center gap-1.5 text-[12px] text-[#30d158]">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Enregistré
                            </div>
                        )}
                        {orgStatus === 'error' && (
                            <div className="flex items-center gap-1.5 text-[12px] text-[#ff453a]">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Erreur
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleOrgSave}
                        disabled={isPending || orgName === (organization?.name ?? '')}
                        className="rounded-lg bg-white text-black px-4 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90"
                    >
                        {isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            )}
        </section>
    )
}
