'use client'

import { useState } from 'react'
import {
    Plug,
    CheckCircle2,
    AlertCircle,
    Mail,
    RefreshCw,
    Loader2,
    Unplug,
    Instagram,
    MessageCircle,
    ShoppingBag,
    Star,
    ShoppingCart,
    Headphones,
} from 'lucide-react'
import type { IntegrationInfo } from '@/lib/actions/integrations'
import type { Profile } from '@/types/database.types'
import { disconnectIntegration } from '@/lib/actions/integrations'
import { syncGmailMessages } from '@/lib/actions/gmail'
import { syncShopifyCustomers, syncShopifyOrders } from '@/lib/actions/shopify'
import { cn } from '@/lib/utils'

export function IntegrationsSection({
    profile,
    integrations,
    gmailResult,
    shopifyResult,
    metaResult,
}: {
    profile: Profile | null
    integrations: IntegrationInfo[]
    gmailResult: string | null
    shopifyResult: string | null
    metaResult: string | null
}) {
    const canManageIntegrations = profile?.role === 'owner' || profile?.role === 'admin'

    // Gmail State
    const gmailIntegration = integrations.find((i) => i.provider === 'gmail')
    const isGmailConnected = gmailIntegration?.status === 'active'
    const isGmailError = gmailIntegration?.status === 'error'
    const [syncResult, setSyncResult] = useState<{
        success: boolean
        count: number
    } | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [isDisconnecting, setIsDisconnecting] = useState(false)

    // Shopify State
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

    // Meta State
    const metaIntegration = integrations.find((i) => i.provider === 'meta')
    const isMetaConnected = metaIntegration?.status === 'active'
    const isMetaError = metaIntegration?.status === 'error'
    const metaMetadata = metaIntegration?.metadata as Record<string, unknown> | null
    const metaPageName = (metaMetadata?.page_name as string) ?? null
    const metaIgUsername = (metaMetadata?.instagram_username as string) ?? null
    const [isMetaDisconnecting, setIsMetaDisconnecting] = useState(false)

    // Handlers
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

    // ── Linear-style Integrations Section ──────────────────────────────────────

    return (
        <section className="mb-12">
            <div className="mb-4">
                <h2 className="text-[15px] font-semibold text-white">Intégrations</h2>
                <p className="text-[13px] text-[#86868b]">Connectez vos applications pour centraliser vos demandes.</p>
            </div>

            {/* Toasts / Results */}
            <div className="mb-6 space-y-2">
                {gmailResult === 'success' && (
                    <div className="flex items-center gap-2 rounded-lg bg-[#30d158]/10 px-3 py-2 border border-[#30d158]/20 text-[12px] text-[#30d158]">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <p>Gmail connecté avec succès ! Vous pouvez maintenant synchroniser vos emails.</p>
                    </div>
                )}
                {gmailResult === 'error' && (
                    <div className="flex items-center gap-2 rounded-lg bg-[#ff453a]/10 px-3 py-2 border border-[#ff453a]/20 text-[12px] text-[#ff453a]">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>Erreur lors de la connexion Gmail. Veuillez réessayer.</p>
                    </div>
                )}

                {shopifyResult === 'success' && (
                    <div className="flex items-center gap-2 rounded-lg bg-[#30d158]/10 px-3 py-2 border border-[#30d158]/20 text-[12px] text-[#30d158]">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <p>Shopify connecté avec succès ! Les commandes enrichissent désormais le contexte client sans créer de tickets.</p>
                    </div>
                )}
                {shopifyResult === 'error' && (
                    <div className="flex items-center gap-2 rounded-lg bg-[#ff453a]/10 px-3 py-2 border border-[#ff453a]/20 text-[12px] text-[#ff453a]">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>Erreur lors de la connexion Shopify. Veuillez réessayer.</p>
                    </div>
                )}

                {metaResult && (
                    <div className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] border',
                        metaResult === 'success' ? 'bg-[#30d158]/10 text-[#30d158] border-[#30d158]/20' : 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20'
                    )}>
                        {metaResult === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                        <p>{metaResult === 'success' ? 'Instagram & Messenger connectés avec succès' : 'Erreur de connexion Meta'}</p>
                    </div>
                )}
            </div>

            <div className="divide-y divide-white/5 border-y border-white/5">
                {/* --- Gmail --- */}
                <div className="py-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                                <Mail className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[14px] font-medium text-white">Gmail</p>
                                    {isGmailConnected && (
                                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#30d158]/10 text-[#30d158]">
                                            Connecté
                                        </span>
                                    )}
                                    {isGmailError && (
                                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#ff453a]/10 text-[#ff453a]">
                                            Erreur
                                        </span>
                                    )}
                                </div>
                                <p className="text-[12px] text-[#86868b] mt-0.5">
                                    {isGmailConnected ? `Connecté : ${gmailIntegration?.email ?? 'compte Gmail'}` : 'Recevoir les emails clients directement dans Savly'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isGmailConnected && (
                                <>
                                    <button
                                        onClick={handleGmailSync}
                                        disabled={isSyncing}
                                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSyncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                        {isSyncing ? 'Sync...' : 'Synchroniser'}
                                    </button>
                                    {canManageIntegrations && (
                                        <button
                                            onClick={handleGmailDisconnect}
                                            disabled={isDisconnecting}
                                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#ff453a] hover:bg-[#ff453a]/10 transition-colors disabled:opacity-50 border border-transparent hover:border-[#ff453a]/20"
                                        >
                                            {isDisconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unplug className="h-3 w-3" />}
                                            Déconnecter
                                        </button>
                                    )}
                                </>
                            )}
                            {!isGmailConnected && canManageIntegrations && (
                                <a
                                    href="/api/integrations/gmail"
                                    className="flex items-center gap-1.5 rounded-lg bg-white text-black px-4 py-1.5 text-[12px] font-semibold transition-colors hover:bg-white/90"
                                >
                                    <Plug className="h-3.5 w-3.5" /> Connecter
                                </a>
                            )}
                            {!isGmailConnected && !canManageIntegrations && (
                                <span className="text-[12px] text-[#86868b]">Admin requis</span>
                            )}
                        </div>
                    </div>

                    {syncResult && (
                        <div className={cn(
                            'mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] border',
                            syncResult.success ? 'bg-[#30d158]/5 border-[#30d158]/10 text-[#30d158]' : 'bg-[#ff453a]/5 border-[#ff453a]/10 text-[#ff453a]'
                        )}>
                            {syncResult.success ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                            {syncResult.success ? `${syncResult.count} email(s) importé(s)` : 'Erreur de synchronisation'}
                        </div>
                    )}
                </div>

                {/* --- Meta --- */}
                <div className="py-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                                <Instagram className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[14px] font-medium text-white">Instagram & Messenger</p>
                                    {isMetaConnected && (
                                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#30d158]/10 text-[#30d158]">
                                            Connecté
                                        </span>
                                    )}
                                    {isMetaError && (
                                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#ff453a]/10 text-[#ff453a]">
                                            Erreur
                                        </span>
                                    )}
                                </div>
                                <p className="text-[12px] text-[#86868b] mt-0.5">
                                    {isMetaConnected ? `${metaPageName ?? 'Page Facebook'}${metaIgUsername ? ` · @${metaIgUsername}` : ''}` : 'Recevoir les DMs Instagram et messages Messenger'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isMetaConnected && canManageIntegrations && (
                                <button
                                    onClick={handleMetaDisconnect}
                                    disabled={isMetaDisconnecting}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#ff453a] hover:bg-[#ff453a]/10 transition-colors disabled:opacity-50 border border-transparent hover:border-[#ff453a]/20"
                                >
                                    {isMetaDisconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unplug className="h-3 w-3" />}
                                    Déconnecter
                                </button>
                            )}
                            {!isMetaConnected && canManageIntegrations && (
                                <a
                                    href="/api/integrations/meta"
                                    className="flex items-center gap-1.5 rounded-lg bg-white text-black px-4 py-1.5 text-[12px] font-semibold transition-colors hover:bg-white/90"
                                >
                                    <Plug className="h-3.5 w-3.5" /> Connecter
                                </a>
                            )}
                            {!isMetaConnected && !canManageIntegrations && (
                                <span className="text-[12px] text-[#86868b]">Admin requis</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- Shopify --- */}
                <div className="py-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                                <ShoppingBag className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[14px] font-medium text-white">Shopify</p>
                                    {isShopifyConnected && (
                                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#30d158]/10 text-[#30d158]">
                                            Connecté
                                        </span>
                                    )}
                                    {isShopifyError && (
                                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#ff453a]/10 text-[#ff453a]">
                                            Erreur
                                        </span>
                                    )}
                                </div>
                                <p className="text-[12px] text-[#86868b] mt-0.5">
                                    {isShopifyConnected ? `Connecté : ${shopifyShop ?? 'boutique Shopify'}` : 'Synchroniser le contexte clients et commandes Shopify'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                            {isShopifyConnected && (
                                <>
                                    <button
                                        onClick={handleShopifyCustomersSync}
                                        disabled={isShopifySyncing}
                                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isShopifySyncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                        Clients
                                    </button>
                                    <button
                                        onClick={handleShopifyOrdersSync}
                                        disabled={isShopifySyncing}
                                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isShopifySyncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                        Commandes
                                    </button>
                                    {canManageIntegrations && (
                                        <button
                                            onClick={handleShopifyDisconnect}
                                            disabled={isShopifyDisconnecting}
                                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#ff453a] hover:bg-[#ff453a]/10 transition-colors disabled:opacity-50 border border-transparent hover:border-[#ff453a]/20"
                                        >
                                            {isShopifyDisconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unplug className="h-3 w-3" />}
                                            Déconnecter
                                        </button>
                                    )}
                                </>
                            )}
                            {!isShopifyConnected && canManageIntegrations && (
                                <div className="flex w-full items-center gap-2 md:w-auto">
                                    <input
                                        type="text"
                                        value={shopInput}
                                        onChange={(e) => setShopInput(e.target.value)}
                                        placeholder="shop.myshopify.com"
                                        className="flex-1 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-[12px] text-white outline-none transition-all placeholder:text-[#555] focus:border-[#0a84ff]/50 md:w-48"
                                    />
                                    <a
                                        href={/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shopInput) ? `/api/integrations/shopify?shop=${encodeURIComponent(shopInput)}` : '#'}
                                        onClick={(e) => {
                                            if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shopInput)) e.preventDefault()
                                        }}
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors',
                                            /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shopInput)
                                                ? 'bg-white text-black hover:bg-white/90'
                                                : 'bg-white/5 text-[#86868b] cursor-not-allowed'
                                        )}
                                    >
                                        <Plug className="h-3 w-3" /> Connecter
                                    </a>
                                </div>
                            )}
                            {!isShopifyConnected && !canManageIntegrations && (
                                <span className="text-[12px] text-[#86868b]">Admin requis</span>
                            )}
                        </div>
                    </div>

                    {shopifySyncResult && (
                        <div className={cn(
                            'mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] border',
                            shopifySyncResult.success ? 'bg-[#30d158]/5 border-[#30d158]/10 text-[#30d158]' : 'bg-[#ff453a]/5 border-[#ff453a]/10 text-[#ff453a]'
                        )}>
                            {shopifySyncResult.success ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                            {shopifySyncResult.success ? `${shopifySyncResult.count} ${shopifySyncResult.type === 'customers' ? 'client(s)' : 'commande(s)'} synchronisé(s)` : 'Erreur de synchronisation'}
                        </div>
                    )}
                </div>

                {/* --- Coming Soon --- */}
                {([
                    { name: 'Google Reviews', description: 'Synchroniser les avis Google', icon: Star },
                    { name: 'WooCommerce', description: 'Importer commandes et clients', icon: ShoppingCart },
                    { name: 'Zendesk', description: 'Migrer vos tickets', icon: Headphones },
                ]).map((integration) => (
                    <div key={integration.name} className="py-5 flex items-center justify-between opacity-50">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-transparent">
                                <integration.icon className="h-4 w-4 text-[#86868b]" />
                            </div>
                            <div>
                                <p className="text-[14px] font-medium text-white">{integration.name}</p>
                                <p className="text-[12px] text-[#86868b] mt-0.5">{integration.description}</p>
                            </div>
                        </div>
                        <span className="text-[11px] font-medium text-[#86868b] bg-white/5 px-2 py-1 rounded">Bientôt</span>
                    </div>
                ))}
            </div>
        </section>
    )
}
