import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité | Savly',
  description:
    'Politique de confidentialité de Savly conforme RGPD : données collectées, finalités, sous-traitants, conservation et droits des personnes.',
}

export default function ConfidentialitePage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-24">
      <nav aria-label="Fil d’Ariane" className="mb-8 text-sm text-zinc-500">
        <Link href="/" className="transition-colors hover:text-[#E8856C]">
          Accueil
        </Link>
        <span className="mx-2 text-zinc-600">&gt;</span>
        <span className="text-zinc-400">Confidentialité</span>
      </nav>

      <header className="border-b border-white/5 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          Politique de confidentialité
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Dernière mise à jour : 28 février 2026
        </p>
      </header>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">1. Responsable du traitement</h2>
        <p className="mt-4 leading-relaxed">
          Le responsable du traitement est Savly. Pour toute question relative à la protection des
          données personnelles, vous pouvez contacter Savly à l&apos;adresse{' '}
          <a className="text-[#E8856C] hover:underline" href="mailto:contact@savly.com">
            contact@savly.com
          </a>
          .
        </p>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">2. Données collectées</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed marker:text-[#E8856C]">
          <li>
            <span className="font-medium text-zinc-100">Données de compte :</span> nom, email, mot
            de passe (hashé par Supabase).
          </li>
          <li>
            <span className="font-medium text-zinc-100">Données d&apos;organisation :</span> nom
            d&apos;entreprise, secteur, taille d&apos;équipe.
          </li>
          <li>
            <span className="font-medium text-zinc-100">Données d&apos;intégration :</span> tokens
            OAuth Gmail et tokens Shopify, stockés chiffrés.
          </li>
          <li>
            <span className="font-medium text-zinc-100">Données clients SAV :</span> emails clients,
            données commandes Shopify transmises via les intégrations.
          </li>
          <li>
            <span className="font-medium text-zinc-100">Données d&apos;usage :</span> logs de
            connexion, tickets créés, réponses IA générées.
          </li>
          <li>
            <span className="font-medium text-zinc-100">Données de paiement :</span> gérées par
            Stripe (Savly ne stocke pas les numéros de carte bancaire).
          </li>
        </ul>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">3. Utilisation des données Google</h2>
        <p className="mt-4 leading-relaxed">
          Lorsque vous connectez votre compte Gmail à Savly, notre application accède aux données
          suivantes via l&apos;API Google :
        </p>
        <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed marker:text-[#E8856C]">
          <li>
            Lecture de vos emails (scope gmail.readonly ou gmail.modify) afin de créer
            automatiquement des tickets de support à partir des messages entrants.
          </li>
          <li>
            Envoi d&apos;emails en votre nom (scope gmail.send) afin de permettre à Savly de répondre
            aux tickets directement depuis votre adresse @gmail.com.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed">
          Ces données sont utilisées exclusivement pour fournir le service de gestion automatisée du
          SAV. Savly ne partage pas, ne revend pas et n&apos;utilise pas vos données Gmail à
          d&apos;autres fins, y compris la publicité. Les tokens d&apos;accès Gmail sont stockés de
          manière chiffrée et peuvent être révoqués à tout moment depuis la page Paramètres &gt;
          Intégrations de votre espace Savly, ou directement depuis{' '}
          <a
            className="text-[#E8856C] hover:underline"
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noreferrer"
          >
            https://myaccount.google.com/permissions
          </a>
          .
        </p>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">4. Finalités et bases légales</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-zinc-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Finalité</th>
                <th className="px-4 py-3 text-left font-semibold">Base légale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-zinc-300">
              <tr>
                <td className="px-4 py-3">Fourniture du service</td>
                <td className="px-4 py-3">Exécution du contrat</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Facturation</td>
                <td className="px-4 py-3">Obligation légale</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Amélioration du service</td>
                <td className="px-4 py-3">Intérêt légitime</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Envoi d&apos;emails transactionnels</td>
                <td className="px-4 py-3">Exécution du contrat</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Réponses IA aux tickets</td>
                <td className="px-4 py-3">Exécution du contrat</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">5. Sous-traitants</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-zinc-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Sous-traitant</th>
                <th className="px-4 py-3 text-left font-semibold">Rôle</th>
                <th className="px-4 py-3 text-left font-semibold">Pays</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-zinc-300">
              <tr>
                <td className="px-4 py-3">Supabase</td>
                <td className="px-4 py-3">Base de données &amp; Auth</td>
                <td className="px-4 py-3">UE (serveurs)</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Vercel</td>
                <td className="px-4 py-3">Hébergement</td>
                <td className="px-4 py-3">USA (DPA disponible)</td>
              </tr>
              <tr>
                <td className="px-4 py-3">OpenAI</td>
                <td className="px-4 py-3">Génération de réponses IA</td>
                <td className="px-4 py-3">USA</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Stripe</td>
                <td className="px-4 py-3">Paiement</td>
                <td className="px-4 py-3">USA</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Google</td>
                <td className="px-4 py-3">OAuth Gmail</td>
                <td className="px-4 py-3">USA</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">6. Durée de conservation</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed marker:text-[#E8856C]">
          <li>Données de compte : durée de l&apos;abonnement + 3 ans (prescription légale).</li>
          <li>Données clients SAV : durée de l&apos;abonnement.</li>
          <li>Logs techniques : 12 mois.</li>
        </ul>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">7. Droits des personnes</h2>
        <p className="mt-4 leading-relaxed">
          Vous pouvez exercer vos droits via{' '}
          <a className="text-[#E8856C] hover:underline" href="mailto:contact@savly.com">
            contact@savly.com
          </a>{' '}
          : accès, rectification, effacement, portabilité et opposition.
        </p>
        <p className="mt-3 leading-relaxed">
          Vous disposez également du droit d&apos;introduire une réclamation auprès de la CNIL :{' '}
          <a
            className="text-[#E8856C] hover:underline"
            href="https://www.cnil.fr"
            target="_blank"
            rel="noreferrer"
          >
            www.cnil.fr
          </a>
          .
        </p>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">8. Transferts hors UE</h2>
        <p className="mt-4 leading-relaxed">
          Certains sous-traitants utilisés par Savly (OpenAI, Vercel, Stripe, Google) sont situés aux
          États-Unis. Les transferts de données hors Union européenne sont encadrés par des clauses
          contractuelles types (CCT) conformes au RGPD.
        </p>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">9. Cookies</h2>
        <p className="mt-4 leading-relaxed">
          Pour en savoir plus sur les traceurs utilisés, consultez notre{' '}
          <Link className="text-[#E8856C] hover:underline" href="/cookies">
            Politique de cookies
          </Link>
          .
        </p>
      </section>

      <section className="py-8">
        <h2 className="text-xl font-semibold text-zinc-100">10. Modifications</h2>
        <p className="mt-4 leading-relaxed">
          La présente politique peut évoluer. Toute modification importante sera notifiée par email ou
          via un bandeau d&apos;information sur le site.
        </p>
      </section>
    </article>
  )
}
