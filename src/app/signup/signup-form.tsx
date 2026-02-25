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
        className="w-full rounded-2xl border border-white/10 bg-[#0d0d10] p-8 shadow-[0_0_60px_rgba(16,185,129,0.08)]"
      >
        <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <span className="text-xs font-black text-[#09090b]">S</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-100">Savly</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
            <Mail className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Vérifiez votre boîte mail</h1>
            <p className="mt-1 text-sm text-zinc-400">Nous avons envoyé un lien de confirmation.</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-200">
            Un email a été envoyé à <span className="font-semibold">{email}</span>. Cliquez sur le lien pour activer votre compte puis continuer l&apos;onboarding.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-[#09090b] transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
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
      className="w-full rounded-2xl border border-white/10 bg-[#0d0d10] p-8 shadow-[0_0_60px_rgba(16,185,129,0.08)]"
    >
      <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <span className="text-xs font-black text-[#09090b]">S</span>
        </div>
        <span className="text-sm font-bold tracking-tight text-zinc-100">Savly</span>
      </Link>

      <div className="mb-7">
        <h1 className="text-2xl font-bold text-zinc-100">Créer votre compte</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Démarrez votre essai et configurez votre Savly en quelques minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="mt-1.5 block w-full rounded-xl border border-white/10 bg-[#111115] px-3 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
            className="mt-1.5 block w-full rounded-xl border border-white/10 bg-[#111115] px-3 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
            className="mt-1.5 block w-full rounded-xl border border-white/10 bg-[#111115] px-3 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
            className="mt-1.5 block w-full rounded-xl border border-white/10 bg-[#111115] px-3 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-[#09090b] transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Création du compte...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Déjà un compte ?{' '}
        <Link href="/login" className="font-medium text-zinc-200 hover:text-white">
          Se connecter
        </Link>
      </p>
    </motion.div>
  )
}
