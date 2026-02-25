import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de cookies | Savly',
  description:
    'Politique de cookies de Savly : cookies nécessaires au service, gestion des préférences et informations de session.',
}

export default function CookiesPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-24">
      <nav aria-label="Fil d’Ariane" className="mb-8 text-sm text-zinc-500">
        <Link href="/" className="transition-colors hover:text-emerald-400">
          Accueil
        </Link>
        <span className="mx-2 text-zinc-600">&gt;</span>
        <span className="text-zinc-400">Cookies</span>
      </nav>

      <header className="border-b border-white/5 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          Politique de cookies
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Dernière mise à jour : 21 février 2026
        </p>
      </header>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">Types de cookies utilisés</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-zinc-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Cookie</th>
                <th className="px-4 py-3 text-left font-semibold">Finalité</th>
                <th className="px-4 py-3 text-left font-semibold">Durée</th>
                <th className="px-4 py-3 text-left font-semibold">Requis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-zinc-300">
              <tr>
                <td className="px-4 py-3 font-mono text-xs">sb-access-token</td>
                <td className="px-4 py-3">Session Supabase (auth)</td>
                <td className="px-4 py-3">Session</td>
                <td className="px-4 py-3">Oui</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">sb-refresh-token</td>
                <td className="px-4 py-3">Refresh session Supabase</td>
                <td className="px-4 py-3">30 jours</td>
                <td className="px-4 py-3">Oui</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Cookies Stripe</td>
                <td className="px-4 py-3">Détection de fraude</td>
                <td className="px-4 py-3">Session</td>
                <td className="px-4 py-3">Oui</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Cookies analytiques</td>
                <td className="px-4 py-3">Amélioration du service</td>
                <td className="px-4 py-3">À définir</td>
                <td className="px-4 py-3">Non</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">Cookies fonctionnels (obligatoires)</h2>
        <p className="mt-4 leading-relaxed">
          Les cookies de session Supabase sont nécessaires au fonctionnement du service, notamment pour
          l&apos;authentification et la sécurité des sessions utilisateur. Ces cookies ne peuvent pas
          être désactivés tant que vous utilisez la plateforme.
        </p>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">Gestion des cookies</h2>
        <p className="mt-4 leading-relaxed">
          Vous pouvez supprimer les cookies depuis les paramètres de votre navigateur. La suppression
          des cookies de session entraînera la déconnexion de votre compte et pourra limiter certaines
          fonctionnalités de Savly.
        </p>
      </section>

      <section className="py-8">
        <h2 className="text-xl font-semibold text-zinc-100">Pas de cookies tiers publicitaires</h2>
        <p className="mt-4 leading-relaxed">
          Savly n&apos;utilise aucun cookie à des fins publicitaires ni de tracking tiers pour du
          retargeting marketing.
        </p>
      </section>
    </article>
  )
}
