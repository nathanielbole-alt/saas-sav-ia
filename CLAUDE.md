# SaaS SAV IA

Plateforme SaaS pour gérer le Service Après-Vente avec Intelligence Artificielle. Centralise emails, avis Google, Shopify et formulaires. Automatise les réponses avec contexte client complet et contrôle humain.

## Stack technique

- **Next.js 16.1.6** (App Router, Turbopack)
- **TypeScript 5** (strict mode)
- **Supabase** (PostgreSQL + Auth + RLS)
- **OpenAI GPT-4o-mini** (réponses IA contextuelles)
- **Stripe** (abonnements + billing)
- **Zod 4** (validation des données)
- **Tailwind CSS 4** (styling)
- **Lucide React** (icônes)

## Structure du projet

```
saas-sav-ia/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Layout racine
│   │   ├── page.tsx                      # Landing page (hero, marquee, use-cases, pricing, CTA)
│   │   ├── login/
│   │   │   ├── page.tsx                  # Page login (Server Component)
│   │   │   └── login-form.tsx            # Formulaire login/signup
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                # Layout protégé (auth + sidebar)
│   │   │   ├── page.tsx                  # Server component → client-page.tsx
│   │   │   ├── client-page.tsx           # Dashboard inbox (tickets + detail) — auto-reply IA
│   │   │   ├── loading.tsx               # Loading skeleton
│   │   │   ├── template.tsx              # Page transition animations
│   │   │   ├── tickets/page.tsx          # Vue tickets
│   │   │   ├── customers/page.tsx        # Vue clients
│   │   │   ├── analytics/page.tsx        # Analytics
│   │   │   ├── billing/
│   │   │   │   ├── page.tsx              # Billing (Server Component)
│   │   │   │   └── billing-client.tsx    # Plans Pro/Business/Enterprise + Stripe Checkout + trial badge
│   │   │   ├── onboarding/
│   │   │   │   ├── page.tsx              # Onboarding (Server Component)
│   │   │   │   └── onboarding-client.tsx # Wizard 5 étapes (profil, canaux, politiques SAV)
│   │   │   └── settings/
│   │   │       ├── page.tsx              # Settings (Server Component)
│   │   │       └── settings-client.tsx   # Profil, org, politiques SAV, intégrations
│   │   └── api/
│   │       ├── ai/auto-reply/route.ts          # Auto-reply IA (30s delay, re-check, admin call)
│   │       ├── auth/callback/route.ts          # Callback OAuth Supabase
│   │       ├── auth/gmail/route.ts             # OAuth Gmail → redirect Google
│   │       ├── auth/gmail/callback/route.ts    # Callback Gmail → save tokens
│   │       ├── auth/shopify/route.ts           # OAuth Shopify → redirect
│   │       ├── auth/shopify/callback/route.ts  # Callback Shopify → HMAC + save tokens
│   │       ├── integrations/meta/route.ts       # OAuth Meta → redirect Facebook
│   │       ├── integrations/meta/callback/route.ts # Callback Meta → save page token + IG account
│   │       ├── webhooks/meta/route.ts           # Webhook Meta (Instagram DM + Messenger)
│   │       ├── seed/route.ts                   # Seeder mock data
│   │       └── stripe/webhook/route.ts         # Webhook Stripe (subscription lifecycle)
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── sidebar.tsx               # Sidebar + NotificationBell (cloche alertes escalade)
│   │   │   ├── ticket-list.tsx           # Liste tickets avec filtres
│   │   │   └── ticket-detail.tsx         # Détail ticket + chat (bouton IA supprimé)
│   │   └── landing/
│   │       ├── hero.tsx                  # Hero section
│   │       ├── marquee.tsx               # Marquee logos
│   │       ├── use-cases.tsx             # Cas d'utilisation
│   │       ├── pricing.tsx               # Section pricing (3 plans : Pro/Business/Enterprise)
│   │       └── word-rotate.tsx           # Animation texte
│   ├── lib/
│   │   ├── ai/
│   │   │   └── auto-reply.ts             # triggerAutoReply() — fire-and-forget POST vers /api/ai/auto-reply
│   │   ├── actions/
│   │   │   ├── ai.ts                     # generateAIResponse() + generateAIResponseAdmin() + escalade [ESCALADE_HUMAIN]
│   │   │   ├── billing.ts               # createCheckoutSession(), createPortalSession(), getSubscriptionInfo()
│   │   │   ├── tickets.ts               # getTickets(), getMyTickets(), sendMessage() + trigger auto-reply
│   │   │   ├── notifications.ts         # getUnreadNotifications(), markNotificationRead()
│   │   │   ├── customers.ts             # CRUD customers
│   │   │   ├── analytics.ts             # Stats dashboard
│   │   │   ├── gmail.ts                 # syncGmail() — sync emails → tickets + trigger auto-reply
│   │   │   ├── meta.ts                  # sendMetaReply() + refreshMetaPageToken() — Instagram/Messenger
│   │   │   ├── shopify.ts               # syncShopifyCustomers(), syncShopifyOrders() + trigger auto-reply
│   │   │   ├── integrations.ts          # getIntegrations(), disconnectIntegration()
│   │   │   ├── onboarding.ts            # completeOnboardingStep2(), saveOnboardingPolicies(), completeOnboarding(), resetOnboarding()
│   │   │   └── settings.ts              # updateProfile(), updateOrganization(), updateCompanyPolicies()
│   │   ├── plans.ts                      # Définitions plans (client-safe) : Pro/Business/Enterprise + limites
│   │   ├── stripe.ts                     # Stripe SDK server + getPlanFromPriceId() + getPriceIdForPlan()
│   │   ├── feature-gate.ts               # getOrgPlan(), getOrgUsage(), checkFeatureAccess(), enforceFeatureAccess()
│   │   ├── stripe-client.ts              # Stripe SDK client (loadStripe)
│   │   ├── env.ts                        # Validation Zod des env vars
│   │   ├── rate-limit.ts                 # In-memory rate limiter
│   │   ├── mock-data.ts                  # Types MockTicket, MockMessage, MockCustomer
│   │   ├── utils.ts                      # cn() helper
│   │   └── supabase/
│   │       ├── client.ts                 # createBrowserClient
│   │       ├── server.ts                 # createServerClient (cookies)
│   │       ├── admin.ts                  # supabaseAdmin (Service Role Key)
│   │       └── middleware.ts             # Client middleware
│   └── types/
│       └── database.types.ts             # Types Supabase (9 tables + helpers, incl. notifications)
├── scripts/
│   └── setup-stripe.ts                   # Crée produits/prix Stripe + écrit .env.local
├── supabase/migrations/
│   ├── 00001_initial_schema.sql          # 7 tables, 5 enums, indexes, triggers, RLS
│   ├── 00002_auth_trigger_rls.sql        # Auto-profil + RLS policies
│   ├── 00005_notifications.sql           # Table notifications + RLS + indexes
│   ├── 00006_enable_realtime.sql         # Active Realtime sur messages, tickets, notifications
│   ├── 00007_add_business_plan.sql       # Ajout 'business' + 'enterprise' à la contrainte plan
│   ├── 00008_add_enterprise_plan_pricing.sql # Re-garantit contrainte plan avec enterprise
│   ├── 00009_remove_free_plan.sql        # Supprime free, colonne subscription_status, default pro
│   ├── 00011_onboarding.sql              # Colonnes onboarding (profiles.is_onboarded, industry)
│   ├── 00012_company_policies.sql        # Colonnes organizations.refund_policy + organizations.sav_policy
│   └── 00013_onboarding_enrichment.sql   # Colonnes profiles.team_size + profiles.ticket_volume
└── .env.local                            # Secrets (GITIGNORED)
```

## Ce qui est fait

### Phase 1-8 : Fondations
- ✅ Setup Next.js 16 + TypeScript strict + Tailwind + ESLint
- ✅ Clients Supabase (browser, server, admin) typés
- ✅ Schéma BDD : 8 tables, 5 enums, RLS multi-tenant
- ✅ Auth complète : login/signup, middleware, trigger auto-création org+profil

### Onboarding Wizard (5 étapes)
- ✅ Wizard multi-étapes avec Framer Motion (`AnimatePresence` + transitions slide)
- ✅ Étape 1 : Bienvenue — écran d'accueil animé + particules canvas + 3 feature cards (IA, Multi-canal, Temps réel)
- ✅ Étape 2 : Profil & Organisation — nom, entreprise, secteur, taille d'équipe, volume tickets/mois
- ✅ Étape 3 : Connecter un canal — Gmail, Shopify, Instagram, Messenger (skip possible)
- ✅ Étape 4 : Politiques SAV — remboursement & SAV texte libre (skip possible)
- ✅ Étape 5 : Terminé — résumé dynamique (noms affichés, canaux, politiques) + confetti CSS + astuce re-onboarding
- ✅ Barre de progression : steps numérotés cliquables (1-5) avec cercles colorés + lignes animées
- ✅ Navigation : retour aux steps déjà complétés via clic
- ✅ Guard dans `layout.tsx` : redirige vers onboarding si `is_onboarded = false`
- ✅ Callbacks OAuth adaptés : redirigent vers onboarding si cookie `onboarding_redirect` présent
- ✅ Migration `00011_onboarding.sql` : `profiles.is_onboarded`, `profiles.industry`
- ✅ Migration `00013_onboarding_enrichment.sql` : `profiles.team_size`, `profiles.ticket_volume`
- ✅ Re-onboarding : bouton dans Settings > Organisation (owner/admin) → `resetOnboarding()` → redirect onboarding

### Politiques SAV & IA
- ✅ Colonnes `organizations.refund_policy` et `organizations.sav_policy` (migration `00012_company_policies.sql`)
- ✅ Saisie dans l'onboarding (étape 4) ET modifiable dans Settings

### User Invite System
- ✅ Table `invitations` (migration `00014_user_invitations.sql`)
- ✅ Server Actions : `sendInvitation`, `acceptInvitation`, `revokeInvitation`, `removeTeamMember`
- ✅ Page publique `/invite/[token]` pour accepter
- ✅ Section Équipe dans Settings : liste membres, formulaire invitation, status pending
- ✅ Feature gating : limite utilisateurs selon le plan

### Advanced Analytics & Feedback
- ✅ Table `tickets` enrichie : `csat_rating`, `csat_comment` (migration `00015_ticket_feedback.sql`)
- ✅ Server Action : `submitTicketFeedback`
- ✅ Widget Feedback : étoiles + commentaire dans le détail ticket (si résolu)
- ✅ KPIs Avancés : Temps réponse, Résolution IA, Heatmap horaire, Taux de réouverture
- ✅ UI Dashboard Analytics : Heatmap, Jauges performance, Histogramme CSAT

### Tests E2E (Playwright)
- ✅ Setup Playwright + Reporter HTML
- ✅ `e2e/auth.spec.ts` : Login/Logout + Redirects
- ✅ `e2e/onboarding.spec.ts` : Wizard complet (5 steps)
- ✅ `e2e/dashboard.spec.ts` : Navigation + Sidebar + Sections
- ✅ Settings : section "Politiques SAV" avec textareas glass, compteur 5000 chars, feedback
- ✅ IA : injection stricte des politiques dans le system prompt (`POLITIQUE DE REMBOURSEMENT` / `POLITIQUE SAV`)
- ✅ Validation Zod (max 5000 chars), accès owner/admin uniquement

### Analytics Amélioré
- ✅ Graphique d'évolution 30 jours (custom SVG Area Chart)
- ✅ Breakdown par canal incluant Instagram & Messenger
- ✅ Realtime : auto-refresh via Supabase Realtime subscription
- ✅ Indicateur "Live" sur le dashboard
- ✅ Zéro dépendance charting (SVG + Tailwind + Lucide)

### Landing Page
- ✅ Hero section avec word-rotate animation
- ✅ Marquee logos partenaires (double row, directions opposées)
- ✅ Section use-cases avec animations
- ✅ Section pricing (Pro 29€ / Business 79€ / Enterprise 149€) — badge "Populaire" sur Business
- ✅ Sous-titre : "Démarrez avec 7 jours d'essai gratuit sur Pro"
- ✅ Design premium avec gradients, glassmorphism, micro-animations

### Dashboard Ultra-Premium 2026
- ✅ Sidebar "Floating Glass" avec active glow + navigation complète
- ✅ Inbox centralisée : liste tickets avec filtres (all/unread/mine) + recherche
- ✅ Vue détail ticket : chat interface + métadonnées client
- ✅ Loading skeletons + transition animations
- ✅ Design dark mode avec Aurora gradients et noise texture

### Supabase Integration
- ✅ Seeder script (`/api/seed`) pour mock data
- ✅ Server Actions pour tickets, messages, customers
- ✅ Dashboard connecté à Supabase (plus de mock data)

### OpenAI Integration (GPT-4o-mini)
- ✅ Server Action `generateAIResponse()` avec rate limiting (50/jour/org)
- ✅ Prompt SAV optimisé (empathie, règles strictes, adaptation par canal)
- ✅ **Contexte client complet injecté** (ajouté par Codex 5.3) :
  - Profil client (nom, email, téléphone, ancienneté)
  - Données Shopify (commandes, total dépensé, statuts livraison)
  - Historique des 5 derniers tickets du même client
  - Adaptation par canal (Google Review = formel, email = direct)
  - Détection client VIP (3+ commandes)
  - Helpers robustes : parsing numérique, formatage dates/montants FR, Zod pour JSON Shopify

### Réponse IA Automatique + Escalade (Codex 5.3)
- ✅ **Auto-reply 30s** : chaque message client déclenche une réponse IA après 30 secondes de délai
  - Route API `/api/ai/auto-reply` (runtime nodejs, maxDuration 60s)
  - Re-vérifie que le dernier message est toujours du client avant de répondre
  - Helper `triggerAutoReply()` (fire-and-forget POST)
  - `generateAIResponseAdmin()` — variante sans session user (utilise supabaseAdmin)
- ✅ **Déclenché depuis tous les canaux** : tickets.ts (tRPC), gmail.ts, shopify.ts
- ✅ **Escalade humaine** : si l'IA détecte un cas complexe (remboursement, client très mécontent, question financière), elle ajoute `[ESCALADE_HUMAIN]` → notification créée automatiquement
- ✅ **Bouton manuel "Assistant IA" supprimé** de ticket-detail.tsx et client-page.tsx
- ✅ **Table `notifications`** créée (migration 00005) avec RLS + indexes
- ✅ **UI Cloche notifications** dans sidebar : badge non-lus, panel dropdown, lien vers ticket, bouton "Marquer lu"
- ✅ Server Actions : `getUnreadNotifications()`, `markNotificationRead()`

### Retours & Remboursements Shopify — Niveau 1 (Codex 5.3)
- ✅ **Sync enrichi** : fetch des remboursements par commande (`/orders/{id}/refunds.json`)
  - Chaque commande inclut : `financial_status`, `refunds[]` (id, created_at, note, restock, refund_line_items)
  - Metadata racine enrichie : `total_refunds_count`, `total_refunded_amount`
- ✅ **Contexte IA enrichi** : nouvelle section `🔄 RETOURS & REMBOURSEMENTS` dans le prompt
  - Nombre de remboursements, total remboursé, détail par commande (partiel/total)
  - Instruction IA : mention proactive des remboursements récents
- ✅ **UI ticket detail** : section "Retours & Remboursements" dans le panel latéral
  - Badge nombre, liste avec commande/montant/date/statut (PARTIEL/TOTAL)
  - Affiché uniquement si des remboursements existent
- ✅ Schémas Zod étendus (shopifyRefundSchema, shopifyRefundLineItemSchema) rétrocompatibles
- ✅ MockTicket inclut `customerMetadata`, mappé dans `getTickets()` et `getMyTickets()`

### Gmail Integration
- ✅ Google Cloud project + OAuth credentials
- ✅ Table `integrations` dans Supabase
- ✅ OAuth flow complet (route + callback avec CSRF nonce)
- ✅ Server Action `syncGmail()` → crée tickets depuis emails
- ✅ UI Settings : boutons connect/disconnect + sync
- ✅ **Envoi de réponses par email** (Codex 5.3) :
  - `sendGmailReply()` : construit un email RFC 2822 (In-Reply-To, References, base64url) et envoie via Gmail API
  - Réponses IA et agent automatiquement relayées au client dans le thread Gmail d'origine
  - Stockage du `gmail_message_id_header` pour un threading fiable
  - OAuth refresh token persisté via supabaseAdmin (fonctionne sans session user)
  - Fire-and-forget : l'échec email ne bloque pas la réponse dans le dashboard
- ⚠️ App Google en mode "Test" — ajouter les emails comme "utilisateurs de test" dans la console Google Cloud (Audience). Pour la prod → vérification Google (2-4 semaines).

### Shopify Integration
- ✅ OAuth flow + callback avec HMAC validation
- ✅ Server Actions : `syncShopifyCustomers()`, `syncShopifyOrders()`
- ✅ Données Shopify stockées dans `customers.metadata` (JSONB)
- ✅ UI Settings : connexion/déconnexion Shopify

### Stripe Integration (Billing)
- ✅ Stripe SDK (server + client) configuré
- ✅ **3 plans payants** (plus de plan Free) :
  - Pro (29€/mois) — **essai gratuit 7 jours** via `trial_period_days`
  - Business (79€/mois) — IA limitée à 500/jour
  - Enterprise (149€/mois) — tout illimité
- ✅ `plans.ts` client-safe (importable par les composants `'use client'`)
- ✅ `stripe.ts` server-only (SDK, env vars, `getPlanFromPriceId()`, `getPriceIdForPlan()`)
- ✅ API keys + price IDs en .env.local (test mode)
- ✅ Server Actions : `createCheckoutSession()`, `createPortalSession()`, `getSubscriptionInfo()` (retourne `trialEnd`)
- ✅ Webhook route (`/api/stripe/webhook`) : gère checkout.session.completed, subscription.updated, subscription.deleted, invoice.payment_failed
  - `normalizeSubscriptionStatus()` : active, trialing, past_due, canceled
  - `subscription_status` écrit en DB à chaque event
  - Abonnement annulé/impayé → plan retombe à 'pro' + statut 'past_due' ou 'canceled'
- ✅ Billing page : 3 cartes premium + badge trial "X jours restants" + bandeau past_due
- ✅ Stripe customer ID stocké dans table `integrations` (provider='stripe')
- ✅ Type `plan` dans organizations : 'pro' | 'business' | 'enterprise'
- ✅ Colonne `subscription_status` : 'active' | 'trialing' | 'past_due' | 'canceled'
- ✅ Script `scripts/setup-stripe.ts` : crée les 3 produits/prix et écrit les IDs dans .env.local

### Security Audit
- ✅ Token sanitization (pas de leak access_token côté client)
- ✅ OAuth CSRF (nonce + httpOnly cookie)
- ✅ Rate limiting (AI 50/jour, Gmail sync 1/5min)
- ✅ Zod validation sur toutes les Server Actions
- ✅ JSONB index + RLS UPDATE policy
- ✅ Types propres (pas de `any`)
- ✅ Aria-labels pour a11y

### Supabase Realtime (Codex 5.3)
- ✅ **Hook `useRealtimeTickets()`** : subscription live sur `messages` (INSERT) et `tickets` (INSERT/UPDATE)
  - Nouveau message → ajouté au ticket, ticket remonté en haut, marqué unread si customer/IA
  - Nouveau ticket → fetch complet puis ajouté à la liste
  - Update ticket → statut/priorité mis à jour en live
  - Cleanup propre des channels au unmount
- ✅ **Hook `useRealtimeNotifications()`** : subscription live sur `notifications` (INSERT)
  - Fetch initial des non-lues, ajout live des nouvelles, `markAsRead()` local + server
  - Badge notification mis à jour en temps réel
- ✅ **Intégration dashboard** : `client-page.tsx` utilise `useRealtimeTickets()`, sidebar utilise `useRealtimeNotifications()`
- ✅ **organizationId** passé en prop depuis `page.tsx` pour filtrer les events par org
- ✅ Migration `00006_enable_realtime.sql` : active Realtime sur tables `messages`, `tickets`, `notifications`
- ✅ **Migrations appliquées** : 00005 → 00009 toutes poussées en prod

### Feature Gating (plan Stripe)
- ✅ **Module central `feature-gate.ts`** : `getOrgPlan()`, `getOrgUsage()`, `checkFeatureAccess()`, `enforceFeatureAccess()`
  - Lit le plan de l'org depuis la DB, compare l'usage avec les limites de `PLANS` config
  - Utilise `supabaseAdmin` pour les vérifications server-side
  - Fallback plan = 'pro' (plus de plan free)
- ✅ **Limites par plan** (définis dans `plans.ts`) :
  - Pro : tickets illimités, 100 IA/jour, intégrations illimitées, 5 utilisateurs
  - Business : tickets illimités, 500 IA/jour, intégrations illimitées, utilisateurs illimités
  - Enterprise : tout illimité (IA, tickets, intégrations, utilisateurs)
- ✅ **Enforcement points** :
  - IA : `enforceAiRateLimit()` dans `ai.ts` — lit le plan pour déterminer le max
  - Tickets : check dans `tickets.create` (tRPC), `syncShopifyOrders()`, `syncGmailMessages()`
  - Intégrations : check dans Gmail/Shopify OAuth callbacks (bloque uniquement les nouvelles, pas les reconnexions)
- ✅ **UI Billing** : barres de progression d'usage (tickets, IA, intégrations, utilisateurs) dans la page facturation
- ⚠️ User invite enforcement non implémenté (pas de feature d'invitation existante)

### Instagram & Messenger Integration
- ✅ OAuth flow Meta (route + callback + CSRF cookie)
- ✅ Webhook handler avec HMAC signature (`/api/webhooks/meta`)
- ✅ `sendMetaReply()`, `refreshMetaPageToken()`, `extractMetaReplyContext()`
- ✅ IA : ton adapté par canal (décontracté IG, semi-formel Messenger)
- ✅ UI Settings : carte Meta avec connect/disconnect
- ✅ Migration `00010_add_social_channels.sql` : enum `instagram`/`messenger` + `metadata` JSONB

## Prochaines étapes

- [ ] Google Reviews integration (en attente validation API Google Business)
- [ ] Déploiement Vercel
- [ ] Tests end-to-end auto-reply + escalade

## Base de données

### Tables (9)
| Table | Description |
|-------|-------------|
| `organizations` | Tenants (plan, subscription_status, refund_policy, sav_policy) |
| `profiles` | Utilisateurs agents SAV (is_onboarded, industry) |
| `customers` | Clients finaux (metadata JSONB = données Shopify) |
| `tickets` | Demandes SAV (status, priority, channel) |
| `messages` | Messages (sender_type: customer/agent/ai) |
| `tags` | Tags de catégorisation |
| `ticket_tags` | Relation N:N tickets ↔ tags |
| `notifications` | Alertes escalade IA → humain (type, title, body, read) |
| `integrations` | Gmail, Shopify, Stripe (tokens, status) |

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (JAMAIS côté client) |
| `OPENAI_API_KEY` | Clé API OpenAI (GPT-4o-mini) |
| `NEXTAUTH_SECRET` | Secret session (min 32 chars) |
| `NEXTAUTH_URL` | URL de base (http://localhost:3000) |
| `GOOGLE_CLIENT_ID` | OAuth Gmail |
| `GOOGLE_CLIENT_SECRET` | OAuth Gmail |
| `SHOPIFY_CLIENT_ID` | OAuth Shopify |
| `SHOPIFY_CLIENT_SECRET` | OAuth Shopify |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (test) |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (test) |
| `STRIPE_PRO_PRICE_ID` | Price ID Stripe pour le plan Pro |
| `STRIPE_BUSINESS_PRICE_ID` | Price ID Stripe pour le plan Business |
| `STRIPE_ENTERPRISE_PRICE_ID` | Price ID Stripe pour le plan Enterprise |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe (whsec_...) |

## Commandes utiles

```bash
npm run dev                        # Serveur dev (localhost:3000)
npm run build                      # Build production
npx tsc --noEmit                   # Type check
npx supabase db push               # Appliquer migrations
npx tsx scripts/setup-stripe.ts --write-env  # Créer produits Stripe + écrire .env.local
stripe listen --forward-to localhost:3000/api/stripe/webhook  # Écouter webhooks Stripe en dev
```

## Notes techniques

- L'IA (ai.ts) utilise GPT-4o-mini avec contexte client complet (Shopify + historique). Le prompt a été enrichi par Codex 5.3.
- Stripe customer ID est stocké dans la table `integrations` (provider='stripe', access_token=customer_id) plutôt que dans profiles.
- **Plan par défaut** à l'inscription = `'pro'` (trigger SQL `handle_new_user()`). Plus de plan gratuit.
- **Essai 7 jours** : uniquement sur le plan Pro via `trial_period_days: 7` dans Stripe Checkout. Business et Enterprise = paiement immédiat.
- **`plans.ts` est client-safe** : ne contient aucun import Stripe ni env var serveur. Les composants `'use client'` importent depuis `@/lib/plans`, pas `@/lib/stripe`.
- App Google OAuth en mode "Test" : ajouter les emails dans Console Google → OAuth → Audience pour tester.
- Les données Shopify sont stockées dans `customers.metadata` au format JSONB avec parsing Zod sécurisé.
