'use client'

import { Code, ExternalLink, Copy } from 'lucide-react'
import type { Organization } from '@/types/database.types'

export function DeveloperSection({
    organization,
}: {
    organization: Organization | null
}) {
    // ── Linear-style Developer Section ──────────────────────────────────────────

    return (
        <section className="mb-12">
            <div className="mb-4">
                <h2 className="text-[15px] font-semibold text-white">API & Développeurs</h2>
                <p className="text-[13px] text-[#86868b]">Accès programmatique à votre compte (Bêta).</p>
            </div>

            <div className="divide-y divide-white/5 border-y border-white/5">
                {/* API Key Row */}
                <div className="flex flex-col sm:flex-row sm:items-center py-5 gap-4">
                    <div className="w-full sm:w-1/3">
                        <label className="text-[13px] font-medium text-white">Clé API</label>
                        <p className="text-[12px] text-[#86868b]">Bientôt disponible.</p>
                    </div>
                    <div className="w-full sm:w-2/3 flex items-center gap-2">
                        <div className="flex-1 rounded-lg bg-white/5 border border-transparent px-3 py-2 text-[13px] text-[#86868b] font-mono">
                            sk-sav-••••••••••••••••••••••••
                        </div>
                        <button
                            disabled
                            className="flex h-[38px] w-[38px] cursor-not-allowed items-center justify-center rounded-lg bg-white/5 border border-transparent text-[#86868b] transition-colors"
                        >
                            <Copy className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Webhook URL Row */}
                <div className="flex flex-col sm:flex-row sm:items-center py-5 gap-4">
                    <div className="w-full sm:w-1/3">
                        <label className="text-[13px] font-medium text-white">URL Webhook</label>
                        <p className="text-[12px] text-[#86868b]">Événements en temps réel.</p>
                    </div>
                    <div className="w-full sm:w-2/3 flex items-center gap-2">
                        <div className="flex-1 truncate rounded-lg bg-white/5 border border-transparent px-3 py-2 text-[13px] text-[#86868b] font-mono">
                            https://api.savly.com/webhooks/{organization?.slug ?? 'votre-org'}
                        </div>
                        <button
                            disabled
                            className="flex h-[38px] w-[38px] cursor-not-allowed items-center justify-center rounded-lg bg-white/5 border border-transparent text-[#86868b] transition-colors"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}
