'use client'

import { useEffect, useState, useTransition, type ChangeEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  updateProfile,
  updateOrganization,
  updateCompanyPolicies,
} from '@/lib/actions/settings'
import { updateBranding } from '@/lib/actions/branding'
import { configureSso } from '@/lib/actions/sso'
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
import { createClient as createSupabaseClient } from '@/lib/supabase/client'

import { PLANS, type PlanKey } from '@/lib/plans'

type PremiumTab = 'branding' | 'manager' | 'sla' | 'sso'
type SsoProvider = 'google' | 'okta' | 'microsoft' | 'custom'

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
  const supabase = createSupabaseClient()
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
  const [activePremiumTab, setActivePremiumTab] = useState<PremiumTab>('branding')

  // Premium: Branding
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null)
  const [brandLogoUrl, setBrandLogoUrl] = useState(organization?.brand_logo_url ?? '')
  const [brandLogoPreviewUrl, setBrandLogoPreviewUrl] = useState(organization?.brand_logo_url ?? '')
  const [brandAccentColor, setBrandAccentColor] = useState(
    organization?.brand_accent_color ?? '#E8856C'
  )
  const [brandEmailFooter, setBrandEmailFooter] = useState(
    organization?.brand_email_footer ?? ''
  )
  const [brandingStatus, setBrandingStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [brandingError, setBrandingError] = useState('')
  const [isBrandingPending, startBrandingTransition] = useTransition()

  // Premium: SSO
  const [ssoProvider, setSsoProvider] = useState<SsoProvider>(
    (organization?.sso_provider as SsoProvider) ?? 'google'
  )
  const [ssoMetadataUrl, setSsoMetadataUrl] = useState(organization?.sso_idp_metadata_url ?? '')
  const [ssoEnabled, setSsoEnabled] = useState(Boolean(organization?.sso_enabled))
  const [ssoStatus, setSsoStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [ssoError, setSsoError] = useState('')
  const [isSsoPending, startSsoTransition] = useTransition()

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

  useEffect(() => {
    if (!brandLogoFile) {
      setBrandLogoPreviewUrl(brandLogoUrl)
      return
    }

    const objectUrl = URL.createObjectURL(brandLogoFile)
    setBrandLogoPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [brandLogoFile, brandLogoUrl])

  const handleBrandLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setBrandLogoFile(file)
  }

  const handleBrandingSave = () => {
    if (!organization) return

    startBrandingTransition(async () => {
      setBrandingStatus('idle')
      setBrandingError('')

      try {
        let uploadedLogoUrl = brandLogoUrl || null

        if (brandLogoFile) {
          const path = `${organization.id}/logo`

          const { error: uploadError } = await supabase.storage
            .from('brand-assets')
            .upload(path, brandLogoFile, {
              upsert: true,
              cacheControl: '3600',
            })

          if (uploadError) {
            setBrandingStatus('error')
            setBrandingError(uploadError.message)
            return
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from('brand-assets').getPublicUrl(path)
          uploadedLogoUrl = publicUrl
        }

        const result = await updateBranding(organization.id, {
          brand_logo_url: uploadedLogoUrl,
          brand_accent_color: brandAccentColor,
          brand_email_footer: brandEmailFooter.trim() || null,
        })

        if (!result.success) {
          setBrandingStatus('error')
          setBrandingError(result.error ?? 'Erreur de sauvegarde')
          return
        }

        setBrandLogoUrl(uploadedLogoUrl ?? '')
        setBrandLogoFile(null)
        setBrandingStatus('success')
        setTimeout(() => setBrandingStatus('idle'), 3000)
        router.refresh()
      } catch (error) {
        setBrandingStatus('error')
        setBrandingError(error instanceof Error ? error.message : 'Erreur inattendue')
      }
    })
  }

  const handleConfigureSso = () => {
    if (!organization) return

    startSsoTransition(async () => {
      setSsoStatus('idle')
      setSsoError('')

      const result = await configureSso(organization.id, {
        sso_provider: ssoProvider,
        sso_idp_metadata_url: ssoMetadataUrl,
      })

      if (!result.success) {
        setSsoStatus('error')
        setSsoError(result.error ?? 'Erreur de configuration SSO')
        return
      }

      setSsoEnabled(true)
      setSsoStatus('success')
      setTimeout(() => setSsoStatus('idle'), 3000)
      router.refresh()
    })
  }

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  const canEditOrg = profile?.role === 'owner' || profile?.role === 'admin'
  const canManageIntegrations = canEditOrg

  const planConfig: Record<string, { label: string; color: string }> = {
    pro: {
      label: 'Pro',
      color: 'bg-[#E8856C]/10 text-[#E8856C]',
    },
    business: {
      label: 'Business',
      color: 'bg-[#ff9f0a]/10 text-[#ff9f0a]',
    },
    enterprise: {
      label: 'Enterprise',
      color: 'bg-[#5e5ce6]/10 text-[#5e5ce6]',
    },
  }
  const plan = planConfig[organization?.plan ?? 'pro'] ?? planConfig.pro
  const isBusinessPlus = planKey === 'business' || planKey === 'enterprise'
  const isEnterprisePlan = planKey === 'enterprise'
  const ssoConfigured = Boolean(organization?.sso_connection_id || ssoMetadataUrl.trim())
  const hasWorkOsConfig = Boolean(process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID)
  const acsUrl = `https://app.savly.io/api/auth/sso/callback/${organization?.id ?? 'organization-id'}`
  const entityId = 'https://app.savly.io'

  return (
    <div className="h-full overflow-y-auto bg-[#0B0B0F]">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-[22px] font-semibold text-[#EDEDED] tracking-tight">
            Parametres
          </h1>
          <p className="mt-1 text-[13px] text-[#888]">
            Gerez votre profil et les parametres de votre organisation
          </p>
        </div>

        {/* Gmail OAuth result banner */}
            {gmailResult === 'success' && (
              <div className="flex items-center gap-3 rounded-xl bg-[#30d158]/10 p-4">
                <CheckCircle2 className="h-5 w-5 text-[#30d158] shrink-0" />
                <p className="text-[13px] text-[#30d158]">
                  Gmail connecte avec succes ! Vous pouvez maintenant synchroniser vos emails.
                </p>
              </div>
            )}
            {gmailResult === 'error' && (
              <div className="flex items-center gap-3 rounded-xl bg-[#ff453a]/10 p-4">
                <AlertCircle className="h-5 w-5 text-[#ff453a] shrink-0" />
                <p className="text-[13px] text-[#ff453a]">
                  Erreur lors de la connexion Gmail. Veuillez reessayer.
                </p>
              </div>
            )}

            {/* Shopify OAuth result banners */}
            {shopifyResult === 'success' && (
              <div className="flex items-center gap-3 rounded-xl bg-[#30d158]/10 p-4">
                <CheckCircle2 className="h-5 w-5 text-[#30d158] shrink-0" />
                <p className="text-[13px] text-[#30d158]">
                  Shopify connecte avec succes ! Vous pouvez synchroniser vos clients et commandes.
                </p>
              </div>
            )}
            {shopifyResult === 'error' && (
              <div className="flex items-center gap-3 rounded-xl bg-[#ff453a]/10 p-4">
                <AlertCircle className="h-5 w-5 text-[#ff453a] shrink-0" />
                <p className="text-[13px] text-[#ff453a]">
                  Erreur lors de la connexion Shopify. Veuillez reessayer.
                </p>
              </div>
            )}

            {/* ── Profile Section ─────────────────────────────────────────── */}
            <div className="rounded-2xl bg-[#131316] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8856C]/10">
                  <User className="h-5 w-5 text-[#E8856C]" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-[#EDEDED]">Profil</h2>
                  <p className="text-[12px] text-[#888]">
                    Informations personnelles
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8856C]/15 text-lg font-semibold text-[#E8856C]">
                    {(profile?.full_name ?? profile?.email ?? '?')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[#EDEDED]">
                      {profile?.full_name ?? profile?.email}
                    </p>
                    <div
                      className={cn(
                        'mt-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                        profile?.role === 'owner'
                          ? 'bg-[#ff9f0a]/10 text-[#ff9f0a]'
                          : 'bg-[#48484a]/30 text-[#888]'
                      )}
                    >
                      <Shield className="h-3 w-3" />
                      {profile?.role ?? 'agent'}
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[12px] font-medium text-[#888] mb-2">
                    Email
                  </label>
                  <input
                    type="text"
                    value={profile?.email ?? ''}
                    disabled
                    className="w-full rounded-lg bg-[#1A1A1F] py-3 px-4 text-[13px] text-[#555] outline-none cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-[11px] text-[#555]">
                    L&apos;email ne peut pas etre modifie
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[12px] font-medium text-[#888] mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Votre nom complet"
                    className="w-full rounded-lg bg-[#1A1A1F] py-3 px-4 text-[13px] text-[#EDEDED] outline-none placeholder:text-[#555] focus:ring-1 focus:ring-[#E8856C]/50 transition-all"
                  />
                </div>

                {/* Save */}
                <div className="pt-4 flex items-center justify-between border-t border-[white/[0.06]]">
                  <div className="h-5">
                    {profileStatus === 'success' && (
                      <div className="flex items-center gap-2 text-[12px] text-[#30d158]">
                        <CheckCircle2 className="h-4 w-4" />
                        Enregistre
                      </div>
                    )}
                    {profileStatus === 'error' && (
                      <div className="flex items-center gap-2 text-[12px] text-[#ff453a]">
                        <AlertCircle className="h-4 w-4" />
                        Erreur lors de la sauvegarde
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleProfileSave}
                    disabled={isPending}
                    className={cn(
                      'rounded-lg px-5 py-2 text-sm font-semibold transition-colors',
                      isPending
                        ? 'bg-[#1A1A1F] text-[#555] cursor-wait'
                        : 'bg-[#E8856C] text-white hover:bg-[#E8856C]/80'
                    )}
                  >
                    {isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Organization Section ────────────────────────────────────── */}
            <div className="rounded-2xl bg-[#131316] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5e5ce6]/10">
                  <Building2 className="h-5 w-5 text-[#5e5ce6]" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-[#EDEDED]">Organisation</h2>
                  <p className="text-[12px] text-[#888]">
                    Parametres de votre entreprise
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Org Name */}
                <div>
                  <label className="block text-[12px] font-medium text-[#888] mb-2">
                    Nom de l&apos;organisation
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={!canEditOrg}
                    placeholder="Nom de votre entreprise"
                    className={cn(
                      'w-full rounded-lg py-3 px-4 text-[13px] outline-none transition-all',
                      canEditOrg
                        ? 'bg-[#1A1A1F] text-[#EDEDED] placeholder:text-[#555] focus:ring-1 focus:ring-[#E8856C]/50'
                        : 'bg-[#1A1A1F] text-[#555] cursor-not-allowed'
                    )}
                  />
                  {!canEditOrg && (
                    <p className="mt-1.5 text-[11px] text-[#555]">
                      Seuls les proprietaires peuvent modifier l&apos;organisation
                    </p>
                  )}
                </div>

                {/* Plan */}
                <div>
                  <label className="block text-[12px] font-medium text-[#888] mb-2">
                    Plan actuel
                  </label>
                  <div
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold uppercase tracking-wider',
                      plan!.color
                    )}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {plan!.label}
                  </div>
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-[12px] font-medium text-[#888] mb-2">
                    Slug
                  </label>
                  <div className="rounded-lg bg-[#1A1A1F] px-4 py-3 text-[13px] text-[#555]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {organization?.slug ?? '—'}
                  </div>
                </div>

                {/* Save */}
                {canEditOrg && (
                  <div className="pt-4 flex items-center justify-between border-t border-[white/[0.06]]">
                    <div className="h-5">
                      {orgStatus === 'success' && (
                        <div className="flex items-center gap-2 text-[12px] text-[#30d158]">
                          <CheckCircle2 className="h-4 w-4" />
                          Enregistre
                        </div>
                      )}
                      {orgStatus === 'error' && (
                        <div className="flex items-center gap-2 text-[12px] text-[#ff453a]">
                          <AlertCircle className="h-4 w-4" />
                          Erreur
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleOrgSave}
                      disabled={isPending}
                      className={cn(
                        'rounded-lg px-5 py-2 text-sm font-semibold transition-colors',
                        isPending
                          ? 'bg-[#1A1A1F] text-[#555] cursor-wait'
                          : 'bg-[#E8856C] text-white hover:bg-[#E8856C]/80'
                      )}
                    >
                      {isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                )}

                {/* Re-onboarding */}
                {canEditOrg && (
                  <div className="pt-4 border-t border-[white/[0.06]]">
                    <button
                      onClick={handleResetOnboarding}
                      disabled={isResettingOnboarding}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-4 py-2.5 text-[12px] font-medium transition-colors',
                        isResettingOnboarding
                          ? 'bg-[#1A1A1F] text-[#555] cursor-wait'
                          : 'bg-[#E8856C]/10 text-[#E8856C] hover:bg-[#E8856C]/20'
                      )}
                    >
                      {isResettingOnboarding ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      Relancer l&apos;onboarding
                    </button>
                    <p className="mt-1.5 text-[11px] text-[#555]">
                      Relancez l&apos;assistant de configuration pour mettre a jour vos parametres
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Premium Features Section ───────────────────────────────── */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#131316] p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8856C]/10">
                  <Zap className="h-5 w-5 text-[#E8856C]" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-[#EDEDED]">
                    Fonctionnalités Premium
                  </h2>
                  <p className="text-[12px] text-[#888]">
                    Branding, manager dédié, SLA et SSO selon votre plan
                  </p>
                </div>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                {(
                  [
                    { id: 'branding', label: 'Branding' },
                    { id: 'manager', label: 'Votre Manager' },
                    { id: 'sla', label: 'SLA & Uptime' },
                    { id: 'sso', label: 'SSO / SAML' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActivePremiumTab(tab.id)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors',
                      activePremiumTab === tab.id
                        ? 'border-[#E8856C]/40 bg-[#E8856C]/15 text-[#E8856C]'
                        : 'border-white/[0.06] bg-[#1A1A1F] text-[#888] hover:text-[#EDEDED]'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activePremiumTab === 'branding' && (
                <div className="rounded-xl border border-white/[0.06] bg-[#0B0B0F] p-5">
                  {isBusinessPlus ? (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[14px] font-semibold text-[#EDEDED]">
                          Custom Branding
                        </h3>
                        <span className="rounded-md bg-[#E8856C]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#E8856C]">
                          Business+
                        </span>
                      </div>

                      <div>
                        <label className="mb-2 block text-[12px] font-medium text-[#888]">
                          Logo personnalisé
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-[#131316]">
                            {brandLogoPreviewUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={brandLogoPreviewUrl}
                                alt="Logo organisation"
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <span className="text-[10px] text-[#555]">Aucun logo</span>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBrandLogoChange}
                              className="w-full rounded-lg border border-white/[0.06] bg-[#1A1A1F] px-3 py-2 text-[12px] text-[#EDEDED] file:mr-3 file:rounded-md file:border-0 file:bg-[#E8856C]/15 file:px-2.5 file:py-1 file:text-[11px] file:font-medium file:text-[#E8856C]"
                            />
                            <button
                              onClick={() => {
                                setBrandLogoFile(null)
                                setBrandLogoUrl('')
                                setBrandLogoPreviewUrl('')
                              }}
                              className="text-[11px] text-[#888] transition-colors hover:text-[#EDEDED]"
                            >
                              Retirer le logo
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[12px] font-medium text-[#888]">
                          Couleur accent
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={brandAccentColor}
                            onChange={(e) => setBrandAccentColor(e.target.value)}
                            className="h-10 w-14 cursor-pointer rounded-lg border border-white/[0.06] bg-[#1A1A1F] p-1"
                          />
                          <div className="flex items-center gap-2 rounded-lg bg-[#1A1A1F] px-3 py-2 text-[12px] text-[#EDEDED]">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: brandAccentColor }}
                            />
                            {brandAccentColor}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[12px] font-medium text-[#888]">
                          Footer email (max 200)
                        </label>
                        <textarea
                          value={brandEmailFooter}
                          onChange={(e) => setBrandEmailFooter(e.target.value)}
                          maxLength={200}
                          rows={3}
                          placeholder="Ex: Merci pour votre confiance — Équipe Savly."
                          className="w-full resize-y rounded-lg bg-[#1A1A1F] px-4 py-3 text-[13px] text-[#EDEDED] outline-none placeholder:text-[#555] focus:ring-1 focus:ring-[#E8856C]/50"
                        />
                        <p className="mt-1.5 text-[11px] text-[#555]">{brandEmailFooter.length}/200</p>
                      </div>

                      <div className="rounded-xl border border-white/[0.06] bg-[#131316] p-4">
                        <p className="mb-2 text-[11px] uppercase tracking-wider text-[#777]">
                          Aperçu dashboard header
                        </p>
                        <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0B0B0F] px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: brandAccentColor }}
                            />
                            <span className="text-[12px] text-[#EDEDED]">Savly</span>
                          </div>
                          <span className="text-[11px] text-[#777]">
                            {brandEmailFooter || 'Footer email non défini'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
                        <div className="h-5">
                          {brandingStatus === 'success' && (
                            <div className="flex items-center gap-2 text-[12px] text-[#30d158]">
                              <CheckCircle2 className="h-4 w-4" />
                              Branding mis à jour
                            </div>
                          )}
                          {brandingStatus === 'error' && (
                            <div className="flex items-center gap-2 text-[12px] text-[#ff453a]">
                              <AlertCircle className="h-4 w-4" />
                              {brandingError || 'Erreur branding'}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={handleBrandingSave}
                          disabled={isBrandingPending}
                          className={cn(
                            'rounded-lg px-5 py-2 text-sm font-semibold transition-colors',
                            isBrandingPending
                              ? 'cursor-wait bg-[#1A1A1F] text-[#555]'
                              : 'bg-[#E8856C] text-white hover:bg-[#E8856C]/80'
                          )}
                        >
                          {isBrandingPending ? 'Enregistrement...' : 'Enregistrer le branding'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#E8856C]/20 bg-[#E8856C]/[0.04] p-6">
                      <p className="text-[14px] font-semibold text-[#EDEDED]">Custom Branding verrouillé</p>
                      <p className="mt-2 text-[12px] text-[#888]">
                        Disponible à partir du plan Business.
                      </p>
                      <a
                        href="/dashboard/billing"
                        className="mt-4 inline-flex rounded-lg bg-[#E8856C] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#E8856C]/80"
                      >
                        Upgrade to Business
                      </a>
                    </div>
                  )}
                </div>
              )}

              {activePremiumTab === 'manager' && (
                <div className="rounded-xl border border-white/[0.06] bg-[#0B0B0F] p-5">
                  {isBusinessPlus ? (
                    <div className="rounded-xl border border-white/[0.06] bg-[#131316] p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8856C]/20 text-[14px] font-semibold text-[#E8856C]">
                          NB
                        </div>
                        <div className="flex-1">
                          <h3 className="text-[14px] font-semibold text-[#EDEDED]">
                            Nathan — Account Manager
                          </h3>
                          <p className="mt-1 text-[12px] text-[#888]">
                            support@savly.com
                          </p>
                          <p className="mt-1 text-[12px] text-[#888]">
                            Lun–Ven, 9h–18h (CET)
                          </p>
                          <a
                            href="https://calendly.com"
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#E8856C] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#E8856C]/80"
                          >
                            Planifier un appel
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#E8856C]/20 bg-[#E8856C]/[0.04] p-6">
                      <p className="text-[14px] font-semibold text-[#EDEDED]">
                        Account Manager dédié verrouillé
                      </p>
                      <p className="mt-2 text-[12px] text-[#888]">
                        Disponible à partir du plan Business.
                      </p>
                      <a
                        href="/dashboard/billing"
                        className="mt-4 inline-flex rounded-lg bg-[#E8856C] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#E8856C]/80"
                      >
                        Upgrade to Business
                      </a>
                    </div>
                  )}
                </div>
              )}

              {activePremiumTab === 'sla' && (
                <div className="rounded-xl border border-white/[0.06] bg-[#0B0B0F] p-5">
                  {isEnterprisePlan ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#131316] p-4">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#30d158]" />
                          <span className="text-[13px] font-medium text-[#EDEDED]">
                            Tous les systèmes opérationnels
                          </span>
                        </div>
                        <a
                          href="https://status.savly.io"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[12px] text-[#E8856C] hover:text-[#EDEDED]"
                        >
                          Voir la page de statut publique →
                        </a>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-white/[0.06] bg-[#131316] p-4">
                          <p className="text-[11px] text-[#777]">Uptime garanti</p>
                          <p className="mt-1 text-[18px] font-semibold text-[#EDEDED]">99.9%</p>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-[#131316] p-4">
                          <p className="text-[11px] text-[#777]">Incidents critiques</p>
                          <p className="mt-1 text-[18px] font-semibold text-[#EDEDED]">&lt; 4h</p>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-[#131316] p-4">
                          <p className="text-[11px] text-[#777]">Maintien mensuel max</p>
                          <p className="mt-1 text-[18px] font-semibold text-[#EDEDED]">43h 48min</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/[0.06] bg-[#131316] p-4">
                        <p className="mb-3 text-[12px] font-medium text-[#EDEDED]">Historique uptime</p>
                        <div className="space-y-2 text-[12px]">
                          {[
                            { month: 'Décembre 2025', uptime: '100%' },
                            { month: 'Janvier 2026', uptime: '100%' },
                            { month: 'Février 2026', uptime: '100%' },
                          ].map((row) => (
                            <div key={row.month} className="flex items-center justify-between rounded-lg bg-[#0B0B0F] px-3 py-2">
                              <span className="text-[#888]">{row.month}</span>
                              <span className="font-semibold text-[#30d158]">{row.uptime}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#E8856C]/20 bg-[#E8856C]/[0.04] p-6">
                      <p className="text-[14px] font-semibold text-[#EDEDED]">SLA Garanti verrouillé</p>
                      <p className="mt-2 text-[12px] text-[#888]">
                        Disponible uniquement sur Enterprise.
                      </p>
                      <a
                        href="/dashboard/billing"
                        className="mt-4 inline-flex rounded-lg bg-[#E8856C] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#E8856C]/80"
                      >
                        Upgrade to Enterprise
                      </a>
                    </div>
                  )}
                </div>
              )}

              {activePremiumTab === 'sso' && (
                <div className="rounded-xl border border-white/[0.06] bg-[#0B0B0F] p-5">
                  {isEnterprisePlan ? (
                    <div className="space-y-5">
                      {!hasWorkOsConfig && (
                        <div className="rounded-xl border border-white/[0.06] bg-[#131316] p-4">
                          <p className="text-[12px] font-medium text-[#EDEDED]">
                            Mode stub SSO actif
                          </p>
                          <p className="mt-1 text-[12px] text-[#888]">
                            L&apos;UI est prête. Le provisioning WorkOS sera branché ensuite.
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#131316] p-4">
                        <div>
                          <p className="text-[13px] font-medium text-[#EDEDED]">Enable SSO</p>
                          <p className="text-[11px] text-[#777]">
                            {ssoConfigured
                              ? 'Configuration détectée, vous pouvez activer SSO'
                              : 'Configurez un provider avant activation'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (!ssoConfigured) return
                            setSsoEnabled((value) => !value)
                          }}
                          disabled={!ssoConfigured}
                          className={cn(
                            'relative h-7 w-12 rounded-full transition-colors',
                            ssoConfigured
                              ? ssoEnabled
                                ? 'bg-[#30d158]'
                                : 'bg-[#555]'
                              : 'cursor-not-allowed bg-[#333]'
                          )}
                        >
                          <span
                            className={cn(
                              'absolute top-1 h-5 w-5 rounded-full bg-white transition-all',
                              ssoEnabled ? 'left-6' : 'left-1'
                            )}
                          />
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-[12px] font-medium text-[#888]">
                            Provider
                          </label>
                          <select
                            value={ssoProvider}
                            onChange={(e) => setSsoProvider(e.target.value as SsoProvider)}
                            className="w-full rounded-lg bg-[#1A1A1F] px-3 py-2.5 text-[13px] text-[#EDEDED] outline-none focus:ring-1 focus:ring-[#E8856C]/50"
                          >
                            <option value="google">Google Workspace</option>
                            <option value="microsoft">Microsoft Azure AD</option>
                            <option value="okta">Okta</option>
                            <option value="custom">Custom SAML</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-2 block text-[12px] font-medium text-[#888]">
                            IdP Metadata URL
                          </label>
                          <input
                            type="url"
                            value={ssoMetadataUrl}
                            onChange={(e) => setSsoMetadataUrl(e.target.value)}
                            placeholder="https://idp.example.com/metadata.xml"
                            className="w-full rounded-lg bg-[#1A1A1F] px-3 py-2.5 text-[13px] text-[#EDEDED] outline-none placeholder:text-[#555] focus:ring-1 focus:ring-[#E8856C]/50"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
                        <div className="h-5">
                          {ssoStatus === 'success' && (
                            <div className="flex items-center gap-2 text-[12px] text-[#30d158]">
                              <CheckCircle2 className="h-4 w-4" />
                              SSO configuré
                            </div>
                          )}
                          {ssoStatus === 'error' && (
                            <div className="flex items-center gap-2 text-[12px] text-[#ff453a]">
                              <AlertCircle className="h-4 w-4" />
                              {ssoError || 'Erreur SSO'}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={handleConfigureSso}
                          disabled={isSsoPending || !ssoMetadataUrl.trim()}
                          className={cn(
                            'rounded-lg px-5 py-2 text-sm font-semibold transition-colors',
                            isSsoPending || !ssoMetadataUrl.trim()
                              ? 'cursor-not-allowed bg-[#1A1A1F] text-[#555]'
                              : 'bg-[#E8856C] text-white hover:bg-[#E8856C]/80'
                          )}
                        >
                          {isSsoPending ? 'Configuration...' : 'Configure SSO'}
                        </button>
                      </div>

                      {ssoEnabled && (
                        <div className="rounded-xl border border-[#30d158]/20 bg-[#30d158]/10 p-4 text-[12px] text-[#30d158]">
                          SSO actif — Les connexions via votre fournisseur d&apos;identité sont activées.
                        </div>
                      )}

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-white/[0.06] bg-[#131316] p-4">
                          <p className="mb-2 text-[11px] uppercase tracking-wider text-[#777]">ACS URL</p>
                          <div className="flex items-center gap-2">
                            <input
                              readOnly
                              value={acsUrl}
                              className="w-full rounded-lg bg-[#0B0B0F] px-3 py-2 text-[11px] text-[#EDEDED] outline-none"
                            />
                            <button
                              onClick={() => handleCopyValue(acsUrl)}
                              className="rounded-lg bg-[#1A1A1F] p-2 text-[#888] hover:text-[#EDEDED]"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-[#131316] p-4">
                          <p className="mb-2 text-[11px] uppercase tracking-wider text-[#777]">SP Entity ID</p>
                          <div className="flex items-center gap-2">
                            <input
                              readOnly
                              value={entityId}
                              className="w-full rounded-lg bg-[#0B0B0F] px-3 py-2 text-[11px] text-[#EDEDED] outline-none"
                            />
                            <button
                              onClick={() => handleCopyValue(entityId)}
                              className="rounded-lg bg-[#1A1A1F] p-2 text-[#888] hover:text-[#EDEDED]"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#E8856C]/20 bg-[#E8856C]/[0.04] p-6">
                      <p className="text-[14px] font-semibold text-[#EDEDED]">SSO / SAML verrouillé</p>
                      <p className="mt-2 text-[12px] text-[#888]">
                        Disponible uniquement sur Enterprise.
                      </p>
                      <a
                        href="/dashboard/billing"
                        className="mt-4 inline-flex rounded-lg bg-[#E8856C] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#E8856C]/80"
                      >
                        Upgrade to Enterprise
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Team Section ────────────────────────────────────────────── */}
            {canEditOrg && (
              <div className="rounded-2xl bg-[#131316] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#30d158]/10">
                    <Users className="h-5 w-5 text-[#30d158]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-[15px] font-semibold text-[#EDEDED]">Equipe</h2>
                    <p className="text-[12px] text-[#888]">
                      Gerez les membres et invitations de votre organisation
                    </p>
                  </div>
                  {/* User counter */}
                  <div className="text-right">
                    <p className="text-[12px] font-semibold text-[#EDEDED]">
                      {teamMembers.length}{planLimit !== Infinity ? ` / ${planLimit}` : ''} <span className="font-normal text-[#888]">utilisateurs</span>
                    </p>
                    {planLimit !== Infinity && (
                      <div className="mt-1 h-1.5 w-24 rounded-full bg-[#1A1A1F] overflow-hidden">
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

                {/* Members list */}
                <div className="space-y-2 mb-6">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-xl bg-[#1A1A1F] px-4 py-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8856C]/15 text-[11px] font-semibold text-[#E8856C]">
                        {(member.full_name ?? member.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#EDEDED] truncate">
                          {member.full_name ?? member.email}
                        </p>
                        <p className="text-[11px] text-[#888] truncate">{member.email}</p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                          member.role === 'owner'
                            ? 'bg-[#ff9f0a]/10 text-[#ff9f0a]'
                            : member.role === 'admin'
                              ? 'bg-[#E8856C]/10 text-[#E8856C]'
                              : 'bg-[#48484a]/30 text-[#888]'
                        )}
                      >
                        <Shield className="h-3 w-3" />
                        {member.role}
                      </span>
                      {profile?.role === 'owner' && member.id !== profile.id && member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={isRemoving === member.id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff453a]/10 text-[#ff453a] hover:bg-[#ff453a]/20 transition-colors"
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
                <div className="border-t border-[white/[0.06]] pt-5 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <UserPlus className="h-4 w-4 text-[#E8856C]" />
                    <p className="text-[13px] font-medium text-[#EDEDED]">Inviter un membre</p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@exemple.com"
                      disabled={!canInvite}
                      className={cn(
                        'w-full md:flex-1 rounded-lg py-3 px-4 text-[13px] outline-none transition-all',
                        canInvite
                          ? 'bg-[#1A1A1F] text-[#EDEDED] placeholder:text-[#555] focus:ring-1 focus:ring-[#E8856C]/50'
                          : 'bg-[#1A1A1F] text-[#555] cursor-not-allowed'
                      )}
                    />
                    <div className="flex gap-3">
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as 'admin' | 'agent')}
                        disabled={!canInvite}
                        className="flex-1 md:w-auto rounded-lg bg-[#1A1A1F] py-3 px-3 text-[13px] text-[#EDEDED] outline-none focus:ring-1 focus:ring-[#E8856C]/50 transition-all appearance-none cursor-pointer"
                      >
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={handleInvite}
                        disabled={isInviting || !canInvite || !inviteEmail.trim()}
                        className={cn(
                          'flex-1 md:flex-none flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-[13px] font-semibold transition-colors',
                          isInviting || !canInvite || !inviteEmail.trim()
                            ? 'bg-[#1A1A1F] text-[#555] cursor-not-allowed'
                            : 'bg-[#E8856C] text-white hover:bg-[#E8856C]/80'
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
                    <p className="mt-2 text-[11px] text-[#ff9f0a]">
                      Limite du plan {PLANS[planKey].name} atteinte ({planLimit} utilisateurs max). Passez au plan superieur.
                    </p>
                  )}
                </div>

                {/* Invite result */}
                {inviteStatus === 'success' && inviteToken && (
                  <div className="mb-6 rounded-xl bg-[#30d158]/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-[#30d158]" />
                      <p className="text-[13px] font-medium text-[#30d158]">Invitation envoyee !</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-lg bg-[#0B0B0F] border border-[white/[0.06]] px-3 py-2 text-[11px] text-[#888] truncate" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {typeof window !== 'undefined' ? `${window.location.origin}/invite/${inviteToken}` : `/invite/${inviteToken}`}
                      </div>
                      <button
                        onClick={() => handleCopyLink(inviteToken)}
                        className="flex items-center gap-1.5 rounded-lg bg-[#1A1A1F] px-3 py-2 text-[11px] font-medium text-[#EDEDED] hover:bg-[#3a3a3c] transition-colors"
                      >
                        {copiedToken ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-[#30d158]" />
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
                  <div className="mb-6 flex items-center gap-2 rounded-xl bg-[#ff453a]/10 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-[#ff453a] shrink-0" />
                    <p className="text-[12px] text-[#ff453a]">{inviteError}</p>
                    <button
                      onClick={() => { setInviteStatus('idle'); setInviteError('') }}
                      className="ml-auto"
                    >
                      <X className="h-3.5 w-3.5 text-[#ff453a] hover:text-[#ff6961]" />
                    </button>
                  </div>
                )}

                {/* Pending invitations */}
                {pendingInvitations.length > 0 && (
                  <div className="border-t border-[white/[0.06]] pt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-[#ff9f0a]" />
                      <p className="text-[13px] font-medium text-[#EDEDED]">
                        Invitations en attente ({pendingInvitations.length})
                      </p>
                    </div>
                    <div className="space-y-2">
                      {pendingInvitations.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center gap-3 rounded-xl bg-[#ff9f0a]/[0.05] px-4 py-3"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff9f0a]/10">
                            <Mail className="h-3.5 w-3.5 text-[#ff9f0a]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-[#EDEDED] truncate">{inv.email}</p>
                            <p className="text-[11px] text-[#888]">
                              Invite par {inv.inviter_name ?? 'inconnu'} · Expire le{' '}
                              {new Date(inv.expires_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                              inv.role === 'admin'
                                ? 'bg-[#E8856C]/10 text-[#E8856C]'
                                : 'bg-[#48484a]/30 text-[#888]'
                            )}
                          >
                            {inv.role}
                          </span>
                          <button
                            onClick={() => handleCopyLink(inv.token)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A1A1F] text-[#888] hover:bg-[#3a3a3c] transition-colors"
                            title="Copier le lien"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRevoke(inv.id)}
                            disabled={isRevoking === inv.id}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff453a]/10 text-[#ff453a] hover:bg-[#ff453a]/20 transition-colors"
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
            <div className="rounded-2xl bg-[#131316] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff9f0a]/10">
                  <ScrollText className="h-5 w-5 text-[#ff9f0a]" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-[#EDEDED]">Politiques SAV</h2>
                  <p className="text-[12px] text-[#888]">
                    Ces regles guident automatiquement les reponses de l&apos;IA.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[12px] font-medium text-[#888] mb-2">
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
                      'w-full resize-y rounded-lg py-3 px-4 text-[13px] outline-none transition-all',
                      canEditOrg
                        ? 'bg-[#1A1A1F] text-[#EDEDED] placeholder:text-[#555] focus:ring-1 focus:ring-[#E8856C]/50'
                        : 'bg-[#1A1A1F] text-[#555] cursor-not-allowed placeholder:text-[#555]'
                    )}
                  />
                  <p className="mt-1.5 text-[11px] text-[#555]">
                    {refundPolicy.length}/5000 caracteres
                  </p>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#888] mb-2">
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
                      'w-full resize-y rounded-lg py-3 px-4 text-[13px] outline-none transition-all',
                      canEditOrg
                        ? 'bg-[#1A1A1F] text-[#EDEDED] placeholder:text-[#555] focus:ring-1 focus:ring-[#E8856C]/50'
                        : 'bg-[#1A1A1F] text-[#555] cursor-not-allowed placeholder:text-[#555]'
                    )}
                  />
                  <p className="mt-1.5 text-[11px] text-[#555]">
                    {savPolicy.length}/5000 caracteres
                  </p>
                </div>

                {canEditOrg && (
                  <div className="pt-4 flex items-center justify-between border-t border-[white/[0.06]]">
                    <div className="h-5">
                      {policyStatus === 'success' && (
                        <div className="flex items-center gap-2 text-[12px] text-[#30d158]">
                          <CheckCircle2 className="h-4 w-4" />
                          Enregistre
                        </div>
                      )}
                      {policyStatus === 'error' && (
                        <div className="flex items-center gap-2 text-[12px] text-[#ff453a]">
                          <AlertCircle className="h-4 w-4" />
                          Erreur
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handlePoliciesSave}
                      disabled={isPolicyPending}
                      className={cn(
                        'rounded-lg px-5 py-2 text-sm font-semibold transition-colors',
                        isPolicyPending
                          ? 'bg-[#1A1A1F] text-[#555] cursor-wait'
                          : 'bg-[#E8856C] text-white hover:bg-[#E8856C]/80'
                      )}
                    >
                      {isPolicyPending ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Integrations Section ────────────────────────────────────── */}
            <div className="rounded-2xl bg-[#131316] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#bf5af2]/10">
                  <Plug className="h-5 w-5 text-[#bf5af2]" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-[#EDEDED]">
                    Integrations
                  </h2>
                  <p className="text-[12px] text-[#888]">
                    Connectez vos applications pour centraliser vos demandes
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* ── Gmail Integration ─────────────────────────────── */}
                <div className="rounded-xl bg-[#1A1A1F] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff453a]/10">
                        <Mail className="h-4 w-4 text-[#ff453a]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-[#EDEDED]">
                            Gmail
                          </p>
                          {isGmailConnected && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#30d158]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#30d158]">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Connecte
                            </span>
                          )}
                          {isGmailError && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#ff453a]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#ff453a]">
                              <AlertCircle className="h-2.5 w-2.5" />
                              Erreur
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#888]">
                          {isGmailConnected
                            ? `Connecte : ${gmailIntegration.email ?? 'compte Gmail'}`
                            : 'Recevoir les emails clients directement dans Savly'}
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
                              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors',
                              isSyncing
                                ? 'bg-[#3a3a3c] text-[#555] cursor-wait'
                                : 'bg-[#E8856C]/10 text-[#E8856C] hover:bg-[#E8856C]/20'
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
                              className="flex items-center gap-1.5 rounded-lg bg-[#ff453a]/10 px-3 py-1.5 text-[11px] font-medium text-[#ff453a] hover:bg-[#ff453a]/20 transition-colors"
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
                          className="flex items-center gap-1.5 rounded-lg bg-[#E8856C] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#E8856C]/80 transition-colors"
                        >
                          <Mail className="h-3 w-3" />
                          Connecter Gmail
                        </a>
                      )}
                      {!isGmailConnected && !canManageIntegrations && (
                        <span className="shrink-0 rounded-lg bg-[#1A1A1F] px-3 py-1.5 text-[11px] font-medium text-[#555] cursor-not-allowed">
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
                          ? 'bg-[#30d158]/10 text-[#30d158]'
                          : 'bg-[#ff453a]/10 text-[#ff453a]'
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
                <div className="rounded-xl bg-[#1A1A1F] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#bf5af2]/10">
                        <Instagram className="h-4 w-4 text-[#bf5af2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-[#EDEDED]">
                            Instagram & Messenger
                          </p>
                          {isMetaConnected && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#30d158]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#30d158]">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Connecté
                            </span>
                          )}
                          {isMetaError && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#ff453a]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#ff453a]">
                              <AlertCircle className="h-2.5 w-2.5" />
                              Erreur
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#888]">
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
                          className="flex items-center gap-1.5 rounded-lg bg-[#ff453a]/10 px-3 py-1.5 text-[11px] font-medium text-[#ff453a] hover:bg-[#ff453a]/20 transition-colors"
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
                          className="flex items-center gap-1.5 rounded-lg bg-[#E8856C] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#E8856C]/80 transition-colors"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Connecter
                        </a>
                      )}
                      {!isMetaConnected && !canManageIntegrations && (
                        <span className="shrink-0 rounded-lg bg-[#1A1A1F] px-3 py-1.5 text-[11px] font-medium text-[#555] cursor-not-allowed">
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
                          ? 'bg-[#30d158]/10 text-[#30d158]'
                          : 'bg-[#ff453a]/10 text-[#ff453a]'
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

                {/* ── Shopify Integration ──────────────────────────── */}
                <div className="rounded-xl bg-[#1A1A1F] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#30d158]/10">
                        <ShoppingBag className="h-4 w-4 text-[#30d158]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-[#EDEDED]">
                            Shopify
                          </p>
                          {isShopifyConnected && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#30d158]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#30d158]">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Connecte
                            </span>
                          )}
                          {isShopifyError && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#ff453a]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#ff453a]">
                              <AlertCircle className="h-2.5 w-2.5" />
                              Erreur
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#888]">
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
                              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors',
                              isShopifySyncing
                                ? 'bg-[#3a3a3c] text-[#555] cursor-wait'
                                : 'bg-[#E8856C]/10 text-[#E8856C] hover:bg-[#E8856C]/20'
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
                              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors',
                              isShopifySyncing
                                ? 'bg-[#3a3a3c] text-[#555] cursor-wait'
                                : 'bg-[#E8856C]/10 text-[#E8856C] hover:bg-[#E8856C]/20'
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
                              className="flex items-center gap-1.5 rounded-lg bg-[#ff453a]/10 px-3 py-1.5 text-[11px] font-medium text-[#ff453a] hover:bg-[#ff453a]/20 transition-colors"
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
                            className="w-48 rounded-lg bg-[#131316] px-3 py-1.5 text-[11px] text-[#EDEDED] outline-none placeholder:text-[#555] focus:ring-1 focus:ring-[#E8856C]/50 transition-all"
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
                              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors',
                              shopInput.match(
                                /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/
                              )
                                ? 'bg-[#E8856C] text-white hover:bg-[#E8856C]/80'
                                : 'bg-[#1A1A1F] text-[#555] cursor-not-allowed'
                            )}
                          >
                            <ShoppingBag className="h-3 w-3" />
                            Connecter
                          </a>
                        </div>
                      )}
                      {!isShopifyConnected && !canManageIntegrations && (
                        <span className="shrink-0 rounded-lg bg-[#1A1A1F] px-3 py-1.5 text-[11px] font-medium text-[#555] cursor-not-allowed">
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
                          ? 'bg-[#30d158]/10 text-[#30d158]'
                          : 'bg-[#ff453a]/10 text-[#ff453a]'
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
                      iconBg: 'bg-[#ffd60a]/10',
                      iconColor: 'text-[#ffd60a]',
                    },
                    {
                      name: 'WooCommerce',
                      description: 'Importer les commandes et clients',
                      icon: ShoppingCart,
                      iconBg: 'bg-[#30d158]/10',
                      iconColor: 'text-[#30d158]',
                    },
                    {
                      name: 'Zendesk',
                      description: 'Migrer vos tickets existants',
                      icon: Headphones,
                      iconBg: 'bg-[#64d2ff]/10',
                      iconColor: 'text-[#64d2ff]',
                    },
                  ] as const
                ).map((integration) => (
                  <div
                    key={integration.name}
                    className="group flex items-center justify-between rounded-xl bg-[#1A1A1F] p-4 hover:bg-[#3a3a3c] transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg',
                          integration.iconBg
                        )}
                      >
                        <integration.icon
                          className={cn('h-4 w-4', integration.iconColor)}
                        />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[#EDEDED]">
                          {integration.name}
                        </p>
                        <p className="text-[11px] text-[#888]">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                    <button
                      disabled
                      className="shrink-0 rounded-lg bg-[#131316] px-3 py-1.5 text-[11px] font-medium text-[#555] cursor-not-allowed"
                    >
                      Bientot disponible
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ── API / Developers Section ────────────────────────────────── */}
            <div className="rounded-2xl bg-[#131316] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#48484a]/30">
                  <Code className="h-5 w-5 text-[#888]" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-[#EDEDED]">
                    API &amp; Developpeurs
                  </h2>
                  <p className="text-[12px] text-[#888]">
                    Acces programmatique a votre compte
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* API Key */}
                <div>
                  <label className="block text-[12px] font-medium text-[#888] mb-2">
                    Cle API
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg bg-[#1A1A1F] px-4 py-3 text-[13px] text-[#555]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      sk-sav-••••••••••••••••••••••••
                    </div>
                    <button
                      disabled
                      className="flex h-[46px] w-[46px] items-center justify-center rounded-lg bg-[#1A1A1F] text-[#555] cursor-not-allowed hover:bg-[#3a3a3c] transition-colors"
                      title="Copier"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#555]">
                    Generation de cle API bientot disponible
                  </p>
                </div>

                {/* Webhook URL */}
                <div>
                  <label className="block text-[12px] font-medium text-[#888] mb-2">
                    URL Webhook
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg bg-[#1A1A1F] px-4 py-3 text-[13px] text-[#555] truncate" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      https://api.savly.com/webhooks/{organization?.slug ?? 'votre-org'}
                    </div>
                    <button
                      disabled
                      className="flex h-[46px] w-[46px] items-center justify-center rounded-lg bg-[#1A1A1F] text-[#555] cursor-not-allowed hover:bg-[#3a3a3c] transition-colors"
                      title="Ouvrir la documentation"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#555]">
                    Configurez des webhooks pour recevoir des evenements en temps reel
                  </p>
                </div>
              </div>
            </div>
          </div>
    </div>
      )
}
