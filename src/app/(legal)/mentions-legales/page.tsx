import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions légales | Savly',
  description:
    'Mentions légales de Savly : éditeur, hébergement, propriété intellectuelle et traitement des données personnelles.',
}

export default function MentionsLegalesPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-24">
      <nav aria-label="Fil d’Ariane" className="mb-8 text-sm text-zinc-500">
        <Link href="/" className="transition-colors hover:text-emerald-400">
          Accueil
        </Link>
        <span className="mx-2 text-zinc-600">&gt;</span>
        <span className="text-zinc-400">Mentions légales</span>
      </nav>

      <header className="border-b border-white/5 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          Mentions légales
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Dernière mise à jour : 21 février 2026
        </p>
      </header>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">ÉDITEUR DU SITE</h2>
        <div className="mt-4 space-y-3 leading-relaxed">
          <p>
            <span className="font-medium text-zinc-100">Nom de la société :</span> Savly
            (SAS/SARL à définir)
          </p>
          <p>
            <span className="font-medium text-zinc-100">Siège social :</span> [Adresse à compléter]
            {/* TODO: À compléter */}
          </p>
          <p>
            <span className="font-medium text-zinc-100">Capital social :</span> [À compléter]
            {/* TODO: À compléter */}
          </p>
          <p>
            <span className="font-medium text-zinc-100">RCS :</span> [À compléter]
            {/* TODO: À compléter */}
          </p>
          <p>
            <span className="font-medium text-zinc-100">Email :</span>{' '}
            <a className="text-emerald-400 hover:underline" href="mailto:contact@savly.com">
              contact@savly.com
            </a>
          </p>
          <p>
            <span className="font-medium text-zinc-100">Directeur de la publication :</span>{' '}
            [Nom du dirigeant]
            {/* TODO: À compléter */}
          </p>
        </div>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">HÉBERGEMENT</h2>
        <div className="mt-4 space-y-3 leading-relaxed">
          <p>
            <span className="font-medium text-zinc-100">Hébergeur :</span> Vercel Inc.
          </p>
          <p>
            <span className="font-medium text-zinc-100">Adresse :</span> 340 Pine Street, Suite
            701, San Francisco, CA 94104, États-Unis
          </p>
          <p>
            <span className="font-medium text-zinc-100">Site :</span>{' '}
            <a
              className="text-emerald-400 hover:underline"
              href="https://vercel.com"
              target="_blank"
              rel="noreferrer"
            >
              https://vercel.com
            </a>
          </p>
          <p>
            <span className="font-medium text-zinc-100">Base de données :</span> Supabase
            (Supabase Inc., San Francisco, CA)
          </p>
          <p>
            <span className="font-medium text-zinc-100">Site :</span>{' '}
            <a
              className="text-emerald-400 hover:underline"
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
            >
              https://supabase.com
            </a>
          </p>
        </div>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">PROPRIÉTÉ INTELLECTUELLE</h2>
        <p className="mt-4 leading-relaxed">
          Le site Savly et tout son contenu (textes, images, logo, code) sont la propriété
          exclusive de Savly. Toute reproduction, distribution, modification ou exploitation, totale
          ou partielle, est interdite sans autorisation écrite préalable.
        </p>
      </section>

      <section className="py-8">
        <h2 className="text-xl font-semibold text-zinc-100">DONNÉES PERSONNELLES</h2>
        <div className="mt-4 space-y-3 leading-relaxed">
          <p>
            <span className="font-medium text-zinc-100">Responsable du traitement :</span> Savly
          </p>
          <p>
            <span className="font-medium text-zinc-100">Pour exercer vos droits :</span>{' '}
            <a className="text-emerald-400 hover:underline" href="mailto:contact@savly.com">
              contact@savly.com
            </a>
          </p>
          <p>
            Pour plus d&apos;informations, consultez notre{' '}
            <Link className="text-emerald-400 hover:underline" href="/confidentialite">
              Politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </section>
    </article>
  )
}
