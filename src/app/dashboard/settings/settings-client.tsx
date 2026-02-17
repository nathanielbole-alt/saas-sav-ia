'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  updateProfile,
  updateOrganization,
  updateCompanyPolicies,
} from '@/lib/actions/settings'
import { resetOnboarding } from '@/lib/actions/onboarding'
import {
  sendInvitation,
  revokeInvitation,
  removeTeamMember,
  type TeamMember,
  type InvitationWithInviter,
} from '@/lib/actions/invitations'
import { disconnectIntegration } from '@/lib/actions/integrations'
import { syncGmailMessages } from '@/lib/actions/gmail'
import { syncShopifyCustomers, syncShopifyOrders } from '@/lib/actions/shopify'
import {
  User,
  Building2,
  Plug,
  CheckCircle2,
  AlertCircle,
  Shield,
  Zap,
  Mail,
  Star,
  ShoppingBag,
  ShoppingCart,
  Headphones,
  Code,
  Copy,
  ExternalLink,
  RefreshCw,
  Unplug,
  Loader2,
  Instagram,
  MessageCircle,
  ScrollText,
  RotateCcw,
  Users,
  UserPlus,
  Trash2,
  X,
  Clock,
  Link2,
} from 'lucide-react'
import type { Profile, Organization } from '@/types/database.types'
import type { IntegrationInfo } from '@/lib/actions/integrations'
import { cn } from '@/lib/utils'

import { PLANS, type PlanKey } from '@/lib/plans'

export default function SettingsClient({
  profile,
  organization,
  integrations,
  teamMembers,
  invitations,
}: {
  profile: Profile | null
  organization: Organization | null
  integrations: IntegrationInfo[]
  teamMembers: TeamMember[]
  invitations: InvitationWithInviter[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gmailResult = searchParams.get('gmail')

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [orgName, setOrgName] = useState(organization?.name ?? '')
  const [profileStatus, setProfileStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [orgStatus, setOrgStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  )
  const [isPending, startTransition] = useTransition()
  const [isPolicyPending, startPolicyTransition] = useTransition()
  const [syncResult, setSyncResult] = useState<{
    success: boolean
    count: number
  } | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const gmailIntegration = integrations.find((i) => i.provider === 'gmail')
  const isGmailConnected = gmailIntegration?.status === 'active'
  const isGmailError = gmailIntegration?.status === 'error'

  // Shopify state
  const shopifyResult = searchParams.get('shopify')
  const shopifyIntegration = integrations.find((i) => i.provider === 'shopify')
  const isShopifyConnected = shopifyIntegration?.status === 'active'
  const isShopifyError = shopifyIntegration?.status === 'error'
  const shopifyShop = (shopifyIntegration?.metadata as Record<string, unknown> | null)?.shop as string | undefined

  const [shopInput, setShopInput] = useState('')
  const [shopifySyncResult, setShopifySyncResult] = useState<{
    success: boolean
    count: number
    type: 'customers' | 'orders'
  } | null>(null)
  const [isShopifySyncing, setIsShopifySyncing] = useState(false)
  const [isShopifyDisconnecting, setIsShopifyDisconnecting] = useState(false)

  // Meta state
  const metaResult = searchParams.get('meta')
  const metaIntegration = integrations.find((i) => i.provider === 'meta')
  const isMetaConnected = metaIntegration?.status === 'active'
  const isMetaError = metaIntegration?.status === 'error'
  const metaMetadata = metaIntegration?.metadata as Record<string, unknown> | null
  const metaPageName = (metaMetadata?.page_name as string) ?? null
  const metaIgUsername = (metaMetadata?.instagram_username as string) ?? null
  const [isMetaDisconnecting, setIsMetaDisconnecting] = useState(false)
  const [refundPolicy, setRefundPolicy] = useState(organization?.refund_policy ?? '')
  const [savPolicy, setSavPolicy] = useState(organization?.sav_policy ?? '')
  const [policyStatus, setPolicyStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false)

  // Team state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'agent'>('agent')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [inviteError, setInviteError] = useState('')
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)
  const [isRevoking, setIsRevoking] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)

  const handleProfileSave = () => {
    startTransition(async () => {
      const result = await updateProfile(fullName || null)
      setProfileStatus(result.success ? 'success' : 'error')
      setTimeout(() => setProfileStatus('idle'), 3000)
    })
  }

  const handleOrgSave = () => {
    startTransition(async () => {
      const result = await updateOrganization(orgName)
      setOrgStatus(result.success ? 'success' : 'error')
      setTimeout(() => setOrgStatus('idle'), 3000)
    })
  }

  const handlePoliciesSave = () => {
    startPolicyTransition(async () => {
      const result = await updateCompanyPolicies(refundPolicy, savPolicy)
      setPolicyStatus(result.success ? 'success' : 'error')
      setTimeout(() => setPolicyStatus('idle'), 3000)
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

  const handleGmailSync = async () => {
    setIsSyncing(true)
    setSyncResult(null)
    try {
      const result = await syncGmailMessages()
      setSyncResult(result)
      setTimeout(() => setSyncResult(null), 5000)
    } catch {
      setSyncResult({ success: false, count: 0 })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleGmailDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      await disconnectIntegration('gmail')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleMetaDisconnect = async () => {
    setIsMetaDisconnecting(true)
    try {
      await disconnectIntegration('meta')
    } finally {
      setIsMetaDisconnecting(false)
    }
  }

  const handleShopifyCustomersSync = async () => {
    setIsShopifySyncing(true)
    setShopifySyncResult(null)
    try {
      const result = await syncShopifyCustomers()
      setShopifySyncResult({ ...result, type: 'customers' })
      setTimeout(() => setShopifySyncResult(null), 5000)
    } catch {
      setShopifySyncResult({ success: false, count: 0, type: 'customers' })
    } finally {
      setIsShopifySyncing(false)
    }
  }

  const handleShopifyOrdersSync = async () => {
    setIsShopifySyncing(true)
    setShopifySyncResult(null)
    try {
      const result = await syncShopifyOrders()
      setShopifySyncResult({ ...result, type: 'orders' })
      setTimeout(() => setShopifySyncResult(null), 5000)
    } catch {
      setShopifySyncResult({ success: false, count: 0, type: 'orders' })
    } finally {
      setIsShopifySyncing(false)
    }
  }

  const handleShopifyDisconnect = async () => {
    setIsShopifyDisconnecting(true)
    try {
      await disconnectIntegration('shopify')
    } finally {
      setIsShopifyDisconnecting(false)
    }
  }

  // Team handlers
  const planKey = (organization?.plan ?? 'pro') as PlanKey
  const planLimit = PLANS[planKey]?.limits.users ?? 5
  const pendingInvitations = invitations.filter((i) => i.status === 'pending')
  const totalUsers = teamMembers.length + pendingInvitations.length
  const canInvite = planLimit === Infinity || totalUsers < planLimit

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setIsInviting(true)
    setInviteStatus('idle')
    setInviteError('')
    setInviteToken(null)

    const result = await sendInvitation(inviteEmail.trim(), inviteRole)
    setIsInviting(false)

    if (!result.success) {
      setInviteStatus('error')
      setInviteError(result.error ?? 'Erreur inconnue')
      return
    }

    setInviteStatus('success')
    setInviteToken(result.token ?? null)
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
      setTimeout(() => { setInviteStatus('idle'); setInviteError('') }, 3000)
    }
    router.refresh()
  }

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(url)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  const canEditOrg = profile?.role === 'owner' || profile?.role === 'admin'
  const canManageIntegrations = canEditOrg

  const planConfig: Record<string, { label: string; color: string }> = {
    pro: {
      label: 'Pro',
      color: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
    },
    business: {
      label: 'Business',
      color: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    },
    enterprise: {
      label: 'Enterprise',
      color: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    },
  }
  const plan = planConfig[organization?.plan ?? 'pro'] ?? planConfig.pro

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight">
            Parametres
          </h1>
          <p className="mt-2 text-[13px] text-zinc-500">
            Gerez votre profil et les parametres de votre organisation
          </p>
        </div>

        {/* Gmail OAuth result banner */}
            {gmailResult === 'success' && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <p className="text-[13px] text-emerald-300">
                  Gmail connecte avec succes ! Vous pouvez maintenant synchroniser vos emails.
                </p>
              </div>
            )}
            {gmailResult === 'error' && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                <p className="text-[13px] text-red-300">
                  Erreur lors de la connexion Gmail. Veuillez reessayer.
                </p>
              </div>
            )}

            {/* Shopify OAuth result banners */}
            {shopifyResult === 'success' && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <p className="text-[13px] text-emerald-300">
                  Shopify connecte avec succes ! Vous pouvez synchroniser vos clients et commandes.
                </p>
              </div>
            )}
            {shopifyResult === 'error' && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                <p className="text-[13px] text-red-300">
                  Erreur lors de la connexion Shopify. Veuillez reessayer.
                </p>
              </div>
            )}

            {/* ── Profile Section ─────────────────────────────────────────── */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                  <User className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-white">Profil</h2>
                  <p className="text-[12px] text-zinc-500">
                    Informations personnelles
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-bold text-white ring-2 ring-white/10 shadow-lg">
                    {(profile?.full_name ?? profile?.email ?? '?')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-white">
                      {profile?.full_name ?? profile?.email}
                    </p>
                    <div
                      className={cn(
                        'mt-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1',
                        profile?.role === 'owner'
                          ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20'
                      )}
                    >
                      <Shield className="h-3 w-3" />
                      {profile?.role ?? 'agent'}
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                    Email
                  </label>
                  <input
                    type="text"
                    value={profile?.email ?? ''}
                    disabled
                    className="w-full rounded-xl border border-white/5 bg-white/[0.02] py-3 px-4 text-[13px] text-zinc-500 outline-none cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-[11px] text-zinc-600">
                    L&apos;email ne peut pas etre modifie
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Votre nom complet"
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500/30 focus:bg-white/10 transition-all"
                  />
                </div>

                {/* Save */}
                <div className="pt-4 flex items-center justify-between border-t border-white/5">
                  <div className="h-5">
                    {profileStatus === 'success' && (
                      <div className="flex items-center gap-2 text-[12px] text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Enregistre
                      </div>
                    )}
                    {profileStatus === 'error' && (
                      <div className="flex items-center gap-2 text-[12px] text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        Erreur lors de la sauvegarde
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleProfileSave}
                    disabled={isPending}
                    className={cn(
                      'rounded-xl px-5 py-2 text-sm font-bold transition-all active:scale-95',
                      isPending
                        ? 'bg-white/10 text-zinc-500 cursor-wait'
                        : 'bg-white text-black hover:bg-zinc-200'
                    )}
                  >
                    {isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Organization Section ────────────────────────────────────── */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
                  <Building2 className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-white">Organisation</h2>
                  <p className="text-[12px] text-zinc-500">
                    Parametres de votre entreprise
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Org Name */}
                <div>
                  <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                    Nom de l&apos;organisation
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={!canEditOrg}
                    placeholder="Nom de votre entreprise"
                    className={cn(
                      'w-full rounded-xl border border-white/5 py-3 px-4 text-[13px] outline-none transition-all',
                      canEditOrg
                        ? 'bg-white/5 text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/30 focus:bg-white/10'
                        : 'bg-white/[0.02] text-zinc-500 cursor-not-allowed'
                    )}
                  />
                  {!canEditOrg && (
                    <p className="mt-1.5 text-[11px] text-zinc-600">
                      Seuls les proprietaires peuvent modifier l&apos;organisation
                    </p>
                  )}
                </div>

                {/* Plan */}
                <div>
                  <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                    Plan actuel
                  </label>
                  <div
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-bold uppercase tracking-wider ring-1',
                      plan!.color
                    )}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {plan!.label}
                  </div>
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                    Slug
                  </label>
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 px-4 py-3 text-[13px] font-mono text-zinc-500">
                    {organization?.slug ?? '—'}
                  </div>
                </div>

                {/* Save */}
                {canEditOrg && (
                  <div className="pt-4 flex items-center justify-between border-t border-white/5">
                    <div className="h-5">
                      {orgStatus === 'success' && (
                        <div className="flex items-center gap-2 text-[12px] text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Enregistre
                        </div>
                      )}
                      {orgStatus === 'error' && (
                        <div className="flex items-center gap-2 text-[12px] text-red-400">
                          <AlertCircle className="h-4 w-4" />
                          Erreur
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleOrgSave}
                      disabled={isPending}
                      className={cn(
                        'rounded-xl px-5 py-2 text-sm font-bold transition-all active:scale-95',
                        isPending
                          ? 'bg-white/10 text-zinc-500 cursor-wait'
                          : 'bg-white text-black hover:bg-zinc-200'
                      )}
                    >
                      {isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                )}

                {/* Re-onboarding */}
                {canEditOrg && (
                  <div className="pt-4 border-t border-white/5">
                    <button
                      onClick={handleResetOnboarding}
                      disabled={isResettingOnboarding}
                      className={cn(
                        'flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-medium ring-1 transition-all',
                        isResettingOnboarding
                          ? 'bg-white/5 text-zinc-500 ring-white/5 cursor-wait'
                          : 'bg-violet-500/10 text-violet-400 ring-violet-500/20 hover:bg-violet-500/20'
                      )}
                    >
                      {isResettingOnboarding ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      Relancer l&apos;onboarding
                    </button>
                    <p className="mt-1.5 text-[11px] text-zinc-600">
                      Relancez l&apos;assistant de configuration pour mettre a jour vos parametres
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Team Section ────────────────────────────────────────────── */}
            {canEditOrg && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                    <Users className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-[15px] font-bold text-white">Equipe</h2>
                    <p className="text-[12px] text-zinc-500">
                      Gerez les membres et invitations de votre organisation
                    </p>
                  </div>
                  {/* User counter */}
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-white">
                      {teamMembers.length}{planLimit !== Infinity ? ` / ${planLimit}` : ''} <span className="font-normal text-zinc-500">utilisateurs</span>
                    </p>
                    {planLimit !== Infinity && (
                      <div className="mt-1 h-1.5 w-24 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            teamMembers.length >= planLimit ? 'bg-red-500' : teamMembers.length >= planLimit * 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
                          )}
                          style={{ width: `${Math.min((teamMembers.length / planLimit) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Members list */}
                <div className="space-y-2 mb-6">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 ring-1 ring-white/5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-[11px] font-bold text-white ring-1 ring-white/10">
                        {(member.full_name ?? member.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-white truncate">
                          {member.full_name ?? member.email}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate">{member.email}</p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1',
                          member.role === 'owner'
                            ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
                            : member.role === 'admin'
                              ? 'bg-violet-500/10 text-violet-400 ring-violet-500/20'
                              : 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20'
                        )}
                      >
                        <Shield className="h-3 w-3" />
                        {member.role}
                      </span>
                      {profile?.role === 'owner' && member.id !== profile.id && member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={isRemoving === member.id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 ring-1 ring-red-500/20 hover:bg-red-500/20 transition-all"
                          title="Retirer"
                        >
                          {isRemoving === member.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Invite form */}
                <div className="border-t border-white/5 pt-5 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <UserPlus className="h-4 w-4 text-emerald-400" />
                    <p className="text-[13px] font-medium text-white">Inviter un membre</p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@exemple.com"
                      disabled={!canInvite}
                      className={cn(
                        'w-full md:flex-1 rounded-xl border border-white/5 py-3 px-4 text-[13px] outline-none transition-all',
                        canInvite
                          ? 'bg-white/5 text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500/30 focus:bg-white/10'
                          : 'bg-white/[0.02] text-zinc-500 cursor-not-allowed'
                      )}
                    />
                    <div className="flex gap-3">
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as 'admin' | 'agent')}
                        disabled={!canInvite}
                        className="flex-1 md:w-auto rounded-xl border border-white/5 bg-white/5 py-3 px-3 text-[13px] text-zinc-200 outline-none focus:border-emerald-500/30 transition-all appearance-none cursor-pointer"
                      >
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={handleInvite}
                        disabled={isInviting || !canInvite || !inviteEmail.trim()}
                        className={cn(
                          'flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-bold transition-all active:scale-95',
                          isInviting || !canInvite || !inviteEmail.trim()
                            ? 'bg-white/10 text-zinc-500 cursor-not-allowed'
                            : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                        )}
                      >
                        {isInviting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                        Inviter
                      </button>
                    </div>
                  </div>
                  {!canInvite && (
                    <p className="mt-2 text-[11px] text-amber-400">
                      Limite du plan {PLANS[planKey].name} atteinte ({planLimit} utilisateurs max). Passez au plan superieur.
                    </p>
                  )}
                </div>

                {/* Invite result */}
                {inviteStatus === 'success' && inviteToken && (
                  <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <p className="text-[13px] font-medium text-emerald-300">Invitation envoyee !</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-lg bg-black/20 border border-white/5 px-3 py-2 text-[11px] font-mono text-zinc-400 truncate">
                        {typeof window !== 'undefined' ? `${window.location.origin}/invite/${inviteToken}` : `/invite/${inviteToken}`}
                      </div>
                      <button
                        onClick={() => handleCopyLink(inviteToken)}
                        className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-[11px] font-medium text-zinc-300 ring-1 ring-white/10 hover:bg-white/10 transition-all"
                      >
                        {copiedToken ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            Copie !
                          </>
                        ) : (
                          <>
                            <Link2 className="h-3 w-3" />
                            Copier
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {inviteStatus === 'error' && (
                  <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                    <p className="text-[12px] text-red-300">{inviteError}</p>
                    <button
                      onClick={() => { setInviteStatus('idle'); setInviteError('') }}
                      className="ml-auto"
                    >
                      <X className="h-3.5 w-3.5 text-red-400 hover:text-red-300" />
                    </button>
                  </div>
                )}

                {/* Pending invitations */}
                {pendingInvitations.length > 0 && (
                  <div className="border-t border-white/5 pt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-amber-400" />
                      <p className="text-[13px] font-medium text-white">
                        Invitations en attente ({pendingInvitations.length})
                      </p>
                    </div>
                    <div className="space-y-2">
                      {pendingInvitations.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center gap-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.03] px-4 py-3"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
                            <Mail className="h-3.5 w-3.5 text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-white truncate">{inv.email}</p>
                            <p className="text-[11px] text-zinc-500">
                              Invite par {inv.inviter_name ?? 'inconnu'} · Expire le{' '}
                              {new Date(inv.expires_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1',
                              inv.role === 'admin'
                                ? 'bg-violet-500/10 text-violet-400 ring-violet-500/20'
                                : 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20'
                            )}
                          >
                            {inv.role}
                          </span>
                          <button
                            onClick={() => handleCopyLink(inv.token)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 transition-all"
                            title="Copier le lien"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRevoke(inv.id)}
                            disabled={isRevoking === inv.id}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 ring-1 ring-red-500/20 hover:bg-red-500/20 transition-all"
                            title="Revoquer"
                          >
                            {isRevoking === inv.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Policies Section ─────────────────────────────────────────── */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                  <ScrollText className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-white">Politiques SAV</h2>
                  <p className="text-[12px] text-zinc-500">
                    Ces regles guident automatiquement les reponses de l&apos;IA.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[12px] font-medium text-zinc-300 mb-2">
                    Politique de remboursement
                  </label>
                  <textarea
                    value={refundPolicy}
                    onChange={(e) => setRefundPolicy(e.target.value)}
                    disabled={!canEditOrg}
                    maxLength={5000}
                    placeholder="Ex: Remboursement sous 14 jours, retour a la charge du client, remboursement sous 5 jours ouvres..."
                    rows={5}
                    className={cn(
                      'w-full resize-y rounded-xl border border-white/10 py-3 px-4 text-[13px] outline-none transition-all',
                      canEditOrg
                        ? 'bg-white/5 text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/30'
                        : 'bg-white/[0.02] text-zinc-500 cursor-not-allowed placeholder:text-zinc-600'
                    )}
                  />
                  <p className="mt-1.5 text-[11px] text-zinc-600">
                    {refundPolicy.length}/5000 caracteres
                  </p>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-zinc-300 mb-2">
                    Politique SAV
                  </label>
                  <textarea
                    value={savPolicy}
                    onChange={(e) => setSavPolicy(e.target.value)}
                    disabled={!canEditOrg}
                    maxLength={5000}
                    placeholder="Ex: Garantie 2 ans, remplacement sous 48h, pas de reparation sur produits hors garantie..."
                    rows={5}
                    className={cn(
                      'w-full resize-y rounded-xl border border-white/10 py-3 px-4 text-[13px] outline-none transition-all',
                      canEditOrg
                        ? 'bg-white/5 text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/30'
                        : 'bg-white/[0.02] text-zinc-500 cursor-not-allowed placeholder:text-zinc-600'
                    )}
                  />
                  <p className="mt-1.5 text-[11px] text-zinc-600">
                    {savPolicy.length}/5000 caracteres
                  </p>
                </div>

                {canEditOrg && (
                  <div className="pt-4 flex items-center justify-between border-t border-white/5">
                    <div className="h-5">
                      {policyStatus === 'success' && (
                        <div className="flex items-center gap-2 text-[12px] text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Enregistre
                        </div>
                      )}
                      {policyStatus === 'error' && (
                        <div className="flex items-center gap-2 text-[12px] text-red-400">
                          <AlertCircle className="h-4 w-4" />
                          Erreur
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handlePoliciesSave}
                      disabled={isPolicyPending}
                      className={cn(
                        'rounded-xl px-5 py-2 text-sm font-bold transition-all active:scale-95',
                        isPolicyPending
                          ? 'bg-white/10 text-zinc-500 cursor-wait'
                          : 'bg-white text-black hover:bg-zinc-200'
                      )}
                    >
                      {isPolicyPending ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Integrations Section ────────────────────────────────────── */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/10 ring-1 ring-fuchsia-500/20">
                  <Plug className="h-5 w-5 text-fuchsia-400" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-white">
                    Integrations
                  </h2>
                  <p className="text-[12px] text-zinc-500">
                    Connectez vos applications pour centraliser vos demandes
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* ── Gmail Integration (live) ─────────────────────────────── */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 ring-1 ring-red-500/20">
                        <Mail className="h-4 w-4 text-red-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-white">
                            Gmail
                          </p>
                          {isGmailConnected && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Connecte
                            </span>
                          )}
                          {isGmailError && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-400 ring-1 ring-red-500/20">
                              <AlertCircle className="h-2.5 w-2.5" />
                              Erreur
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          {isGmailConnected
                            ? `Connecte : ${gmailIntegration.email ?? 'compte Gmail'}`
                            : 'Recevoir les emails clients directement dans SAV IA'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isGmailConnected && (
                        <>
                          <button
                            onClick={handleGmailSync}
                            disabled={isSyncing}
                            className={cn(
                              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium ring-1 transition-all',
                              isSyncing
                                ? 'bg-white/5 text-zinc-500 ring-white/5 cursor-wait'
                                : 'bg-violet-500/10 text-violet-400 ring-violet-500/20 hover:bg-violet-500/20'
                            )}
                          >
                            {isSyncing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            {isSyncing ? 'Sync...' : 'Synchroniser'}
                          </button>
                          {canManageIntegrations && (
                            <button
                              onClick={handleGmailDisconnect}
                              disabled={isDisconnecting}
                              className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-400 ring-1 ring-red-500/20 hover:bg-red-500/20 transition-all"
                            >
                              {isDisconnecting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Unplug className="h-3 w-3" />
                              )}
                              Deconnecter
                            </button>
                          )}
                        </>
                      )}
                      {!isGmailConnected && canManageIntegrations && (
                        <a
                          href="/api/integrations/gmail"
                          className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-black hover:bg-zinc-200 transition-all active:scale-95"
                        >
                          <Mail className="h-3 w-3" />
                          Connecter Gmail
                        </a>
                      )}
                      {!isGmailConnected && !canManageIntegrations && (
                        <span className="shrink-0 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-medium text-zinc-500 ring-1 ring-white/5 cursor-not-allowed">
                          Admin requis
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sync result feedback */}
                  {syncResult && (
                    <div
                      className={cn(
                        'mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px]',
                        syncResult.success
                          ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10'
                          : 'bg-red-500/5 text-red-400 border border-red-500/10'
                      )}
                    >
                      {syncResult.success ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {syncResult.success
                        ? `${syncResult.count} email${syncResult.count !== 1 ? 's' : ''} importe${syncResult.count !== 1 ? 's' : ''}`
                        : 'Erreur de synchronisation'}
                    </div>
                  )}
                </div>

                {/* ── Meta Integration (Instagram + Messenger) ─────────────── */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-fuchsia-500/20" style={{ background: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #F77737 100%)' }}>
                        <Instagram className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-white">
                            Instagram & Messenger
                          </p>
                          {isMetaConnected && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Connecté
                            </span>
                          )}
                          {isMetaError && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-400 ring-1 ring-red-500/20">
                              <AlertCircle className="h-2.5 w-2.5" />
                              Erreur
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          {isMetaConnected
                            ? `${metaPageName ?? 'Page Facebook'}${metaIgUsername ? ` · @${metaIgUsername}` : ''}`
                            : 'Recevoir les DMs Instagram et messages Messenger'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMetaConnected && canManageIntegrations && (
                        <button
                          onClick={handleMetaDisconnect}
                          disabled={isMetaDisconnecting}
                          className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-400 ring-1 ring-red-500/20 hover:bg-red-500/20 transition-all"
                        >
                          {isMetaDisconnecting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Unplug className="h-3 w-3" />
                          )}
                          Déconnecter
                        </button>
                      )}
                      {!isMetaConnected && canManageIntegrations && (
                        <a
                          href="/api/integrations/meta"
                          className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-black hover:bg-zinc-200 transition-all active:scale-95"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Connecter
                        </a>
                      )}
                      {!isMetaConnected && !canManageIntegrations && (
                        <span className="shrink-0 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-medium text-zinc-500 ring-1 ring-white/5 cursor-not-allowed">
                          Admin requis
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta connection result feedback */}
                  {metaResult && (
                    <div
                      className={cn(
                        'mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px]',
                        metaResult === 'success'
                          ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10'
                          : 'bg-red-500/5 text-red-400 border border-red-500/10'
                      )}
                    >
                      {metaResult === 'success' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {metaResult === 'success'
                        ? 'Instagram & Messenger connectés avec succès'
                        : 'Erreur de connexion Meta'}
                    </div>
                  )}
                </div>

                {/* ── Shopify Integration (live) ──────────────────────────── */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                        <ShoppingBag className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-white">
                            Shopify
                          </p>
                          {isShopifyConnected && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Connecte
                            </span>
                          )}
                          {isShopifyError && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-400 ring-1 ring-red-500/20">
                              <AlertCircle className="h-2.5 w-2.5" />
                              Erreur
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          {isShopifyConnected
                            ? `Connecte : ${shopifyShop ?? 'boutique Shopify'}`
                            : 'Importer les commandes et clients Shopify'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isShopifyConnected && (
                        <>
                          <button
                            onClick={handleShopifyCustomersSync}
                            disabled={isShopifySyncing}
                            className={cn(
                              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium ring-1 transition-all',
                              isShopifySyncing
                                ? 'bg-white/5 text-zinc-500 ring-white/5 cursor-wait'
                                : 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20 hover:bg-emerald-500/20'
                            )}
                          >
                            {isShopifySyncing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Clients
                          </button>
                          <button
                            onClick={handleShopifyOrdersSync}
                            disabled={isShopifySyncing}
                            className={cn(
                              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium ring-1 transition-all',
                              isShopifySyncing
                                ? 'bg-white/5 text-zinc-500 ring-white/5 cursor-wait'
                                : 'bg-violet-500/10 text-violet-400 ring-violet-500/20 hover:bg-violet-500/20'
                            )}
                          >
                            {isShopifySyncing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Commandes
                          </button>
                          {canManageIntegrations && (
                            <button
                              onClick={handleShopifyDisconnect}
                              disabled={isShopifyDisconnecting}
                              className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-400 ring-1 ring-red-500/20 hover:bg-red-500/20 transition-all"
                            >
                              {isShopifyDisconnecting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Unplug className="h-3 w-3" />
                              )}
                              Deconnecter
                            </button>
                          )}
                        </>
                      )}
                      {!isShopifyConnected && canManageIntegrations && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={shopInput}
                            onChange={(e) => setShopInput(e.target.value)}
                            placeholder="mon-shop.myshopify.com"
                            className="w-48 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-500/30 transition-all"
                          />
                          <a
                            href={
                              shopInput.match(
                                /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/
                              )
                                ? `/api/integrations/shopify?shop=${encodeURIComponent(shopInput)}`
                                : '#'
                            }
                            onClick={(e) => {
                              if (
                                !shopInput.match(
                                  /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/
                                )
                              ) {
                                e.preventDefault()
                              }
                            }}
                            className={cn(
                              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95',
                              shopInput.match(
                                /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/
                              )
                                ? 'bg-white text-black hover:bg-zinc-200'
                                : 'bg-white/10 text-zinc-500 cursor-not-allowed'
                            )}
                          >
                            <ShoppingBag className="h-3 w-3" />
                            Connecter
                          </a>
                        </div>
                      )}
                      {!isShopifyConnected && !canManageIntegrations && (
                        <span className="shrink-0 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-medium text-zinc-500 ring-1 ring-white/5 cursor-not-allowed">
                          Admin requis
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Shopify sync result feedback */}
                  {shopifySyncResult && (
                    <div
                      className={cn(
                        'mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px]',
                        shopifySyncResult.success
                          ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10'
                          : 'bg-red-500/5 text-red-400 border border-red-500/10'
                      )}
                    >
                      {shopifySyncResult.success ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {shopifySyncResult.success
                        ? `${shopifySyncResult.count} ${shopifySyncResult.type === 'customers' ? 'client' : 'commande'}${shopifySyncResult.count !== 1 ? 's' : ''} importe${shopifySyncResult.count !== 1 ? 's' : ''}`
                        : 'Erreur de synchronisation'}
                    </div>
                  )}
                </div>

                {/* ── Other integrations (coming soon) ─────────────────────── */}
                {(
                  [
                    {
                      name: 'Google Reviews',
                      description: 'Synchroniser les avis Google pour repondre',
                      icon: Star,
                      iconBg: 'bg-amber-500/10 ring-amber-500/20',
                      iconColor: 'text-amber-400',
                    },
                    {
                      name: 'WooCommerce',
                      description: 'Importer les commandes et clients',
                      icon: ShoppingCart,
                      iconBg: 'bg-violet-500/10 ring-violet-500/20',
                      iconColor: 'text-violet-400',
                    },
                    {
                      name: 'Zendesk',
                      description: 'Migrer vos tickets existants',
                      icon: Headphones,
                      iconBg: 'bg-sky-500/10 ring-sky-500/20',
                      iconColor: 'text-sky-400',
                    },
                  ] as const
                ).map((integration) => (
                  <div
                    key={integration.name}
                    className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg ring-1',
                          integration.iconBg
                        )}
                      >
                        <integration.icon
                          className={cn('h-4 w-4', integration.iconColor)}
                        />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-white">
                          {integration.name}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                    <button
                      disabled
                      className="shrink-0 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-medium text-zinc-500 ring-1 ring-white/5 cursor-not-allowed"
                    >
                      Bientot disponible
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ── API / Developers Section ────────────────────────────────── */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-500/10 ring-1 ring-zinc-500/20">
                  <Code className="h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-white">
                    API &amp; Developpeurs
                  </h2>
                  <p className="text-[12px] text-zinc-500">
                    Acces programmatique a votre compte
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* API Key */}
                <div>
                  <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                    Cle API
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/5 px-4 py-3 text-[13px] font-mono text-zinc-600">
                      sk-sav-••••••••••••••••••••••••
                    </div>
                    <button
                      disabled
                      className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-white/5 text-zinc-500 ring-1 ring-white/5 cursor-not-allowed hover:bg-white/10 transition-colors"
                      title="Copier"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-zinc-600">
                    Generation de cle API bientot disponible
                  </p>
                </div>

                {/* Webhook URL */}
                <div>
                  <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                    URL Webhook
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/5 px-4 py-3 text-[13px] font-mono text-zinc-600 truncate">
                      https://api.sav-ia.com/webhooks/{organization?.slug ?? 'votre-org'}
                    </div>
                    <button
                      disabled
                      className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-white/5 text-zinc-500 ring-1 ring-white/5 cursor-not-allowed hover:bg-white/10 transition-colors"
                      title="Ouvrir la documentation"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-zinc-600">
                    Configurez des webhooks pour recevoir des evenements en temps reel
                  </p>
                </div>
              </div>
            </div>
          </div>
    </div>
      )
}
