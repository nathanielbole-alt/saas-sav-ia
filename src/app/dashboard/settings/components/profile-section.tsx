'use client'

import { useState, useTransition } from 'react'
import { User, Shield, CheckCircle2, AlertCircle } from 'lucide-react'
import type { Profile } from '@/types/database.types'
import { updateProfile } from '@/lib/actions/settings'
import { cn } from '@/lib/utils'

export function ProfileSection({ profile }: { profile: Profile | null }) {
    const [fullName, setFullName] = useState(profile?.full_name ?? '')
    const [profileStatus, setProfileStatus] = useState<
        'idle' | 'success' | 'error'
    >('idle')
    const [isPending, startTransition] = useTransition()

    const handleProfileSave = () => {
        startTransition(async () => {
            const result = await updateProfile(fullName || null)
            setProfileStatus(result.success ? 'success' : 'error')
            setTimeout(() => setProfileStatus('idle'), 3000)
        })
    }

    // ── Linear-style Profile Section ─────────────────────────────────────────────

    return (
        <section className="mb-12">
            <div className="mb-4">
                <h2 className="text-[15px] font-semibold text-white">Profil personnel</h2>
                <p className="text-[13px] text-[#86868b]">Gérez vos informations personnelles et préférences.</p>
            </div>

            <div className="divide-y divide-white/5 border-y border-white/5">
                {/* Avatar Row */}
                <div className="flex flex-col sm:flex-row sm:items-center py-5 gap-4">
                    <div className="w-full sm:w-1/3">
                        <label className="text-[13px] font-medium text-white">Avatar</label>
                        <p className="text-[12px] text-[#86868b]">Généré depuis votre nom.</p>
                    </div>
                    <div className="w-full sm:w-2/3 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0a84ff]/10 text-[14px] font-semibold text-[#0a84ff] border border-[#0a84ff]/20">
                            {(profile?.full_name ?? profile?.email ?? '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className={cn(
                                'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                                profile?.role === 'owner' ? 'bg-[#ff9f0a]/10 text-[#ff9f0a]' : 'bg-white/5 text-[#86868b]'
                            )}>
                                <Shield className="h-3 w-3" />
                                {profile?.role ?? 'agent'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Row */}
                <div className="flex flex-col sm:flex-row sm:items-center py-5 gap-4">
                    <div className="w-full sm:w-1/3">
                        <label className="text-[13px] font-medium text-white">Adresse email</label>
                        <p className="text-[12px] text-[#86868b]">Liée à votre compte principal.</p>
                    </div>
                    <div className="w-full sm:w-2/3">
                        <input
                            type="text"
                            value={profile?.email ?? ''}
                            disabled
                            className="w-full max-w-md cursor-not-allowed rounded-lg bg-white/5 border border-transparent px-3 py-2 text-[13px] text-[#86868b] outline-none"
                        />
                    </div>
                </div>

                {/* Name Row */}
                <div className="flex flex-col sm:flex-row sm:items-center py-5 gap-4">
                    <div className="w-full sm:w-1/3">
                        <label className="text-[13px] font-medium text-white">Nom complet</label>
                    </div>
                    <div className="w-full sm:w-2/3">
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Votre nom complet"
                            className="w-full max-w-md rounded-lg bg-white/5 border border-white/5 px-3 py-2 text-[13px] text-white outline-none transition-all placeholder:text-[#555] focus:border-[#0a84ff]/50 focus:bg-white/10"
                        />
                    </div>
                </div>
            </div>

            {/* Save Action */}
            <div className="mt-5 flex items-center justify-end gap-3">
                <div className="h-5">
                    {profileStatus === 'success' && (
                        <div className="flex items-center gap-1.5 text-[12px] text-[#30d158]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Enregistré
                        </div>
                    )}
                    {profileStatus === 'error' && (
                        <div className="flex items-center gap-1.5 text-[12px] text-[#ff453a]">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Erreur
                        </div>
                    )}
                </div>
                <button
                    onClick={handleProfileSave}
                    disabled={isPending || fullName === (profile?.full_name ?? '')}
                    className="rounded-lg bg-white text-black px-4 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90"
                >
                    {isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>
        </section>
    )
}
