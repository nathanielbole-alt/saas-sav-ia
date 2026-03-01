'use client'

import { useState, useTransition } from 'react'
import { ScrollText, CheckCircle2, AlertCircle } from 'lucide-react'
import type { Profile, Organization } from '@/types/database.types'
import { updateCompanyPolicies } from '@/lib/actions/settings'
import { cn } from '@/lib/utils'

export function PoliciesSection({
    profile,
    organization,
}: {
    profile: Profile | null
    organization: Organization | null
}) {
    const [refundPolicy, setRefundPolicy] = useState(
        organization?.refund_policy ?? ''
    )
    const [savPolicy, setSavPolicy] = useState(organization?.sav_policy ?? '')
    const [policyStatus, setPolicyStatus] = useState<
        'idle' | 'success' | 'error'
    >('idle')
    const [isPolicyPending, startPolicyTransition] = useTransition()

    const canEditOrg = profile?.role === 'owner' || profile?.role === 'admin'

    const handlePoliciesSave = () => {
        startPolicyTransition(async () => {
            const result = await updateCompanyPolicies(refundPolicy, savPolicy)
            setPolicyStatus(result.success ? 'success' : 'error')
            setTimeout(() => setPolicyStatus('idle'), 3000)
        })
    }

    // ── Linear-style Policies Section ───────────────────────────────────────────

    return (
        <section className="mb-12">
            <div className="mb-4">
                <h2 className="text-[15px] font-semibold text-white">Politiques SAV et IA</h2>
                <p className="text-[13px] text-[#86868b]">Ces règles guident automatiquement les réponses de l'IA.</p>
            </div>

            <div className="divide-y divide-white/5 border-y border-white/5">
                {/* Refund Policy Row */}
                <div className="flex flex-col py-5 gap-3">
                    <div className="flex justify-between items-baseline">
                        <label className="text-[13px] font-medium text-white">Politique de remboursement</label>
                        <span className="text-[11px] text-[#86868b]">{refundPolicy.length}/5000</span>
                    </div>
                    <textarea
                        value={refundPolicy}
                        onChange={(e) => setRefundPolicy(e.target.value)}
                        disabled={!canEditOrg}
                        maxLength={5000}
                        placeholder="Ex: Remboursement sous 14 jours, retour à la charge du client..."
                        rows={3}
                        className={cn(
                            'w-full resize-y rounded-lg border px-3 py-2 text-[13px] outline-none transition-all',
                            canEditOrg
                                ? 'bg-white/5 border-white/5 text-white placeholder:text-[#555] focus:border-[#0a84ff]/50 focus:bg-white/10'
                                : 'cursor-not-allowed bg-white/5 border-transparent text-[#86868b]'
                        )}
                    />
                </div>

                {/* SAV Policy Row */}
                <div className="flex flex-col py-5 gap-3">
                    <div className="flex justify-between items-baseline">
                        <label className="text-[13px] font-medium text-white">Conditions Générales SAV</label>
                        <span className="text-[11px] text-[#86868b]">{savPolicy.length}/5000</span>
                    </div>
                    <textarea
                        value={savPolicy}
                        onChange={(e) => setSavPolicy(e.target.value)}
                        disabled={!canEditOrg}
                        maxLength={5000}
                        placeholder="Ex: Garantie 2 ans, remplacement sous 48h, pas de réparation hors garantie..."
                        rows={3}
                        className={cn(
                            'w-full resize-y rounded-lg border px-3 py-2 text-[13px] outline-none transition-all',
                            canEditOrg
                                ? 'bg-white/5 border-white/5 text-white placeholder:text-[#555] focus:border-[#0a84ff]/50 focus:bg-white/10'
                                : 'cursor-not-allowed bg-white/5 border-transparent text-[#86868b]'
                        )}
                    />
                </div>
            </div>

            {/* Save Action */}
            {canEditOrg && (
                <div className="mt-5 flex items-center justify-end gap-3">
                    <div className="h-5">
                        {policyStatus === 'success' && (
                            <div className="flex items-center gap-1.5 text-[12px] text-[#30d158]">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Enregistré
                            </div>
                        )}
                        {policyStatus === 'error' && (
                            <div className="flex items-center gap-1.5 text-[12px] text-[#ff453a]">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Erreur
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handlePoliciesSave}
                        disabled={isPolicyPending || (refundPolicy === (organization?.refund_policy ?? '') && savPolicy === (organization?.sav_policy ?? ''))}
                        className="rounded-lg bg-white text-black px-4 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90"
                    >
                        {isPolicyPending ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            )}
        </section>
    )
}
