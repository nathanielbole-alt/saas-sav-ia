'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(searchParams.get('error'))
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | null>(null)

  const supabase = createClient()

  async function handleOAuthSignIn(provider: 'google') {
    setError(null)
    setOauthLoading(provider)

    const redirectTo = `${window.location.origin}/api/auth/callback`

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })

    if (error) {
      setError(error.message)
      setOauthLoading(null)
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const isDisabled = loading || oauthLoading !== null

  return (
    <div className="space-y-6">
      {/* OAuth Buttons */}
      <div className="space-y-3">
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => handleOAuthSignIn('google')}
          className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#111115] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {oauthLoading === 'google' ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {oauthLoading === 'google' ? 'Connexion...' : 'Continuer avec Google'}
        </button>


      </div>

      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0d0d10] px-2 text-zinc-500">Ou continuer avec</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form className="space-y-4" onSubmit={handleSignIn}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="mt-1.5 block w-full rounded-xl border border-white/10 bg-[#111115] px-3 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:border-[#E8856C]/50 focus:outline-none focus:ring-2 focus:ring-[#E8856C]/30 transition-all"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 caractères"
            className="mt-1.5 block w-full rounded-xl border border-white/10 bg-[#111115] px-3 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:border-[#E8856C]/50 focus:outline-none focus:ring-2 focus:ring-[#E8856C]/30 transition-all"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isDisabled}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8856C] px-4 py-3 text-sm font-bold text-[#09090b] transition-all hover:bg-[#F09E8A] hover:shadow-[0_0_20px_rgba(232,133,108,0.3)] disabled:cursor-not-allowed disabled:opacity-60 mt-2"
        >
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="font-medium text-zinc-200 hover:text-white transition-colors">
            Créer un compte
          </Link>
        </p>
      </form>
    </div>
  )
}
