'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type FieldErrors = {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

function validateSignupForm(values: {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}): FieldErrors {
  const errors: FieldErrors = {}

  if (!values.fullName.trim()) {
    errors.fullName = 'Le nom complet est requis.'
  }

  const email = values.email.trim()
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) {
    errors.email = 'Veuillez saisir une adresse email valide.'
  }

  if (values.password.length < 8) {
    errors.password = 'Le mot de passe doit contenir au moins 8 caractères.'
  }

  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Les mots de passe ne correspondent pas.'
  }

  return errors
}

export function SignupForm() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | null>(null)

  async function handleOAuthSignIn(provider: 'google') {
    setFormError(null)
    setOauthLoading(provider)

    const redirectTo = `${window.location.origin}/api/auth/callback`

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })

    if (error) {
      setFormError(error.message)
      setOauthLoading(null)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const validationErrors = validateSignupForm({
      fullName,
      email,
      password,
      confirmPassword,
    })
    setFieldErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setLoading(true)

    const callbackUrl = new URL('/api/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('next', '/dashboard/onboarding')

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: callbackUrl.toString(),
        data: {
          full_name: fullName.trim(),
        },
      },
    })

    if (error) {
      setFormError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/dashboard/onboarding')
      router.refresh()
      return
    }

    setEmailConfirmationRequired(true)
    setLoading(false)
  }

  if (emailConfirmationRequired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full rounded-2xl border border-white/10 bg-[#0d0d10] p-8 shadow-[0_0_60px_rgba(232,133,108,0.06)] relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#E8856C]/10 blur-[60px] pointer-events-none" />

        <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8856C] shadow-[0_0_20px_rgba(232,133,108,0.3)]">
            <span className="text-xs font-black text-[#09090b]">S</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-100">Savly</span>
        </Link>

        <div className="flex items-center gap-3 relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8856C]/15">
            <Mail className="h-6 w-6 text-[#E8856C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Vérifiez votre boîte mail</h1>
            <p className="mt-1 text-sm text-zinc-400">Nous avons envoyé un lien de confirmation.</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[#E8856C]/20 bg-[#E8856C]/10 p-4 relative">
          <p className="text-sm text-zinc-200">
            Un email a été envoyé à <span className="font-semibold">{email}</span>. Cliquez sur le lien pour activer votre compte puis continuer l&apos;onboarding.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 relative">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#E8856C] px-4 py-3 text-sm font-bold text-[#09090b] transition-all hover:bg-[#F09E8A] hover:shadow-[0_0_20px_rgba(232,133,108,0.3)]"
          >
            Aller à la connexion
          </Link>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full rounded-2xl border border-white/10 bg-[#0d0d10] p-8 shadow-[0_0_60px_rgba(232,133,108,0.06)] relative overflow-hidden"
    >
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#E8856C]/10 blur-[60px] pointer-events-none" />

      <Link href="/" className="mb-8 inline-flex items-center gap-2.5 relative">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8856C] shadow-[0_0_20px_rgba(232,133,108,0.3)]">
          <span className="text-xs font-black text-[#09090b]">S</span>
        </div>
        <span className="text-sm font-bold tracking-tight text-zinc-100">Savly</span>
      </Link>

      <div className="mb-7 relative">
        <h1 className="text-2xl font-bold text-zinc-100">Créer votre compte</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Démarrez votre essai et configurez votre Savly en quelques minutes.
        </p>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-3 relative">
        <button
          type="button"
          disabled={loading || oauthLoading !== null}
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
          {oauthLoading === 'google' ? 'Inscription...' : 'Continuer avec Google'}
        </button>


      </div>

      {/* Separator */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0d0d10] px-2 text-zinc-500">Ou continuer avec</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 relative">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-zinc-300">
            Nom complet
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-white/10 bg-[#111115] px-3 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:border-[#E8856C]/50 focus:outline-none focus:ring-2 focus:ring-[#E8856C]/30 transition-all"
            placeholder="Nathaniel Bolé Da Silva"
          />
          {fieldErrors.fullName && (
            <p className="mt-1.5 text-xs text-red-400">{fieldErrors.fullName}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-white/10 bg-[#111115] px-3 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:border-[#E8856C]/50 focus:outline-none focus:ring-2 focus:ring-[#E8856C]/30 transition-all"
            placeholder="vous@entreprise.com"
          />
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs text-red-400">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-white/10 bg-[#111115] px-3 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:border-[#E8856C]/50 focus:outline-none focus:ring-2 focus:ring-[#E8856C]/30 transition-all"
            placeholder="Minimum 8 caractères"
          />
          {fieldErrors.password && (
            <p className="mt-1.5 text-xs text-red-400">{fieldErrors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300">
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-white/10 bg-[#111115] px-3 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:border-[#E8856C]/50 focus:outline-none focus:ring-2 focus:ring-[#E8856C]/30 transition-all"
            placeholder="Retapez votre mot de passe"
          />
          {fieldErrors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-400">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {formError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || oauthLoading !== null}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8856C] px-4 py-3 text-sm font-bold text-[#09090b] transition-all hover:bg-[#F09E8A] hover:shadow-[0_0_20px_rgba(232,133,108,0.3)] disabled:cursor-not-allowed disabled:opacity-60 mt-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Création du compte...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400 relative">
        Déjà un compte ?{' '}
        <Link href="/login" className="font-medium text-zinc-200 hover:text-white transition-colors">
          Se connecter
        </Link>
      </p>
    </motion.div>
  )
}
