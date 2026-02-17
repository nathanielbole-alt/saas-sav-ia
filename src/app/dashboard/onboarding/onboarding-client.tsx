'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  User,
  Building2,
  Briefcase,
  Mail,
  ShoppingBag,
  Instagram,
  MessageCircle,
  CheckCircle2,
  Loader2,
  Rocket,
  ChevronDown,
  Bot,
  Radio,
  Zap,
  Users,
  BarChart3,
  Settings,
  Check,
} from 'lucide-react'
import {
  completeOnboardingStep2,
  completeOnboarding,
  saveOnboardingPolicies,
  setOnboardingRedirectCookie,
  type OnboardingStatus,
} from '@/lib/actions/onboarding'
import { cn } from '@/lib/utils'

// ── Constants ────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'services', label: 'Services' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'sante', label: 'Sante' },
  { value: 'autre', label: 'Autre' },
]

const TEAM_SIZES = [
  { value: '1-5', label: '1-5 personnes' },
  { value: '6-20', label: '6-20 personnes' },
  { value: '21-50', label: '21-50 personnes' },
  { value: '50+', label: '50+ personnes' },
]

const TICKET_VOLUMES = [
  { value: '<100', label: 'Moins de 100' },
  { value: '100-500', label: '100-500' },
  { value: '500-2000', label: '500-2000' },
  { value: '2000+', label: '2000+' },
]

const INTEGRATIONS = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Recevez et repondez aux emails de support',
    icon: Mail,
    href: '/api/integrations/gmail',
    color: 'from-red-500/20 to-orange-500/20',
    accent: 'text-red-400',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Synchronisez commandes et clients',
    icon: ShoppingBag,
    href: '/api/integrations/shopify',
    color: 'from-green-500/20 to-emerald-500/20',
    accent: 'text-green-400',
    needsShop: true,
  },
  {
    id: 'meta',
    name: 'Instagram DM',
    description: 'Gerez vos messages Instagram',
    icon: Instagram,
    href: '/api/integrations/meta',
    color: 'from-pink-500/20 to-purple-500/20',
    accent: 'text-pink-400',
    providerKey: 'meta',
  },
  {
    id: 'messenger',
    name: 'Messenger',
    description: 'Repondez aux messages Facebook',
    icon: MessageCircle,
    href: '/api/integrations/meta',
    color: 'from-blue-500/20 to-indigo-500/20',
    accent: 'text-blue-400',
    providerKey: 'meta',
  },
]

const STEP_LABELS = ['Bienvenue', 'Profil', 'Canaux', 'Regles SAV', 'Termine']

const FEATURES = [
  {
    icon: Bot,
    title: 'IA Automatique',
    description: "L'IA repond a vos clients 24/7",
    color: 'from-violet-500/20 to-fuchsia-500/20',
    accent: 'text-violet-400',
  },
  {
    icon: Radio,
    title: 'Multi-canal',
    description: 'Email, Instagram, Messenger, Shopify',
    color: 'from-blue-500/20 to-cyan-500/20',
    accent: 'text-blue-400',
  },
  {
    icon: Zap,
    title: 'Temps reel',
    description: 'Notifications et mises a jour instantanees',
    color: 'from-amber-500/20 to-orange-500/20',
    accent: 'text-amber-400',
  },
]

// ── Animations ───────────────────────────────────────────────────────────────

const fadeSlide = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
}

// ── Component ────────────────────────────────────────────────────────────────

export default function OnboardingClient({
  initialStatus,
}: {
  initialStatus: OnboardingStatus
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Detect OAuth return
  const stepParam = searchParams.get('step')
  const connectedParam = searchParams.get('connected')
  const initialStep = stepParam === '3' ? 3 : 1

  const [step, setStep] = useState(initialStep)
  const [maxReachedStep, setMaxReachedStep] = useState(initialStep)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectedProviders, setConnectedProviders] = useState<string[]>(() => {
    const providers = [...initialStatus.connectedProviders]
    if (connectedParam && !providers.includes(connectedParam)) {
      providers.push(connectedParam)
    }
    return providers
  })

  // Step 2 form state
  const [fullName, setFullName] = useState(initialStatus.profile.fullName ?? '')
  const [orgName, setOrgName] = useState(initialStatus.orgName)
  const [industry, setIndustry] = useState('')
  const [teamSize, setTeamSize] = useState(initialStatus.profile.teamSize ?? '')
  const [ticketVolume, setTicketVolume] = useState(initialStatus.profile.ticketVolume ?? '')
  const [shopDomain, setShopDomain] = useState('')
  const [refundPolicy, setRefundPolicy] = useState(initialStatus.refundPolicy ?? '')
  const [savPolicy, setSavPolicy] = useState(initialStatus.savPolicy ?? '')

  // Track max reached step for navigation
  useEffect(() => {
    if (step > maxReachedStep) {
      setMaxReachedStep(step)
    }
  }, [step, maxReachedStep])

  const goToStep = useCallback((target: number) => {
    if (target >= 1 && target <= maxReachedStep) {
      setError(null)
      setStep(target)
    }
  }, [maxReachedStep])

  const handleStep2Submit = useCallback(async () => {
    if (!fullName.trim() || !orgName.trim()) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    setError(null)

    const result = await completeOnboardingStep2({
      fullName: fullName.trim(),
      orgName: orgName.trim(),
      industry: industry || undefined,
      teamSize: teamSize || undefined,
      ticketVolume: ticketVolume || undefined,
    })

    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Une erreur est survenue')
      return
    }

    setStep(3)
  }, [fullName, orgName, industry, teamSize, ticketVolume])

  const handleConnect = useCallback(async (integration: typeof INTEGRATIONS[number]) => {
    if (integration.needsShop) {
      if (!shopDomain.includes('.myshopify.com')) {
        setError('Entrez un domaine Shopify valide (ex: monshop.myshopify.com)')
        return
      }
    }

    setError(null)
    await setOnboardingRedirectCookie()

    if (integration.needsShop) {
      window.location.href = `${integration.href}?shop=${encodeURIComponent(shopDomain)}`
    } else {
      window.location.href = integration.href
    }
  }, [shopDomain])

  const handleComplete = useCallback(async () => {
    setLoading(true)
    await completeOnboarding()
    router.push('/dashboard')
  }, [router])

  const handlePoliciesSubmit = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await saveOnboardingPolicies(refundPolicy, savPolicy)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Une erreur est survenue')
      return
    }

    setStep(5)
  }, [refundPolicy, savPolicy])

  const handlePoliciesSkip = useCallback(() => {
    setError(null)
    setStep(5)
  }, [])

  const isProviderConnected = (integration: typeof INTEGRATIONS[number]) => {
    const key = integration.providerKey ?? integration.id
    return connectedProviders.includes(key)
  }

  return (
    <div className="relative flex h-full min-h-[600px] flex-col items-center justify-center p-8 overflow-hidden">
      {/* Particles background for Step 1 */}
      {step === 1 && <ParticlesBackground />}

      {/* Confetti for Step 5 */}
      {step === 5 && <ConfettiEffect />}

      <AnimatePresence mode="wait">
        {/* ── Step 1: Welcome ──────────────────────────────────────────────── */}
        {step === 1 && (
          <motion.div
            key="step-1"
            {...fadeSlide}
            className="relative z-10 flex flex-col items-center text-center max-w-2xl"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="relative mb-8"
            >
              <div className="absolute inset-0 bg-violet-500/30 blur-3xl rounded-full" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 ring-1 ring-white/10 backdrop-blur-xl">
                <Sparkles className="h-12 w-12 text-violet-400" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400 tracking-tight mb-4"
            >
              Bienvenue sur SAV IA !
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-[15px] text-zinc-400 leading-relaxed mb-10 max-w-sm"
            >
              Configurez votre espace en quelques etapes. Connectez vos canaux
              et laissez l&apos;IA gerer votre support client.
            </motion.p>

            {/* Feature cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-4 mb-10 w-full max-w-lg"
            >
              {FEATURES.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl ring-1 ring-white/5"
                  >
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-white/10',
                      feature.color
                    )}>
                      <Icon className={cn('h-5 w-5', feature.accent)} />
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-semibold text-white">{feature.title}</p>
                      <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep(2)}
              className="flex items-center gap-2.5 rounded-2xl bg-violet-500 px-8 py-4 text-[14px] font-bold text-white shadow-lg shadow-violet-500/20 transition-colors hover:bg-violet-400"
            >
              Commencer
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        )}

        {/* ── Step 2: Profile & Organization ───────────────────────────────── */}
        {step === 2 && (
          <motion.div
            key="step-2"
            {...fadeSlide}
            className="w-full max-w-lg"
          >
            <StepIndicator current={2} maxReached={maxReachedStep} onNavigate={goToStep} />

            <h2 className="text-xl font-bold text-white mb-2 mt-8">
              Votre profil
            </h2>
            <p className="text-[13px] text-zinc-500 mb-8">
              Ces informations nous aident a personnaliser votre experience.
            </p>

            <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
              <motion.div variants={fadeSlide}>
                <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                  <User className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-[14px] text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/10"
                />
              </motion.div>

              <motion.div variants={fadeSlide}>
                <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                  <Building2 className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                  Nom de l&apos;entreprise *
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Mon Entreprise"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-[14px] text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/10"
                />
              </motion.div>

              <motion.div variants={fadeSlide}>
                <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                  <Briefcase className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                  Secteur d&apos;activite
                </label>
                <div className="relative">
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full appearance-none rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-10 text-[14px] text-zinc-200 outline-none transition-all focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/10"
                  >
                    <option value="">Selectionnez...</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind.value} value={ind.value}>
                        {ind.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                </div>
              </motion.div>

              <motion.div variants={fadeSlide}>
                <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                  <Users className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                  Taille d&apos;equipe
                </label>
                <div className="relative">
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full appearance-none rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-10 text-[14px] text-zinc-200 outline-none transition-all focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/10"
                  >
                    <option value="">Selectionnez...</option>
                    {TEAM_SIZES.map((ts) => (
                      <option key={ts.value} value={ts.value}>
                        {ts.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                </div>
              </motion.div>

              <motion.div variants={fadeSlide}>
                <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                  <BarChart3 className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                  Volume de tickets/mois estime
                </label>
                <div className="relative">
                  <select
                    value={ticketVolume}
                    onChange={(e) => setTicketVolume(e.target.value)}
                    className="w-full appearance-none rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-10 text-[14px] text-zinc-200 outline-none transition-all focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/10"
                  >
                    <option value="">Selectionnez...</option>
                    {TICKET_VOLUMES.map((tv) => (
                      <option key={tv.value} value={tv.value}>
                        {tv.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                </div>
              </motion.div>
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-[12px] text-red-400"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleStep2Submit}
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-violet-500 px-6 py-3.5 text-[14px] font-bold text-white shadow-lg shadow-violet-500/20 transition-colors hover:bg-violet-400 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* ── Step 3: Connect Channels ─────────────────────────────────────── */}
        {step === 3 && (
          <motion.div
            key="step-3"
            {...fadeSlide}
            className="w-full max-w-lg"
          >
            <StepIndicator current={3} maxReached={maxReachedStep} onNavigate={goToStep} />

            <h2 className="text-xl font-bold text-white mb-2 mt-8">
              Connectez un canal
            </h2>
            <p className="text-[13px] text-zinc-500 mb-8">
              Connectez au moins un canal pour commencer a recevoir des tickets.
            </p>

            {connectedParam && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <p className="text-[13px] text-emerald-300">
                  {connectedParam.charAt(0).toUpperCase() + connectedParam.slice(1)} connecte avec succes !
                </p>
              </motion.div>
            )}

            <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-3">
              {INTEGRATIONS.map((integration) => {
                const Icon = integration.icon
                const connected = isProviderConnected(integration)

                return (
                  <motion.div
                    key={integration.id}
                    variants={fadeSlide}
                    className={cn(
                      'flex items-center gap-4 rounded-2xl border p-4 backdrop-blur-xl transition-all',
                      connected
                        ? 'border-emerald-500/20 bg-emerald-500/5 ring-1 ring-emerald-500/10'
                        : 'border-white/5 bg-white/[0.02] ring-1 ring-white/5 hover:bg-white/[0.04]'
                    )}
                  >
                    <div className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-white/10',
                      integration.color
                    )}>
                      <Icon className={cn('h-5 w-5', integration.accent)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-white">
                        {integration.name}
                      </p>
                      <p className="text-[12px] text-zinc-500 truncate">
                        {integration.description}
                      </p>
                    </div>

                    {connected ? (
                      <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 ring-1 ring-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[11px] font-medium text-emerald-400">Connecte</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {integration.needsShop && (
                          <input
                            type="text"
                            value={shopDomain}
                            onChange={(e) => setShopDomain(e.target.value)}
                            placeholder="shop.myshopify.com"
                            className="w-44 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[12px] text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-500/30"
                          />
                        )}
                        <button
                          onClick={() => handleConnect(integration)}
                          className="rounded-lg bg-white/5 px-4 py-1.5 text-[12px] font-medium text-zinc-300 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white"
                        >
                          Connecter
                        </button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-[12px] text-red-400"
              >
                {error}
              </motion.p>
            )}

            <div className="mt-8 flex flex-col gap-3">
              {connectedProviders.length > 0 && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setStep(4)}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-violet-500 px-6 py-3.5 text-[14px] font-bold text-white shadow-lg shadow-violet-500/20 transition-colors hover:bg-violet-400"
                >
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              )}

              <button
                onClick={() => setStep(4)}
                className="text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors py-2"
              >
                Passer cette etape
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Policies ─────────────────────────────────────────────── */}
        {step === 4 && (
          <motion.div
            key="step-4"
            {...fadeSlide}
            className="w-full max-w-lg"
          >
            <StepIndicator current={4} maxReached={maxReachedStep} onNavigate={goToStep} />

            <h2 className="text-xl font-bold text-white mb-2 mt-8">
              Configurez vos regles SAV
            </h2>
            <p className="text-[13px] text-zinc-500 mb-8">
              L&apos;IA repondra selon vos politiques. Vous pourrez les modifier plus tard dans les parametres.
            </p>

            <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
              <motion.div variants={fadeSlide}>
                <label className="block text-[12px] font-medium text-zinc-300 mb-2">
                  Politique de remboursement
                </label>
                <textarea
                  value={refundPolicy}
                  onChange={(e) => setRefundPolicy(e.target.value)}
                  maxLength={5000}
                  placeholder="Ex: Remboursement sous 14 jours, retour a la charge du client, remboursement sous 5 jours ouvres..."
                  rows={5}
                  className="w-full resize-y rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-[14px] text-zinc-200 placeholder:text-zinc-600 outline-none transition-all focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/30"
                />
                <p className="mt-1.5 text-[11px] text-zinc-600">
                  {refundPolicy.length}/5000 caracteres
                </p>
              </motion.div>

              <motion.div variants={fadeSlide}>
                <label className="block text-[12px] font-medium text-zinc-300 mb-2">
                  Politique SAV
                </label>
                <textarea
                  value={savPolicy}
                  onChange={(e) => setSavPolicy(e.target.value)}
                  maxLength={5000}
                  placeholder="Ex: Garantie 2 ans, remplacement sous 48h, pas de reparation sur produits hors garantie..."
                  rows={5}
                  className="w-full resize-y rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-[14px] text-zinc-200 placeholder:text-zinc-600 outline-none transition-all focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/30"
                />
                <p className="mt-1.5 text-[11px] text-zinc-600">
                  {savPolicy.length}/5000 caracteres
                </p>
              </motion.div>
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-[12px] text-red-400"
              >
                {error}
              </motion.p>
            )}

            <div className="mt-8 flex flex-col gap-3">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handlePoliciesSubmit}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-violet-500 px-6 py-3.5 text-[14px] font-bold text-white shadow-lg shadow-violet-500/20 transition-colors hover:bg-violet-400 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Continuer
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>

              <button
                onClick={handlePoliciesSkip}
                className="text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors py-2"
              >
                Passer pour l&apos;instant
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 5: Complete ─────────────────────────────────────────────── */}
        {step === 5 && (
          <motion.div
            key="step-5"
            {...fadeSlide}
            className="flex flex-col items-center text-center max-w-lg"
          >
            <StepIndicator current={5} maxReached={maxReachedStep} onNavigate={goToStep} />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="relative mb-8 mt-8"
            >
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-white/10 backdrop-blur-xl">
                <Rocket className="h-12 w-12 text-emerald-400" />
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-black text-white mb-3"
            >
              Tout est pret !
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-[14px] text-zinc-400 mb-8 max-w-sm"
            >
              Votre espace SAV IA est configure. Commencez a gerer vos tickets
              de support intelligemment.
            </motion.p>

            {/* Dynamic summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full max-w-sm space-y-2 mb-8"
            >
              <SummaryItem
                label={`Profil complete${fullName.trim() ? ` — ${fullName.trim()}` : ''}`}
                done
              />
              <SummaryItem
                label={`Organisation configuree${orgName.trim() ? ` — ${orgName.trim()}` : ''}`}
                done
              />
              <SummaryItem
                label={
                  connectedProviders.length > 0
                    ? `${connectedProviders.length} canal${connectedProviders.length > 1 ? 'x' : ''} connecte${connectedProviders.length > 1 ? 's' : ''}`
                    : 'Aucun canal — vous pourrez connecter plus tard'
                }
                done={connectedProviders.length > 0}
              />
              <SummaryItem
                label={
                  refundPolicy.trim() || savPolicy.trim()
                    ? 'Politiques SAV configurees'
                    : 'Non configurees — modifiables dans Parametres'
                }
                done={Boolean(refundPolicy.trim() || savPolicy.trim())}
              />
            </motion.div>

            {/* Tip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 mb-8 ring-1 ring-white/5"
            >
              <Settings className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <p className="text-[11px] text-zinc-500">
                Astuce : Vous pouvez relancer l&apos;onboarding depuis les Parametres a tout moment
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleComplete}
              disabled={loading}
              className="flex items-center gap-2.5 rounded-2xl bg-violet-500 px-8 py-4 text-[14px] font-bold text-white shadow-lg shadow-violet-500/20 transition-colors hover:bg-violet-400 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Acceder au dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({
  current,
  maxReached,
  onNavigate,
}: {
  current: number
  maxReached: number
  onNavigate: (step: number) => void
}) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1
          const isCompleted = stepNum < current
          const isActive = stepNum === current
          const isClickable = stepNum <= maxReached && stepNum !== current

          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onNavigate(stepNum)}
                  disabled={!isClickable}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold transition-all duration-300',
                    isCompleted && 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30',
                    isActive && 'bg-violet-500 text-white shadow-lg shadow-violet-500/30',
                    !isCompleted && !isActive && 'bg-transparent text-zinc-600 ring-1 ring-white/10',
                    isClickable && 'cursor-pointer hover:ring-violet-500/30 hover:text-violet-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    stepNum
                  )}
                </button>
                <span className={cn(
                  'mt-1.5 text-[10px] font-medium whitespace-nowrap',
                  isActive ? 'text-violet-400' : isCompleted ? 'text-emerald-400/70' : 'text-zinc-600'
                )}>
                  {label}
                </span>
              </div>

              {/* Connecting line */}
              {stepNum < 5 && (
                <div className="flex-1 h-[2px] mx-2 mt-[-14px] rounded-full overflow-hidden bg-white/5">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SummaryItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 ring-1 ring-white/5">
      <div className={cn(
        'flex h-6 w-6 items-center justify-center rounded-full',
        done ? 'bg-emerald-500/20' : 'bg-zinc-500/10'
      )}>
        <CheckCircle2 className={cn('h-3.5 w-3.5', done ? 'text-emerald-400' : 'text-zinc-600')} />
      </div>
      <span className={cn('text-[13px] text-left', done ? 'text-zinc-200' : 'text-zinc-500')}>
        {label}
      </span>
    </div>
  )
}

// ── Particles Background (CSS-based) ────────────────────────────────────────

function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
    }> = []

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    const init = () => {
      resize()
      particles.length = 0
      const count = 40
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.3 + 0.05,
        })
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`
        ctx.fill()
      }

      animationId = requestAnimationFrame(draw)
    }

    init()
    draw()

    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    />
  )
}

// ── Confetti Effect (CSS keyframes) ──────────────────────────────────────────

function ConfettiEffect() {
  const [pieces, setPieces] = useState<
    Array<{
      id: number
      left: number
      delay: number
      duration: number
      color: string
      size: number
    }>
  >([])

  useEffect(() => {
    const colors = [
      'bg-violet-400',
      'bg-fuchsia-400',
      'bg-emerald-400',
      'bg-amber-400',
      'bg-blue-400',
      'bg-pink-400',
    ]
    const newPieces = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2 + Math.random() * 2,
      color: colors[i % colors.length]!,
      size: Math.random() * 6 + 3,
    }))
    setPieces(newPieces)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className={cn('absolute rounded-sm opacity-0', piece.color)}
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            animation: `confetti-fall ${piece.duration}s ease-out ${piece.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg);
          }
        }
      `}</style>
    </div>
  )
}
