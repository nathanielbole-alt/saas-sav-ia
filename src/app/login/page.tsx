import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Connexion | Savly',
  description: 'Connectez-vous à votre espace Savly.',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d10] p-8 shadow-[0_0_60px_rgba(232,133,108,0.06)] relative overflow-hidden">

        {/* Subtle glow effect behind the card content */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#E8856C]/10 blur-[60px] pointer-events-none" />

        <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8856C] shadow-[0_0_20px_rgba(232,133,108,0.3)]">
            <span className="text-xs font-black text-[#09090b]">S</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-100">Savly</span>
        </Link>

        <div className="mb-7">
          <h1 className="text-2xl font-bold text-zinc-100">Bon retour</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Connectez-vous pour accéder à votre espace de travail.
          </p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
