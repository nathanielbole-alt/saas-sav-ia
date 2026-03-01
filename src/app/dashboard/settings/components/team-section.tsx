'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Users,
    Shield,
    Trash2,
    Loader2,
    UserPlus,
    CheckCircle2,
    Link2,
    AlertCircle,
    X,
    Clock,
    Mail,
} from 'lucide-react'
import type { Profile, Organization } from '@/types/database.types'
import {
    sendInvitation,
    getInvitationLink,
    revokeInvitation,
    removeTeamMember,
    type TeamMember,
    type InvitationWithInviter,
} from '@/lib/actions/invitations'
import { PLANS, type PlanKey } from '@/lib/plans'
import { cn } from '@/lib/utils'

export function TeamSection({
    profile,
    organization,
    teamMembers,
    invitations,
}: {
    profile: Profile | null
    organization: Organization | null
    teamMembers: TeamMember[]
    invitations: InvitationWithInviter[]
}) {
    const router = useRouter()
    const canEditOrg = profile?.role === 'owner' || profile?.role === 'admin'

    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState<'admin' | 'agent'>('agent')
    const [inviteStatus, setInviteStatus] = useState<'idle' | 'success' | 'error'>(
        'idle'
    )
    const [inviteError, setInviteError] = useState('')
    const [inviteLink, setInviteLink] = useState<string | null>(null)
    const [isInviting, setIsInviting] = useState(false)
    const [isRevoking, setIsRevoking] = useState<string | null>(null)
    const [isRemoving, setIsRemoving] = useState<string | null>(null)
    const [copiedLink, setCopiedLink] = useState(false)

    const planKey = (organization?.plan ?? 'pro') as PlanKey
    const planLimit = PLANS[planKey]?.limits.users ?? 5
    const pendingInvitations = invitations.filter((i) => i.status === 'pending')
    const totalUsers = teamMembers.length + pendingInvitations.length
    const canInvite = planLimit === Infinity || totalUsers < planLimit

    if (!canEditOrg) return null

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return
        setIsInviting(true)
        setInviteStatus('idle')
        setInviteError('')
        setInviteLink(null)

        const result = await sendInvitation(inviteEmail.trim(), inviteRole)
        setIsInviting(false)

        if (!result.success) {
            setInviteStatus('error')
            setInviteError(result.error ?? 'Erreur inconnue')
            return
        }

        let createdInviteLink: string | null = null
        if (result.invitationId) {
            const linkResult = await getInvitationLink(result.invitationId)
            if (linkResult.success && linkResult.url) {
                createdInviteLink = linkResult.url
            }
        }

        setInviteStatus('success')
        setInviteLink(createdInviteLink)
        setInviteEmail('')
        setInviteRole('agent')
        router.refresh()
    }

    const handleRevoke = async (invitationId: string) => {
        setIsRevoking(invitationId)
        await revokeInvitation(invitationId)
        setIsRevoking(null)
        router.refresh()
    }

    const handleRemoveMember = async (profileId: string) => {
        setIsRemoving(profileId)
        const result = await removeTeamMember(profileId)
        setIsRemoving(null)
        if (!result.success) {
            setInviteStatus('error')
            setInviteError(result.error ?? 'Erreur')
            setTimeout(() => {
                setInviteStatus('idle')
                setInviteError('')
            }, 3000)
        }
        router.refresh()
    }

    const handleCopyLink = async (invitationId: string, existingUrl?: string | null) => {
        const url = existingUrl ?? null
        if (url) {
            await navigator.clipboard.writeText(url)
            setCopiedLink(true)
            setTimeout(() => setCopiedLink(false), 2000)
            return
        }

        const result = await getInvitationLink(invitationId)
        if (!result.success || !result.url) {
            setInviteStatus('error')
            setInviteError(result.error ?? 'Impossible de recuperer le lien')
            return
        }

        await navigator.clipboard.writeText(result.url)
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
    }

    // ── Linear-style Team Section ──────────────────────────────────────────────

    return (
        <section className="mb-12">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-[15px] font-semibold text-white">Équipe et Invitations</h2>
                    <p className="text-[13px] text-[#86868b]">Gérez les membres de votre organisation.</p>
                </div>
                <div className="text-right">
                    <p className="text-[12px] font-semibold text-white">
                        {teamMembers.length}
                        {planLimit !== Infinity ? ` / ${planLimit}` : ''}{' '}
                        <span className="font-normal text-[#86868b]">utilisateurs</span>
                    </p>
                    {planLimit !== Infinity && (
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-white/5 ml-auto">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all',
                                    teamMembers.length >= planLimit ? 'bg-[#ff453a]' : teamMembers.length >= planLimit * 0.8 ? 'bg-[#ff9f0a]' : 'bg-[#30d158]'
                                )}
                                style={{ width: `${Math.min((teamMembers.length / planLimit) * 100, 100)}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="divide-y divide-white/5 border-y border-white/5">
                {/* Invite Form */}
                <div className="py-5">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                            <UserPlus className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-medium text-white">Inviter un membre</h3>
                            <p className="text-[12px] text-[#86868b] mt-0.5">Envoyez une invitation par email pour rejoindre l'équipe.</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="email@exemple.com"
                            disabled={!canInvite}
                            className={cn(
                                'w-full sm:flex-1 max-w-md rounded-lg border px-3 py-2 text-[13px] outline-none transition-all',
                                canInvite
                                    ? 'bg-white/5 border-white/5 text-white placeholder:text-[#555] focus:border-[#0a84ff]/50 focus:bg-white/10'
                                    : 'cursor-not-allowed bg-transparent border-transparent text-[#86868b]'
                            )}
                        />
                        <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as 'admin' | 'agent')}
                            disabled={!canInvite}
                            className="appearance-none rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-[13px] text-white outline-none focus:border-[#0a84ff]/50 sm:w-32 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="agent">Agent</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button
                            onClick={handleInvite}
                            disabled={isInviting || !canInvite || !inviteEmail.trim()}
                            className="rounded-lg bg-white text-black px-4 py-2 text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 whitespace-nowrap"
                        >
                            {isInviting ? 'Envoi...' : 'Envoyer l\'invitation'}
                        </button>
                    </div>

                    {!canInvite && (
                        <p className="mt-3 text-[12px] text-[#ff9f0a] flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Limite du plan {PLANS[planKey].name} atteinte.
                        </p>
                    )}

                    {/* Invite Result */}
                    {inviteStatus === 'success' && inviteLink && (
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-[#30d158]/5 border border-[#30d158]/10 p-3">
                            <div className="flex items-center gap-2 text-[12px] text-[#30d158] font-medium">
                                <CheckCircle2 className="h-4 w-4" /> Invitation envoyée !
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 truncate rounded border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] text-[#86868b] font-mono">
                                    {inviteLink}
                                </div>
                                <button
                                    onClick={() => handleCopyLink('', inviteLink)}
                                    className="flex items-center gap-1.5 rounded bg-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-white/20 transition-colors"
                                >
                                    {copiedLink ? <><CheckCircle2 className="h-3 w-3 text-[#30d158]" /> Copié</> : <><Link2 className="h-3 w-3" /> Copier</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {inviteStatus === 'error' && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#ff453a]/5 border border-[#ff453a]/10 p-3 text-[12px] text-[#ff453a]">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span className="flex-1">{inviteError}</span>
                            <button onClick={() => { setInviteStatus('idle'); setInviteError('') }} className="p-1 hover:text-[#ff6961]">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Active Members List */}
                <div className="py-5">
                    <h3 className="text-[12px] font-semibold text-white mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#86868b]" /> Membres Actifs
                    </h3>
                    <div className="flex flex-col gap-2">
                        {teamMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between py-2 group">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-[12px] font-semibold text-white border border-white/5">
                                        {(member.full_name ?? member.email).slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex flex-col items-start">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-[13px] font-medium text-white">{member.full_name ?? member.email}</p>
                                            <span className={cn(
                                                'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
                                                member.role === 'owner' ? 'bg-[#ff9f0a]/10 text-[#ff9f0a]' :
                                                    member.role === 'admin' ? 'bg-[#0a84ff]/10 text-[#0a84ff]' : 'bg-white/5 text-[#86868b]'
                                            )}>
                                                {member.role === 'owner' ? 'Propriétaire' : member.role === 'admin' ? 'Administrateur' : 'Agent'}
                                            </span>
                                        </div>
                                        <p className="truncate text-[12px] text-[#86868b] mt-0.5">{member.email}</p>
                                    </div>
                                </div>

                                {profile?.role === 'owner' && member.id !== profile.id && member.role !== 'owner' && (
                                    <button
                                        onClick={() => handleRemoveMember(member.id)}
                                        disabled={isRemoving === member.id}
                                        className="p-1.5 text-[#86868b] hover:text-[#ff453a] hover:bg-[#ff453a]/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Retirer le membre"
                                    >
                                        {isRemoving === member.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending Invitations List */}
                {pendingInvitations.length > 0 && (
                    <div className="py-5">
                        <h3 className="text-[12px] font-semibold text-white mb-4 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#86868b]" /> Invitations en attente
                            <span className="bg-white/10 text-[#86868b] px-1.5 py-0.5 rounded text-[10px] font-medium">{pendingInvitations.length}</span>
                        </h3>
                        <div className="flex flex-col gap-2">
                            {pendingInvitations.map((inv) => (
                                <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 group gap-3 border border-transparent rounded-lg hover:bg-white/[0.02] px-2 -mx-2 transition-colors">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-[13px] font-medium text-white">{inv.email}</p>
                                            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-white/5 text-[#86868b]">
                                                {inv.role === 'admin' ? 'Admin' : 'Agent'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[#86868b] mt-0.5">
                                            Invite par {inv.inviter_name ?? 'inconnu'} · Expire le {new Date(inv.expires_at).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 sm:ml-auto">
                                        <button
                                            onClick={() => handleCopyLink(inv.id)}
                                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[#86868b] hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                                        >
                                            <Link2 className="h-3.5 w-3.5" /> Lien
                                        </button>
                                        <button
                                            onClick={() => handleRevoke(inv.id)}
                                            disabled={isRevoking === inv.id}
                                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[#ff453a] hover:bg-[#ff453a]/10 transition-colors border border-transparent hover:border-[#ff453a]/20"
                                        >
                                            {isRevoking === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Révoc.
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
