# PROMPT CODEX — Pages légales complètes (Savly)

## Contexte

Stack : Next.js 16 (App Router), TypeScript, Tailwind CSS. Thème dark premium (`bg-[#09090b]`, accents emerald).

**Savly** est un SaaS B2B de gestion du Service Après-Vente (SAV) par IA pour e-commerçants. Il centralise emails, avis Google, Shopify et formulaires. Il traite des données personnelles (emails clients, données Shopify). L'entreprise est basée en France, soumise au RGPD.

Le dossier `src/app/(legal)/` existe déjà (route group Next.js) mais est **vide**.  
Le footer (`src/components/landing/footer.tsx`) a déjà les liens légaux mais ils pointent vers `#`.

---

## Ce qu'il faut créer

### 4 pages légales + 1 layout partagé

| Route | Fichier | Contenu |
|-------|---------|---------|
| `/mentions-legales` | `src/app/(legal)/mentions-legales/page.tsx` | Mentions légales (éditeur, hébergeur, propriété intellectuelle) |
| `/cgu` | `src/app/(legal)/cgu/page.tsx` | Conditions Générales d'Utilisation |
| `/confidentialite` | `src/app/(legal)/confidentialite/page.tsx` | Politique de confidentialité & RGPD |
| `/cookies` | `src/app/(legal)/cookies/page.tsx` | Politique de cookies |
| Layout partagé | `src/app/(legal)/layout.tsx` | Layout avec navbar + footer |

---

## Design

Style cohérent avec le reste du site :
- Fond : `bg-[#09090b]`
- Texte : `text-zinc-300`, titres `text-zinc-100`
- Sections avec `border-b border-white/5`
- Liens en `text-emerald-400`
- Breadcrumb discret en haut : `Accueil > Nom de la page`
- Largeur max : `max-w-3xl mx-auto`
- Padding : `py-24 px-6`
- En-tête de chaque page : titre H1 + date de dernière mise à jour (`21 février 2026`)
- Importer `Navbar` et `Footer` depuis les composants existants dans le layout

---

## Contenu des pages

### 1. Mentions légales (`/mentions-legales`)

```
ÉDITEUR DU SITE
Nom de la société : Savly (SAS/SARL à définir)
Siège social : [Adresse à compléter]
Capital social : [À compléter]
RCS : [À compléter]
Email : contact@savly.com
Directeur de la publication : [Nom du dirigeant]

HÉBERGEMENT
Hébergeur : Vercel Inc.
Adresse : 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis
Site : https://vercel.com

Base de données : Supabase (Supabase Inc., San Francisco, CA)
Site : https://supabase.com

PROPRIÉTÉ INTELLECTUELLE
Le site Savly et tout son contenu (textes, images, logo, code) sont la propriété
exclusive de Savly. Toute reproduction est interdite sans autorisation.

DONNÉES PERSONNELLES
Responsable du traitement : Savly
Pour exercer vos droits : contact@savly.com
Pour plus d'informations, consulter notre Politique de confidentialité.
```

---

### 2. CGU (`/cgu`)

Structure (développer chaque article en 2-4 paragraphes) :

**Article 1 — Objet et acceptation**
Savly est un service SaaS de gestion du SAV par IA. L'utilisation du service implique l'acceptation pleine et entière des présentes CGU. Savly se réserve le droit de modifier les CGU. L'utilisateur sera informé par email.

**Article 2 — Accès au service**
- Accès via abonnement payant (plans Pro, Business, Enterprise) avec 7 jours d'essai gratuit pour le plan Pro
- Compte professionnel requis (email + mot de passe)
- L'utilisateur est responsable de la confidentialité de ses identifiants

**Article 3 — Description du service**
- Centralisation des tickets SAV (email, Shopify, Instagram, Messenger)
- Réponses automatisées par IA (GPT-4o-mini)
- Gestion d'équipe multi-utilisateurs selon le plan
- Intégrations : Gmail, Shopify, Instagram/Messenger

**Article 4 — Obligations de l'utilisateur**
- Utiliser le service de manière légale
- Ne pas tenter d'accéder à des données d'autres organisations
- Ne pas utiliser Savly pour envoyer du spam ou des contenus illégaux
- Informer ses propres clients de l'utilisation de l'IA dans les réponses

**Article 5 — Abonnements et facturation**
- Facturation mensuelle via Stripe
- Les prix sont affichés TTC
- En cas de résiliation, l'accès reste actif jusqu'à la fin de la période en cours
- Pas de remboursement au prorata (sauf obligation légale)

**Article 6 — Données et confidentialité**
- Les données traitées appartiennent à l'utilisateur (emails clients, données Shopify)
- Savly agit en qualité de sous-traitant au sens du RGPD
- L'utilisateur reste responsable du traitement de ses données clients
- Voir Politique de confidentialité pour les détails

**Article 7 — Disponibilité et SLA**
- Savly vise une disponibilité de 99,5% (hors maintenances planifiées)
- Aucune garantie de disponibilité absolue n'est accordée
- Les maintenances sont communiquées à l'avance dans la mesure du possible

**Article 8 — Limitation de responsabilité**
- Savly ne peut être tenu responsable des pertes indirectes
- La responsabilité de Savly est limitée aux montants effectivement payés sur les 12 derniers mois

**Article 9 — Résiliation**
- L'utilisateur peut résilier à tout moment depuis les paramètres du compte
- Savly peut suspendre un compte en cas de violation des CGU

**Article 10 — Droit applicable**
Droit français. Tout litige relève des tribunaux compétents de Paris.

---

### 3. Politique de confidentialité (`/confidentialite`)

Structure (articles détaillés, conformes RGPD) :

**1. Responsable du traitement**
Savly, contact@savly.com

**2. Données collectées**
- *Données de compte* : nom, email, mot de passe (hashé par Supabase)
- *Données d'organisation* : nom d'entreprise, secteur, taille d'équipe
- *Données d'intégration* : tokens OAuth Gmail, tokens Shopify (stockés chiffrés)
- *Données clients SAV* : emails clients, données commandes Shopify (via intégration)
- *Données d'usage* : logs de connexion, tickets créés, réponses IA générées
- *Données de paiement* : gérées par Stripe (Savly ne stocke pas les CB)

**3. Finalités et bases légales**
| Finalité | Base légale |
|----------|-------------|
| Fourniture du service | Exécution du contrat |
| Facturation | Obligation légale |
| Amélioration du service | Intérêt légitime |
| Envoi d'emails transactionnels | Exécution du contrat |
| Réponses IA aux tickets | Exécution du contrat |

**4. Sous-traitants**
| Sous-traitant | Rôle | Pays |
|---------------|------|------|
| Supabase | Base de données & Auth | UE (serveurs) |
| Vercel | Hébergement | USA (DPA disponible) |
| OpenAI | Génération de réponses IA | USA |
| Stripe | Paiement | USA |
| Google | OAuth Gmail | USA |

**5. Durée de conservation**
- Données de compte : durée de l'abonnement + 3 ans (prescription légale)
- Données clients SAV : durée de l'abonnement
- Logs : 12 mois

**6. Droits des personnes**
Via email à contact@savly.com :
- Droit d'accès, rectification, effacement
- Droit à la portabilité
- Droit d'opposition
- Droit de réclamation auprès de la CNIL (www.cnil.fr)

**7. Transferts hors UE**
Certains sous-traitants (OpenAI, Vercel, Stripe, Google) sont aux USA. Les transferts sont encadrés par des clauses contractuelles types (CCT) conformes au RGPD.

**8. Cookies**
Voir notre Politique de cookies.

**9. Modifications**
Toute modification sera notifiée par email ou bandeau sur le site.

---

### 4. Politique de cookies (`/cookies`)

**Types de cookies utilisés**

| Cookie | Finalité | Durée | Requis |
|--------|----------|-------|--------|
| `sb-access-token` | Session Supabase (auth) | Session | Oui |
| `sb-refresh-token` | Refresh session Supabase | 30 jours | Oui |
| Cookies Stripe | Détection de fraude | Session | Oui |
| Cookies analytiques | Amélioration du service | À définir | Non |

**Cookies fonctionnels (obligatoires)**
Les cookies de session Supabase sont nécessaires au fonctionnement du service. Il n'est pas possible de les désactiver.

**Gestion des cookies**
L'utilisateur peut supprimer les cookies depuis les paramètres de son navigateur. La suppression des cookies de session entraînera la déconnexion du compte.

**Pas de cookies tiers publicitaires**
Savly n'utilise aucun cookie à des fins publicitaires ou de tracking tiers.

---

## Mises à jour du footer

Mettre à jour `src/components/landing/footer.tsx` pour que les liens légaux pointent vers les vraies routes :

```typescript
Legal: [
  { label: 'CGU', href: '/cgu' },
  { label: 'Confidentialité', href: '/confidentialite' },
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'Cookies', href: '/cookies' },
],
```

---

## Contraintes techniques

- Utiliser le **route group** `(legal)` (déjà créé) → les routes seront `/mentions-legales`, `/cgu`, etc. (sans `/legal/` dans l'URL)
- Le **layout** `src/app/(legal)/layout.tsx` doit importer `Navbar` et `Footer` et avoir `bg-[#09090b]`
- Les pages sont des **Server Components** (pas de `'use client'`)
- Pas de bibliothèque externe — HTML sémantique + Tailwind uniquement
- Chaque page a ses propres **metadata** Next.js (title, description pour le SEO)
- Les textes entre `[crochets]` sont des **placeholders** à laisser avec un commentaire `{/* TODO: À compléter */}`

---

## Fichiers à créer / modifier

| Action | Fichier |
|--------|---------|
| **CRÉER** | `src/app/(legal)/layout.tsx` |
| **CRÉER** | `src/app/(legal)/mentions-legales/page.tsx` |
| **CRÉER** | `src/app/(legal)/cgu/page.tsx` |
| **CRÉER** | `src/app/(legal)/confidentialite/page.tsx` |
| **CRÉER** | `src/app/(legal)/cookies/page.tsx` |
| **MODIFIER** | `src/components/landing/footer.tsx` |

---

## Vérification

1. `npm run build` doit passer sans erreurs
2. `/mentions-legales` doit s'afficher avec navbar + footer
3. `/cgu` doit lister tous les articles
4. `/confidentialite` doit avoir le tableau des sous-traitants
5. `/cookies` doit afficher le tableau des cookies
6. Les liens du footer doivent naviguer vers les bonnes pages
7. Taper `grep -r 'href="#"' src/components/landing/footer.tsx` doit retourner zéro résultat
