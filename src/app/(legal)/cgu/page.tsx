import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "CGU | Savly",
  description:
    "Conditions Générales d'Utilisation de Savly, plateforme SaaS de gestion du SAV e-commerce par IA.",
}

export default function CguPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-24">
      <nav aria-label="Fil d’Ariane" className="mb-8 text-sm text-zinc-500">
        <Link href="/" className="transition-colors hover:text-emerald-400">
          Accueil
        </Link>
        <span className="mx-2 text-zinc-600">&gt;</span>
        <span className="text-zinc-400">CGU</span>
      </nav>

      <header className="border-b border-white/5 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          Conditions Générales d&apos;Utilisation
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Dernière mise à jour : 21 février 2026
        </p>
      </header>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">Article 1 — Objet et acceptation</h2>
        <p className="mt-4 leading-relaxed">
          Savly est un service SaaS de gestion du Service Après-Vente par intelligence artificielle
          destiné aux e-commerçants. Les présentes CGU définissent les conditions dans lesquelles un
          utilisateur professionnel accède à la plateforme et utilise ses fonctionnalités.
        </p>
        <p className="mt-3 leading-relaxed">
          L&apos;utilisation du service implique l&apos;acceptation pleine et entière des présentes
          CGU. Savly peut modifier ces CGU à tout moment pour des raisons légales, techniques ou
          commerciales. En cas de modification substantielle, l&apos;utilisateur est informé par email.
        </p>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">Article 2 — Accès au service</h2>
        <p className="mt-4 leading-relaxed">
          L&apos;accès à Savly se fait via abonnement payant, avec des plans Pro, Business et
          Enterprise. Le plan Pro inclut 7 jours d&apos;essai gratuit. Le service est réservé aux
          utilisateurs professionnels agissant pour le compte de leur organisation.
        </p>
        <p className="mt-3 leading-relaxed">
          La création d&apos;un compte requiert une adresse email professionnelle et un mot de passe.
          L&apos;utilisateur est responsable de la confidentialité de ses identifiants, ainsi que de
          toute action effectuée via son compte tant qu&apos;il n&apos;a pas signalé une compromission.
        </p>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">Article 3 — Description du service</h2>
        <p className="mt-4 leading-relaxed">
          Savly centralise les tickets SAV issus de plusieurs canaux, notamment les emails, Shopify,
          Instagram et Messenger. L&apos;objectif est de permettre aux équipes support de suivre et
          traiter les demandes clients depuis une interface unique.
        </p>
        <p className="mt-3 leading-relaxed">
          La plateforme propose des réponses automatisées par IA (GPT-4o-mini), des workflows
          d&apos;assignation interne et une gestion multi-utilisateurs selon le plan souscrit. Les
          intégrations natives disponibles incluent notamment Gmail, Shopify et Meta
          (Instagram/Messenger).
        </p>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">
          Article 4 — Obligations de l&apos;utilisateur
        </h2>
        <p className="mt-4 leading-relaxed">
          L&apos;utilisateur s&apos;engage à utiliser Savly de manière conforme aux lois applicables et
          aux présentes CGU. Il lui est interdit de tenter d&apos;accéder aux données d&apos;autres
          organisations, d&apos;altérer le fonctionnement de la plateforme ou de contourner les mesures
          de sécurité mises en place.
        </p>
        <p className="mt-3 leading-relaxed">
          L&apos;utilisateur ne doit pas utiliser Savly pour envoyer des spams, des contenus
          illicites, diffamatoires ou frauduleux. Il doit également informer ses propres clients
          lorsqu&apos;une réponse est générée ou assistée par intelligence artificielle dans son
          processus SAV.
        </p>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">
          Article 5 — Abonnements et facturation
        </h2>
        <p className="mt-4 leading-relaxed">
          Les abonnements sont facturés mensuellement via Stripe. Les prix affichés sur le site sont
          indiqués TTC. Le prélèvement est effectué selon la périodicité choisie et les modalités de
          paiement communiquées au moment de la souscription.
        </p>
        <p className="mt-3 leading-relaxed">
          En cas de résiliation, l&apos;accès reste actif jusqu&apos;à la fin de la période déjà payée.
          Sauf obligation légale contraire, aucun remboursement prorata temporis n&apos;est effectué
          pour la période en cours.
        </p>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">
          Article 6 — Données et confidentialité
        </h2>
        <p className="mt-4 leading-relaxed">
          Les données traitées via Savly (emails clients, données Shopify et contenus de tickets) sont
          la propriété de l&apos;utilisateur. Savly intervient en qualité de sous-traitant au sens du
          RGPD pour exécuter les instructions de l&apos;utilisateur, responsable de traitement.
        </p>
        <p className="mt-3 leading-relaxed">
          L&apos;utilisateur demeure responsable de la base légale de ses traitements, de
          l&apos;information des personnes concernées et du respect de ses obligations réglementaires.
          Les modalités détaillées figurent dans la{' '}
          <Link className="text-emerald-400 hover:underline" href="/confidentialite">
            Politique de confidentialité
          </Link>
          .
        </p>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">Article 7 — Disponibilité et SLA</h2>
        <p className="mt-4 leading-relaxed">
          Savly vise une disponibilité cible de 99,5 %, hors maintenances planifiées et événements
          échappant à son contrôle raisonnable (panne fournisseur, force majeure, incident réseau
          majeur). Cette cible constitue un objectif de niveau de service et non une garantie absolue.
        </p>
        <p className="mt-3 leading-relaxed">
          Les opérations de maintenance susceptibles d&apos;affecter le service sont communiquées à
          l&apos;avance dans la mesure du possible. Savly met en place des mesures de supervision afin
          de limiter la durée et l&apos;impact des interruptions.
        </p>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">
          Article 8 — Limitation de responsabilité
        </h2>
        <p className="mt-4 leading-relaxed">
          Savly ne pourra être tenu responsable des dommages indirects subis par l&apos;utilisateur,
          notamment perte de chiffre d&apos;affaires, perte d&apos;opportunité, perte de clientèle ou
          atteinte à l&apos;image. L&apos;utilisateur reste responsable de la validation finale des
          réponses envoyées à ses clients.
        </p>
        <p className="mt-3 leading-relaxed">
          En tout état de cause, la responsabilité globale de Savly est limitée aux montants
          effectivement payés par l&apos;utilisateur au titre du service durant les 12 mois précédant
          le fait générateur du dommage.
        </p>
      </section>

      <section className="border-b border-white/5 py-8">
        <h2 className="text-xl font-semibold text-zinc-100">Article 9 — Résiliation</h2>
        <p className="mt-4 leading-relaxed">
          L&apos;utilisateur peut résilier son abonnement à tout moment depuis les paramètres de son
          compte. La résiliation prend effet à l&apos;échéance de la période en cours, sauf disposition
          contraire indiquée au moment de la souscription.
        </p>
        <p className="mt-3 leading-relaxed">
          Savly peut suspendre ou résilier un compte en cas de violation des présentes CGU, de non
          paiement, d&apos;usage abusif du service ou de risque pour la sécurité de la plateforme. Une
          notification préalable est adressée lorsque la situation le permet.
        </p>
      </section>

      <section className="py-8">
        <h2 className="text-xl font-semibold text-zinc-100">Article 10 — Droit applicable</h2>
        <p className="mt-4 leading-relaxed">
          Les présentes CGU sont soumises au droit français. Elles sont rédigées en langue française,
          qui fait foi en cas d&apos;interprétation.
        </p>
        <p className="mt-3 leading-relaxed">
          Tout litige relatif à l&apos;exécution ou l&apos;interprétation des CGU relève de la
          compétence des tribunaux compétents de Paris, sous réserve des règles d&apos;ordre public
          applicables.
        </p>
      </section>
    </article>
  )
}
