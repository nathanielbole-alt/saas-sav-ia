'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(searchParams.get('error'))
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
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

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage('Vérifiez votre email pour confirmer votre inscription.')
    setLoading(false)
  }

  return (
    <form className="space-y-4" onSubmit={handleSignIn}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground/80">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          className="mt-1 block w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/40 focus:border-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/40"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground/80">
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
          className="mt-1 block w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/40 focus:border-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/40"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-600">
          {message}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? '...' : 'Se connecter'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handleSignUp}
          className="flex-1 rounded-lg border border-foreground/20 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-50"
        >
          S&apos;inscrire
        </button>
      </div>
    </form>
  )
}
