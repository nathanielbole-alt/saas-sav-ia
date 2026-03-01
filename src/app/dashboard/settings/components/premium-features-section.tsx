'use client'

import { useState, useTransition, useEffect, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, CheckCircle2, AlertCircle, ExternalLink, Copy } from 'lucide-react'
import type { Organization } from '@/types/database.types'
import { updateBranding } from '@/lib/actions/branding'
import { configureSso } from '@/lib/actions/sso'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import { PLANS, type PlanKey } from '@/lib/plans'
import { cn } from '@/lib/utils'

type PremiumTab = 'branding' | 'manager' | 'sla' | 'sso'
type SsoProvider = 'google' | 'okta' | 'microsoft' | 'custom'

export function PremiumFeaturesSection({
    organization,
}: {
    organization: Organization | null
}) {
    const router = useRouter()
    const supabase = createSupabaseClient()
    const [activePremiumTab, setActivePremiumTab] = useState<PremiumTab>('branding')

    const planKey = (organization?.plan ?? 'pro') as PlanKey
    const isBusinessPlus = planKey === 'business' || planKey === 'enterprise'
    const isEnterprisePlan = planKey === 'enterprise'

    // Premium: Branding
    const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null)
    const [brandLogoUrl, setBrandLogoUrl] = useState(
        organization?.brand_logo_url ?? ''
    )
    const [brandLogoPreviewUrl, setBrandLogoPreviewUrl] = useState(
        organization?.brand_logo_url ?? ''
    )
    const [brandAccentColor, setBrandAccentColor] = useState(
        organization?.brand_accent_color ?? '#E8856C'
    )
    const [brandEmailFooter, setBrandEmailFooter] = useState(
        organization?.brand_email_footer ?? ''
    )
    const [brandingStatus, setBrandingStatus] = useState<
        'idle' | 'success' | 'error'
    >('idle')
    const [brandingError, setBrandingError] = useState('')
    const [isBrandingPending, startBrandingTransition] = useTransition()

    // Premium: SSO
    const [ssoProvider, setSsoProvider] = useState<SsoProvider>(
        (organization?.sso_provider as SsoProvider) ?? 'google'
    )
    const [ssoMetadataUrl, setSsoMetadataUrl] = useState(
        organization?.sso_idp_metadata_url ?? ''
    )
    const [ssoEnabled, setSsoEnabled] = useState(Boolean(organization?.sso_enabled))
    const [ssoStatus, setSsoStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [ssoError, setSsoError] = useState('')
    const [isSsoPending, startSsoTransition] = useTransition()

    const ssoConfigured = Boolean(
        organization?.sso_connection_id || ssoMetadataUrl.trim()
    )
    const hasWorkOsConfig = Boolean(process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID)
    const acsUrl = `https://app.savly.io/api/auth/sso/callback/${organization?.id ?? 'organization-id'}`
    const entityId = 'https://app.savly.io'

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
                setBrandingError(
                    error instanceof Error ? error.message : 'Erreur inattendue'
                )
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

    return (
        <section className="mb-12">
            <div className="mb-4">
                <h2 className="text-[15px] font-semibold text-white">Fonctionnalités Premium</h2>
                <p className="text-[13px] text-[#86868b]">Branding, manager dédié, SLA et SSO selon votre plan.</p>
            </div>

            <div className="flex items-center gap-6 border-b border-white/5 mb-6">
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
                            'pb-3 text-[13px] font-medium transition-colors border-b-2',
                            activePremiumTab === tab.id
                                ? 'border-white text-white'
                                : 'border-transparent text-[#86868b] hover:text-white'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activePremiumTab === 'branding' && (
                <div>
                    {isBusinessPlus ? (
                        <div className="divide-y divide-white/5 border-y border-white/5">
                            <div className="py-5 flex items-center justify-between">
                                <h3 className="text-[14px] font-medium text-white">
                                    Custom Branding
                                </h3>
                                <span className="rounded px-1.5 py-0.5 bg-white/10 text-[10px] uppercase font-semibold text-white">
                                    Business+
                                </span>
                            </div>

                            <div className="py-5">
                                <label className="mb-3 block text-[13px] font-medium text-white">
                                    Logo personnalisé
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                        {brandLogoPreviewUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={brandLogoPreviewUrl}
                                                alt="Logo organisation"
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-[10px] text-[#86868b]">Aucun logo</span>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleBrandLogoChange}
                                            className="w-full rounded-lg border border-transparent bg-white/5 px-3 py-2 text-[12px] text-white file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-[11px] file:text-white"
                                        />
                                        <button
                                            onClick={() => {
                                                setBrandLogoFile(null)
                                                setBrandLogoUrl('')
                                                setBrandLogoPreviewUrl('')
                                            }}
                                            className="text-[12px] text-[#ff453a] hover:underline"
                                        >
                                            Retirer
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="py-5 flex items-center justify-between">
                                <div>
                                    <label className="block text-[13px] font-medium text-white">
                                        Couleur accent
                                    </label>
                                    <p className="text-[12px] text-[#86868b] mt-0.5">Couleur principale de votre espace</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={brandAccentColor}
                                        onChange={(e) => setBrandAccentColor(e.target.value)}
                                        className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
                                    />
                                    <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-[12px] text-white font-mono">
                                        {brandAccentColor}
                                    </div>
                                </div>
                            </div>

                            <div className="py-5">
                                <label className="mb-3 block text-[13px] font-medium text-white">
                                    Footer email (max 200 characteres)
                                </label>
                                <textarea
                                    value={brandEmailFooter}
                                    onChange={(e) => setBrandEmailFooter(e.target.value)}
                                    maxLength={200}
                                    rows={2}
                                    placeholder="Ex: Merci pour votre confiance — Équipe Savly."
                                    className="w-full resize-y rounded-lg bg-white/5 px-3 py-2 text-[13px] text-white outline-none transition-all placeholder:text-[#555] border border-transparent focus:border-[#0a84ff]/50"
                                />
                                <div className="mt-3 rounded-lg border border-white/5 bg-white/5 p-3">
                                    <p className="mb-2 text-[10px] text-[#86868b] uppercase tracking-wider">
                                        Aperçu dashboard header
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="h-2 w-2 rounded-full"
                                                style={{ backgroundColor: brandAccentColor }}
                                            />
                                            <span className="text-[12px] text-white">Savly</span>
                                        </div>
                                        <span className="text-[11px] text-[#86868b]">
                                            {brandEmailFooter || 'Footer email non défini'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="py-5 flex items-center justify-end gap-3">
                                <div className="h-5">
                                    {brandingStatus === 'success' && (
                                        <div className="flex items-center gap-1.5 text-[12px] text-[#30d158]">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Enregistré
                                        </div>
                                    )}
                                    {brandingStatus === 'error' && (
                                        <div className="flex items-center gap-1.5 text-[12px] text-[#ff453a]">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            {brandingError || 'Erreur'}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleBrandingSave}
                                    disabled={isBrandingPending}
                                    className="rounded-lg bg-white text-black px-4 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-50 hover:bg-white/90"
                                >
                                    {isBrandingPending
                                        ? 'Enregistrement...'
                                        : 'Enregistrer'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/5 py-12 text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0a84ff]/20">
                                <Zap className="h-6 w-6 text-[#0a84ff]" />
                            </div>
                            <h3 className="text-[15px] font-semibold text-white">
                                Custom Branding
                            </h3>
                            <p className="mt-2 text-[13px] text-[#86868b]">
                                Disponible à partir du plan <span className="text-white font-medium">Business</span>.
                            </p>
                            <a
                                href="/dashboard/billing"
                                className="mt-6 rounded-lg bg-white text-black px-4 py-2 text-[13px] font-semibold hover:bg-white/90"
                            >
                                Mettre à niveau
                            </a>
                        </div>
                    )}
                </div>
            )}

            {activePremiumTab === 'manager' && (
                <div>
                    {isBusinessPlus ? (
                        <div className="rounded-xl border border-white/5 bg-white/5 p-5">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[14px] font-semibold text-white">
                                    NB
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[14px] font-medium text-white">
                                        Nathan — Account Manager
                                    </h3>
                                    <p className="mt-1 text-[12px] text-[#86868b]">
                                        support@savly.com
                                    </p>
                                    <p className="mt-1 text-[12px] text-[#86868b]">
                                        Lun–Ven, 9h–18h (CET)
                                    </p>
                                    <a
                                        href="https://calendly.com"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-[12px] font-semibold hover:bg-white/90"
                                    >
                                        Planifier un appel
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/5 py-12 text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                                <Zap className="h-6 w-6 text-white text-opacity-50" />
                            </div>
                            <h3 className="text-[15px] font-semibold text-white">
                                Account Manager dédié
                            </h3>
                            <p className="mt-2 text-[13px] text-[#86868b]">
                                Disponible à partir du plan <span className="text-white font-medium">Business</span>.
                            </p>
                            <a
                                href="/dashboard/billing"
                                className="mt-6 rounded-lg bg-white text-black px-4 py-2 text-[13px] font-semibold hover:bg-white/90"
                            >
                                Mettre à niveau
                            </a>
                        </div>
                    )}
                </div>
            )}

            {activePremiumTab === 'sla' && (
                <div>
                    {isEnterprisePlan ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#30d158]" />
                                    <span className="text-[13px] font-medium text-white">
                                        Tous les systèmes opérationnels
                                    </span>
                                </div>
                                <a
                                    href="https://status.savly.io"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[12px] text-[#86868b] hover:text-white underline"
                                >
                                    Page de statut
                                </a>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                                    <p className="text-[11px] text-[#86868b]">Uptime garanti</p>
                                    <p className="mt-1 text-[18px] font-semibold text-white">
                                        99.9%
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                                    <p className="text-[11px] text-[#86868b]">Incidents critiques</p>
                                    <p className="mt-1 text-[18px] font-semibold text-white">
                                        &lt; 4h
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                                    <p className="text-[11px] text-[#86868b]">Maintien mensuel max</p>
                                    <p className="mt-1 text-[18px] font-semibold text-white">
                                        43h 48min
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-white/5 p-4 mt-6">
                                <p className="mb-3 text-[12px] font-medium text-white">
                                    Historique uptime
                                </p>
                                <div className="space-y-2 text-[12px]">
                                    {[
                                        { month: 'Décembre 2025', uptime: '100%' },
                                        { month: 'Janvier 2026', uptime: '100%' },
                                        { month: 'Février 2026', uptime: '100%' },
                                    ].map((row) => (
                                        <div
                                            key={row.month}
                                            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                                        >
                                            <span className="text-[#86868b]">{row.month}</span>
                                            <span className="font-semibold text-[#30d158]">
                                                {row.uptime}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/5 py-12 text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                                <Zap className="h-6 w-6 text-white text-opacity-50" />
                            </div>
                            <h3 className="text-[15px] font-semibold text-white">
                                SLA &amp; Uptime Garanti
                            </h3>
                            <p className="mt-2 text-[13px] text-[#86868b]">
                                Disponible uniquement sur le plan <span className="text-white font-medium">Enterprise</span>.
                            </p>
                            <a
                                href="/dashboard/billing"
                                className="mt-6 rounded-lg bg-white text-black px-4 py-2 text-[13px] font-semibold hover:bg-white/90"
                            >
                                Mettre à niveau
                            </a>
                        </div>
                    )}
                </div>
            )}

            {activePremiumTab === 'sso' && (
                <div>
                    {isEnterprisePlan ? (
                        <div className="divide-y divide-white/5 border-y border-white/5">
                            {!hasWorkOsConfig && (
                                <div className="py-4">
                                    <p className="text-[12px] font-medium text-white mb-1">
                                        Mode stub SSO actif
                                    </p>
                                    <p className="text-[12px] text-[#86868b]">
                                        L'interface est prête mais WorkOS n'est pas encore branché.
                                    </p>
                                </div>
                            )}

                            <div className="py-5 flex items-center justify-between">
                                <div>
                                    <p className="text-[13px] font-medium text-white">
                                        Activer le SSO
                                    </p>
                                    <p className="text-[12px] text-[#86868b]">
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
                                        'relative h-6 w-10 rounded-full transition-colors',
                                        ssoConfigured
                                            ? ssoEnabled
                                                ? 'bg-[#30d158]'
                                                : 'bg-white/20'
                                            : 'cursor-not-allowed bg-white/10'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'absolute top-1 h-4 w-4 rounded-full bg-white transition-all',
                                            ssoEnabled ? 'left-5' : 'left-1'
                                        )}
                                    />
                                </button>
                            </div>

                            <div className="py-5 grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-[13px] font-medium text-white">
                                        Fournisseur d'identité
                                    </label>
                                    <select
                                        value={ssoProvider}
                                        onChange={(e) =>
                                            setSsoProvider(e.target.value as SsoProvider)
                                        }
                                        className="w-full rounded-lg bg-white/5 border border-transparent px-3 py-2 text-[13px] text-white outline-none focus:border-[#0a84ff]/50"
                                    >
                                        <option value="google">Google Workspace</option>
                                        <option value="microsoft">Microsoft Azure AD</option>
                                        <option value="okta">Okta</option>
                                        <option value="custom">Custom SAML</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-[13px] font-medium text-white">
                                        URL Metadonnées IdP
                                    </label>
                                    <input
                                        type="url"
                                        value={ssoMetadataUrl}
                                        onChange={(e) => setSsoMetadataUrl(e.target.value)}
                                        placeholder="https://idp.example.com/metadata.xml"
                                        className="w-full rounded-lg bg-white/5 border border-transparent px-3 py-2 text-[13px] text-white outline-none transition-all placeholder:text-[#555] focus:border-[#0a84ff]/50"
                                    />
                                </div>
                            </div>

                            <div className="py-5 flex items-center justify-between">
                                <div className="h-5">
                                    {ssoStatus === 'success' && (
                                        <div className="flex items-center gap-1.5 text-[12px] text-[#30d158]">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Enregistré
                                        </div>
                                    )}
                                    {ssoStatus === 'error' && (
                                        <div className="flex items-center gap-1.5 text-[12px] text-[#ff453a]">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            {ssoError || 'Erreur'}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleConfigureSso}
                                    disabled={isSsoPending || !ssoMetadataUrl.trim()}
                                    className="rounded-lg bg-white text-black px-4 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-50 hover:bg-white/90"
                                >
                                    {isSsoPending ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>

                            <div className="py-5 grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="mb-2 text-[12px] font-medium text-white">
                                        URL ACS
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            readOnly
                                            value={acsUrl}
                                            className="w-full rounded-lg bg-white/5 border border-transparent px-3 py-1.5 text-[12px] font-mono text-[#86868b] outline-none"
                                        />
                                        <button
                                            onClick={() => handleCopyValue(acsUrl)}
                                            className="rounded-lg bg-white/5 p-1.5 text-[#86868b] hover:text-white"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <p className="mb-2 text-[12px] font-medium text-white">
                                        Sp Entity ID
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            readOnly
                                            value={entityId}
                                            className="w-full rounded-lg bg-white/5 border border-transparent px-3 py-1.5 text-[12px] font-mono text-[#86868b] outline-none"
                                        />
                                        <button
                                            onClick={() => handleCopyValue(entityId)}
                                            className="rounded-lg bg-white/5 p-1.5 text-[#86868b] hover:text-white"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/5 py-12 text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                                <Zap className="h-6 w-6 text-white text-opacity-50" />
                            </div>
                            <h3 className="text-[15px] font-semibold text-white">
                                SSO / SAML
                            </h3>
                            <p className="mt-2 text-[13px] text-[#86868b]">
                                Disponible uniquement sur le plan <span className="text-white font-medium">Enterprise</span>.
                            </p>
                            <a
                                href="/dashboard/billing"
                                className="mt-6 rounded-lg bg-white text-black px-4 py-2 text-[13px] font-semibold hover:bg-white/90"
                            >
                                Mettre à niveau
                            </a>
                        </div>
                    )}
                </div>
            )}
        </section>
    )
}
