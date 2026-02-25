'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  UserPlus,
} from 'lucide-react'
import { acceptInvitation } from '@/lib/actions/invitations'
import { cn } from '@/lib/utils'

type InviteData = {
  valid: true
  orgName: string
  role: string
  email: string
  token: string
  isLoggedIn: boolean
  emailMatch: boolean
} | {
  valid: false
  reason: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  agent: 'Agent',
  owner: 'Proprietaire',
}

export default function InviteClient({ data }: { data: InviteData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)

  const handleAccept = async () => {
    if (!data.valid) return
    setLoading(true)
    setError(null)

    const result = await acceptInvitation(data.token)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Une erreur est survenue')
      return
    }

    setAccepted(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const handleLogin = () => {
    if (!data.valid) return
    router.push(`/login?redirect=/invite/${data.token}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] p-6">
      <div className="w-full max-w-md">
        {/* Invalid invitation */}
        {!data.valid && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl ring-1 ring-white/5 text-center">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 mb-6">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-3">
              Invitation invalide
            </h1>
            <p className="text-[14px] text-zinc-400 mb-6">
              {data.reason}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-6 py-3 text-[13px] font-medium text-zinc-300 ring-1 ring-white/10 hover:bg-white/10 transition-all"
            >
              Retour a la connexion
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Valid invitation — already accepted */}
        {data.valid && accepted && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 backdrop-blur-xl ring-1 ring-emerald-500/10 text-center">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-500/30 mb-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-3">
              Invitation acceptee !
            </h1>
            <p className="text-[14px] text-zinc-400">
              Redirection vers le dashboard...
            </p>
          </div>
        )}

        {/* Valid invitation — show details */}
        {data.valid && !accepted && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl ring-1 ring-white/5">
            <div className="text-center mb-8">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20 mb-6">
                <UserPlus className="h-8 w-8 text-violet-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">
                Vous etes invite !
              </h1>
              <p className="text-[14px] text-zinc-400">
                Vous avez ete invite a rejoindre une organisation sur Savly.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 ring-1 ring-white/5">
                <Building2 className="h-4 w-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-zinc-500">Organisation</p>
                  <p className="text-[13px] font-medium text-white">{data.orgName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 ring-1 ring-white/5">
                <Shield className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-zinc-500">Role</p>
                  <p className="text-[13px] font-medium text-white">
                    {ROLE_LABELS[data.role] ?? data.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Email mismatch warning */}
            {data.isLoggedIn && !data.emailMatch && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 mb-6">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-300">
                  Cette invitation est destinee a <strong>{data.email}</strong>.
                  Vous etes connecte avec un autre compte. Deconnectez-vous et reconnectez-vous avec le bon email.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 mb-6">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-[12px] text-red-300">{error}</p>
              </div>
            )}

            {data.isLoggedIn && data.emailMatch && (
              <button
                onClick={handleAccept}
                disabled={loading}
                className={cn(
                  'flex w-full items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 text-[14px] font-bold text-white shadow-lg transition-colors',
                  loading
                    ? 'bg-violet-500/50 cursor-wait'
                    : 'bg-violet-500 shadow-violet-500/20 hover:bg-violet-400'
                )}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Accepter l&apos;invitation
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}

            {!data.isLoggedIn && (
              <button
                onClick={handleLogin}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-violet-500 px-6 py-3.5 text-[14px] font-bold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-400 transition-colors"
              >
                Se connecter pour accepter
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {data.isLoggedIn && !data.emailMatch && (
              <button
                onClick={() => router.push('/login')}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-white/5 px-6 py-3.5 text-[14px] font-medium text-zinc-300 ring-1 ring-white/10 hover:bg-white/10 transition-all"
              >
                Changer de compte
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
