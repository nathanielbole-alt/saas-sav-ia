# Savly

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
│   │   ├── layout.tsx                    # Layout racine (polices system fallback pour build offline)
│   │   ├── page.tsx                      # Landing page (hero, marquee, use-cases, pricing, CTA)
│   │   ├── login/
│   │   │   ├── page.tsx                  # Page login (Server Component)
│   │   │   └── login-form.tsx            # Formulaire connexion uniquement + lien vers /signup
│   │   ├── signup/
│   │   │   ├── page.tsx                  # Page inscription (Server Component)
│   │   │   └── signup-form.tsx           # Formulaire inscription complet (nom, email, mdp, confirmation)
│   │   ├── (legal)/
│   │   │   ├── confidentialite/page.tsx   # Politique de confidentialité (RGPD + Google OAuth)
│   │   │   ├── cookies/page.tsx          # Politique cookies
│   │   │   ├── cgu/page.tsx              # CGU
│   │   │   └── mentions-legales/page.tsx # Mentions légales
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                # Layout protégé (auth + topbar + unread count)
│   │   │   ├── page.tsx                  # Vue d'ensemble (Server Component → overview-client)
│   │   │   ├── overview-client.tsx       # Dashboard Accueil : stats, tickets urgents, récents, intégrations
│   │   │   ├── loading.tsx               # Loading skeleton
│   │   │   ├── template.tsx              # Page transition animations
│   │   │   ├── inbox/
│   │   │   │   ├── page.tsx              # Inbox (Server Component → inbox-client)
│   │   │   │   └── inbox-client.tsx      # Inbox : liste tickets + détail + chat + lazy-load messages
│   │   │   ├── tickets/page.tsx          # Vue tickets (tous)
│   │   │   ├── customers/page.tsx        # Vue clients
│   │   │   ├── analytics/
│   │   │   │   ├── page.tsx              # Analytics (Server Component, passe le plan org)
│   │   │   │   └── analytics-client.tsx  # Charts + Insights IA (débloqué pour Enterprise)
│   │   │   ├── billing/
│   │   │   │   ├── page.tsx              # Billing (Server Component)
│   │   │   │   └── billing-client.tsx    # Plans Pro/Business/Enterprise + Stripe Checkout + trial badge
│   │   │   ├── onboarding/
│   │   │   │   ├── page.tsx              # Onboarding (Server Component)
│   │   │   │   └── onboarding-client.tsx # Wizard 5 étapes (profil, canaux, politiques SAV)
│   │   │   └── settings/
│   │   │       ├── page.tsx              # Settings (Server Component, role-gated data)
│   │   │       ├── settings-client.tsx   # Profil, org, politiques SAV, intégrations
│   │   │       └── components/
│   │   │           └── team-section.tsx   # Section équipe + invitations (token-free)
│   │   └── api/
│   │       ├── ai/auto-reply/route.ts          # Auto-reply IA (30s delay, re-check, admin call)
│   │       ├── auth/callback/route.ts          # Callback OAuth Supabase
│   │       ├── cron/gmail/route.ts             # Cron job sync Gmail
│   │       ├── integrations/gmail/route.ts     # OAuth Gmail → redirect Google
│   │       ├── integrations/gmail/callback/route.ts  # Callback Gmail → encrypt + save tokens
│   │       ├── integrations/shopify/route.ts   # OAuth Shopify → redirect
│   │       ├── integrations/shopify/callback/route.ts # Callback Shopify → encrypt + save tokens
│   │       ├── integrations/meta/route.ts      # OAuth Meta → redirect Facebook
│   │       ├── integrations/meta/callback/route.ts   # Callback Meta → encrypt + save tokens
│   │       ├── webhooks/meta/route.ts          # Webhook Meta (Instagram DM + Messenger)
│   │       ├── seed/route.ts                   # Seeder mock data
│   │       └── stripe/webhook/route.ts         # Webhook Stripe (subscription lifecycle)
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── topbar.tsx                # Topbar navigation (Accueil, Inbox, Tickets, etc.)
│   │   │   ├── ticket-list.tsx           # Liste tickets avec filtres + preview léger (sans messages)
│   │   │   └── ticket-detail.tsx         # Détail ticket + chat (bouton IA supprimé)
│   │   └── landing/
│   │       ├── navbar.tsx                # Navbar fixe (liens ancre #features, #use-cases, #pricing, #faq)
│   │       ├── hero.tsx                  # Hero section (CTA → /signup)
│   │       ├── features.tsx              # Features Bento Grid (id="features")
│   │       ├── use-cases.tsx             # Cas d'utilisation (id="use-cases")
│   │       ├── how-it-works.tsx          # Comment ça marche (id="how-it-works")
│   │       ├── testimonials.tsx          # Témoignages clients
│   │       ├── pricing.tsx               # Section pricing (id="pricing", CTAs → /signup)
│   │       ├── faq.tsx                   # FAQ (id="faq")
│   │       ├── footer.tsx                # Footer
│   │       ├── marquee.tsx               # Marquee logos
│   │       └── word-rotate.tsx           # Animation texte
│   ├── lib/
│   │   ├── ai/
│   │   │   └── auto-reply.ts             # triggerAutoReply() — fire-and-forget POST vers /api/ai/auto-reply
│   │   ├── actions/
│   │   │   ├── ai.ts                     # generateAIResponse() + generateAIResponseAdmin() + escalade [ESCALADE_HUMAIN]
│   │   │   ├── billing.ts               # createCheckoutSession(), createPortalSession(), getSubscriptionInfo()
│   │   │   ├── tickets.ts               # getTickets(), getTicketsList(), getTicketMessages(), sendMessage()
│   │   │   ├── notifications.ts         # getUnreadNotifications(), markNotificationRead()
│   │   │   ├── customers.ts             # CRUD customers
│   │   │   ├── analytics.ts             # Stats dashboard
│   │   │   ├── gmail.ts                 # syncGmailMessages() (role-gated) + sendGmailReply()
│   │   │   ├── meta.ts                  # sendMetaReply() + refreshMetaPageToken()
│   │   │   ├── shopify.ts               # syncShopifyCustomers(), syncShopifyOrders() (role-gated)
│   │   │   ├── integrations.ts          # getIntegrations(), disconnectIntegration()
│   │   │   ├── invitations.ts           # sendInvitation(), getInvitations() (role-gated), getInvitationLink(), revokeInvitation(), acceptInvitation(), getTeamMembers() (role-gated), removeTeamMember()
│   │   │   ├── onboarding.ts            # completeOnboardingStep2(), saveOnboardingPolicies(), completeOnboarding(), resetOnboarding()
│   │   │   └── settings.ts              # updateProfile(), updateOrganization(), updateCompanyPolicies()
│   │   ├── encryption.ts                 # AES-256-GCM encrypt/decrypt pour tokens OAuth
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
│   │       └── middleware.ts             # Client middleware (matcher inclut /signup)
│   └── types/
│       └── database.types.ts             # Types Supabase (9 tables + helpers, incl. notifications)
├── scripts/
│   ├── setup-stripe.ts                   # Crée produits/prix Stripe + écrit .env.local
│   ├── set-enterprise.mjs               # Met à jour le plan org → enterprise en DB
│   ├── list-users.mjs                    # Liste les utilisateurs Supabase
│   └── check-sub.ts                      # Vérifie la subscription d'un utilisateur
├── supabase/migrations/
│   ├── 00001_initial_schema.sql          # 7 tables, 5 enums, indexes, triggers, RLS
│   ├── 00002_auth_trigger_rls.sql        # Auto-profil + RLS policies
│   ├── 00003_integrations.sql            # Table integrations (tokens chiffrés AES-256-GCM)
│   ├── 00005_notifications.sql           # Table notifications + RLS + indexes
│   ├── 00006_enable_realtime.sql         # Active Realtime sur messages, tickets, notifications
│   ├── 00007_add_business_plan.sql       # Ajout 'business' + 'enterprise' à la contrainte plan
│   ├── 00008_add_enterprise_plan_pricing.sql # Re-garantit contrainte plan avec enterprise
│   ├── 00009_remove_free_plan.sql        # Supprime free, colonne subscription_status, default pro
│   ├── 00010_add_social_channels.sql     # Enum instagram/messenger + metadata JSONB
│   ├── 00011_onboarding.sql              # Colonnes onboarding (profiles.is_onboarded, industry)
│   ├── 00012_company_policies.sql        # Colonnes organizations.refund_policy + organizations.sav_policy
│   ├── 00013_onboarding_enrichment.sql   # Colonnes profiles.team_size + profiles.ticket_volume
│   └── 00014_user_invitations.sql        # Table invitations + RLS
└── .env.local                            # Secrets (GITIGNORED)
```

## Ce qui est fait

### Phase 1-8 : Fondations
- ✅ Setup Next.js 16 + TypeScript strict + Tailwind + ESLint
- ✅ Clients Supabase (browser, server, admin) typés
- ✅ Schéma BDD : 8 tables, 5 enums, RLS multi-tenant
- ✅ Auth complète : login + signup dédié (`/signup`), middleware, trigger auto-création org+profil

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

### Landing Page (Refonte 19-20/02/2026 — "Psychologie & Conversion Ultra-Premium")
- ✅ **Thème** : Passage au **100% Dark Mode Premium** (`bg-[#09090b]`, accents `#8b5cf6`/`#a78bfa`) pour unifier le design et maximiser le "wow effect".
- ✅ **Glassmorphism & Aurora** : Effets visuels glow gradients (mix-blend-screen), bordures transparentes (white/10) et arrière-plans floutés.
- ✅ **Hero** : Refonte avec mockup navigateur incrusté d'effets glassmorphism et badges statistiques flottants fluides.
- ✅ **Features** : Bento Grid (3 cols) adapté au mode sombre avec hover states lumineux.
- ✅ **UseCases** : Section animée Marquee + WordRotate restaurée et stylisée en mode sombre avec bg-[#0c0c10]/80.
- ✅ **Sections Ré-intégrées** : Retour définitif des Testimonials, Pricing, FAQ et Footer de manière unifiée sur `page.tsx` en Dark Mode.
- ✅ **Interactivité** : Animations d'entrées, déclenchements au scroll (Framer Motion) et micro-interactions avancées.
- ✅ **Navigation ancre** : `id` ajoutés sur toutes les sections (`#features`, `#use-cases`, `#pricing`, `#faq`) + `scroll-mt-20` pour offset navbar fixe.
- ✅ **CTAs** : Tous les boutons "Essai gratuit" / "Démarrer" pointent vers `/signup`.

### Auth — Inscription dédiée (21/02/2026)
- ✅ **Page `/signup`** : formulaire complet (nom, email, mot de passe, confirmation) avec validation client
- ✅ **Design premium** : cohérent avec le thème dark (bg-[#09090b], accents emerald, animations Framer Motion)
- ✅ **Flow adaptatif** : si confirmation email désactivée → redirect direct `/dashboard/onboarding` ; sinon → écran "Vérifiez votre boîte mail"
- ✅ **Login simplifié** : `/login` = connexion uniquement + lien "Pas encore de compte ? Créer un compte" → `/signup`
- ✅ **Callback auth amélioré** : sanitize `next` (anti open-redirect) + check `profiles.is_onboarded` → redirige vers `/dashboard/onboarding` pour les nouveaux utilisateurs
- ✅ **Middleware** : `/signup` ajouté au matcher, redirection auto `/login` et `/signup` → `/dashboard` pour les users connectés

### Branding — Renommage Savly (21/02/2026)
- ✅ **SAV IA → Savly** dans toute l'app (landing, dashboard, onboarding, settings, auth, signup, invite, footer, tests e2e)
- ✅ **Tagline navbar** : "Pilote automatique" → "SAV intelligent"
- ✅ **URLs** : `app.sav-ia.com` → `app.savly.com`, `api.sav-ia.com` → `api.savly.com`
- ✅ **Contact** : `contact@saas-sav.ia` → `contact@savly.com`
- ✅ **Plans Stripe** : `SAV IA Pro/Business/Enterprise` → `Savly Pro/Business/Enterprise`
- ✅ **Manifest + SEO metadata** : mis à jour
- ✅ **Logo "S"** conservé tel quel (cohérent avec Savly)

### Dashboard (Refonte Apple-style — 28/02/2026)
- ✅ **Topbar navigation** : Accueil, Inbox, Tickets, Clients, Analytics, Billing, Settings (remplace la sidebar)
- ✅ **Page d'accueil `/dashboard`** : vue d'ensemble avec Bento Grid (Non lus, Urgences, Résolus, Ouverts), tickets urgents, récemment reçus, lien rapide intégrations
- ✅ **Inbox déplacée vers `/dashboard/inbox`** : séparation claire entre accueil et boîte de réception
- ✅ **Inbox optimisée (PERF-01)** : `getTicketsList()` charge la liste sans messages, `getTicketMessages()` charge les messages à la demande (lazy loading)
- ✅ **Analytics Enterprise** : section "Insights IA Détaillés" dynamiquement débloquée pour le plan Enterprise (feature gate `plan` prop)
- ✅ Loading skeletons + transition animations
- ✅ Design dark mode premium Apple-style (glassmorphism, gradients subtils, typographie soignée)

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

### Security Audit (01/03/2026 — Codex)
- ✅ **SEC-01** : Invitations/team data restreint aux `owner`/`admin` côté serveur. Le `token` n'est plus exposé au client. Lien invitation récupéré via `getInvitationLink()` (server action dédiée)
- ✅ **SEC-02** : Tokens OAuth chiffrés AES-256-GCM (`encryption.ts`). Gmail/Meta/Shopify callbacks chiffrent avant stockage, lecteurs déchiffrent côté serveur uniquement
- ✅ **SEC-03** : `syncGmailMessages()` et `syncShopifyOrders()` vérifient le rôle `owner`/`admin` côté serveur (pas seulement l'UI)
- ✅ **SEC-04** : CSP durcie — `'unsafe-eval'` retiré de `script-src` dans `next.config.ts`
- ✅ OAuth CSRF (nonce + httpOnly cookie)
- ✅ Rate limiting (AI 50/jour, Gmail sync 1/5min)
- ✅ Zod validation sur toutes les Server Actions
- ✅ JSONB index + RLS UPDATE policy
- ✅ Aria-labels pour a11y
- ✅ RLS multi-tenant propre (pas de fuite inter-entreprises)

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
- ✅ User invite enforcement : limites vérifiées dans `sendInvitation()`

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
- [ ] Vérification Google OAuth (sortie du mode "Test" → production)
- [ ] Agrégations SQL/rollups pour analytics (actuellement scan complet à chaque rendu)
- [ ] `supabase gen types` pour remplacer les types DB manuels
- [ ] Second passage régressions temps réel inbox + intégrations OAuth

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
| `integrations` | Gmail, Shopify, Stripe, Meta (tokens chiffrés AES-256-GCM, status) |
| `invitations` | Invitations d'équipe (email, role, token, status, expires_at) |

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
| `ENCRYPTION_KEY` | Clé AES-256-GCM pour chiffrer les tokens OAuth (32 bytes hex) |
| `META_APP_ID` | App ID Meta (Facebook/Instagram) |
| `META_APP_SECRET` | App Secret Meta |
| `META_VERIFY_TOKEN` | Token vérification webhook Meta |

## Commandes utiles

```bash
npm run dev                        # Serveur dev (localhost:3000)
npm run build                      # Build production
npx tsc --noEmit                   # Type check
npx supabase db push               # Appliquer migrations
npx tsx scripts/setup-stripe.ts --write-env  # Créer produits Stripe + écrire .env.local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # Générer ENCRYPTION_KEY
node scripts/set-enterprise.mjs    # Mettre à jour le plan org → enterprise
stripe listen --forward-to localhost:3000/api/stripe/webhook  # Écouter webhooks Stripe en dev
```

## Notes techniques

- L'IA (ai.ts) utilise GPT-4o-mini avec contexte client complet (Shopify + historique). Le prompt a été enrichi par Codex 5.3.
- Stripe customer ID est stocké dans la table `integrations` (provider='stripe', access_token=customer_id) plutôt que dans profiles. **Ne PAS chiffrer** le customer_id Stripe (ce n'est pas un token OAuth).
- **Plan par défaut** à l'inscription = `'pro'` (trigger SQL `handle_new_user()`). Plus de plan gratuit.
- **Essai 7 jours** : uniquement sur le plan Pro via `trial_period_days: 7` dans Stripe Checkout. Business et Enterprise = paiement immédiat.
- **`plans.ts` est client-safe** : ne contient aucun import Stripe ni env var serveur. Les composants `'use client'` importent depuis `@/lib/plans`, pas `@/lib/stripe`.
- App Google OAuth en mode "Test" : ajouter les emails dans Console Google → OAuth → Audience pour tester.
- Les données Shopify sont stockées dans `customers.metadata` au format JSONB avec parsing Zod sécurisé.
- **Chiffrement tokens OAuth** : `encryption.ts` utilise AES-256-GCM + `ENCRYPTION_KEY`. Les callbacks OAuth chiffrent avant upsert, les lecteurs (gmail.ts, meta.ts, shopify.ts) déchiffrent côté serveur. Re-chiffrement automatique à la rotation de token.
- **Inbox performance** : `getTicketsList()` charge la liste sans messages (preview only), `getTicketMessages(ticketId)` charge les messages à la demande. Les consumers (inbox/page.tsx, dashboard/page.tsx) utilisent `getTicketsList()`.
- **Build script** : utilise Webpack (pas Turbopack) via `next build` pour stabilité. Dev utilise Turbopack via `next dev --turbopack`.
- **Polices** : system font stack (fallback) pour build offline-compatible. Plus de dépendance `next/font/google` au build time.

## Changelog landing page

### 2026-02-24 — Corrections de bugs & migration Next.js 16 (Codex)

**15 fichiers modifiés. `npx tsc --noEmit` ✅ · `npm run build` ✅ · warning middleware disparu ✅**

- **Migration middleware → proxy** : `src/middleware.ts` supprimé, remplacé par `src/proxy.ts` avec même logique Supabase `updateSession` + même matcher. Build affiche désormais `ƒ Proxy (Middleware)`.
- **VideoModal réelle** : `src/components/ui/video-modal.tsx` créé. Overlay sombre + `backdrop-blur`, conteneur 16:9 centré, fermeture `Escape` ou clic overlay, `AnimatePresence`, iframe YouTube placeholder, design system `#0B0B0F` + `rounded-xl`.
- **Hardening OAuth callbacks** : ajout `try/catch`, gestion timeout provider, validation `state` robuste, gestion token invalide/expiré, redirections garanties (plus de crash silencieux) sur `gmail/callback`, `shopify/callback`, `meta/callback`.
- **Accessibilité landing** : `role="region"` + `aria-labelledby` sur toutes les sections (`hero`, `features`, `how-it-works`, `pricing`, `use-cases`, `problems`, `testimonials`, `faq`). FAQ : `aria-expanded`, `aria-controls`, `role="region"` sur panneaux. Contraste secondaire `#555` → `#777`.
- **SEO & sitemap** : métadonnées légales vérifiées et uniques. `src/app/sitemap.ts` mis à jour avec toutes les pages publiques (`/`, `/login`, `/signup`, `/cgu`, `/confidentialite`, `/mentions-legales`, `/cookies`). Liens footer corrigés vers vraies routes légales.

### 2026-02-24 — Ajustements Layouts & Auto-Send (Google AI Studio)

- **UI / Layouts** : Remplacement de certains layouts asymétriques par des grilles centrées et uniformes pour plus de clarté.
  - `pricing.tsx` : Header centré, plan cards en grille 3 colonnes égales (`h-full`), ajout d'un toggle Mensuel/Annuel (-20%), correction du badge "Populaire" tronqué.
  - `faq.tsx` : Header centré au-dessus de l'accordéon (`max-w-3xl`) au lieu du split left/right.
  - `testimonials.tsx` : Refonte totale de la section "Résultats". Grille 4 colonnes proportionnelles pour les stats, et grille 3 colonnes de hauteur égale pour les avis (fini le masonry asymétrique complexe).
  - `hero.tsx` : Réduction de l'espace texte/stats (`gap-16` → `gap-8`), centrage vertical.
- **Copywriting Auto-Send** : Clarification du fait que l'IA envoie les messages _automatiquement_ (sans clic manuel).
  - Remplacement des boutons "Modifier / Envoyer" dans le mockup Hero par un badge dynamique "Savly IA — Envoyé automatiquement".
  - Mise à jour du wording dans `features.tsx` et `how-it-works.tsx` (étape 3).
- **Background** : Ajout de 4 nouvelles sphères (10 au total) dans `floating-spheres.tsx` avec des animations et délais variés pour plus de dynamisme.

### 2026-02-24 — Redesign complet "Taste-Skill" (Claude Code)

**Refonte intégrale de la landing page** par Claude Code avec le style "Taste-Skill". 13 fichiers modifiés, build OK.

**Palette (THE LILA BAN)** :
- Violet `#8b5cf6` → coral chaud `#E8856C` partout
- Background : `#0B0B0F` (off-black), surfaces `#131316`, hover `#1A1A1F`
- Textes : `#EDEDED` (primaire), `#888` (secondaire), `#555` (tertiaire)

**Layouts asymétriques** :
- `hero.tsx` — Split-screen (texte gauche + stats flottantes droite)
- `features.tsx` — Bento grid zig-zag `2fr/1fr` puis `1fr/2fr` avec `SpotlightCard`
- `how-it-works.tsx` — Header sticky gauche + étapes empilées droite
- `pricing.tsx` — Header sticky gauche + plans empilés verticalement droite
- `faq.tsx` — Split layout (header sticky gauche + accordion droite)
- `testimonials.tsx` — Stats 2x2 + asymétrie `1.4fr/1fr`
- `problems.tsx` — Grille 2x2

**Nouveaux composants** :
- `floating-spheres.tsx` — 6 sphères en verre 3D flottantes (radial-gradient + inset shadows)
- `magnetic.tsx` — Boutons magnétiques (`useMotionValue` + `useSpring`) + `SpotlightCard` (glow radial suit le curseur)

**Animations** :
- Spring physics : `type: "spring", stiffness: 100, damping: 20`
- `staggerChildren` avec variants orchestrées
- `active:scale-[0.97]` sur tous les éléments interactifs
- Navbar Dynamic Island : pill qui apparaît au scroll

**Branding** : "SAV IA" → "Savly", CTAs → `/signup`

**Fichiers modifiés** : `globals.css`, `page.tsx`, `navbar.tsx`, `hero.tsx`, `problems.tsx`, `features.tsx`, `use-cases.tsx`, `how-it-works.tsx`, `testimonials.tsx`, `pricing.tsx`, `faq.tsx`, `footer.tsx`, `floating-spheres.tsx`, `magnetic.tsx`

### 2026-02-23 — Rollback puis re-redesign

- Rollback initial de tous les composants landing au commit `6b20168` via `git checkout HEAD`
- Puis redesign complet ci-dessus par Claude Code

**⚠️ Bug Turbopack (non résolu)** : le cache SST Turbopack se corrompt en boucle sur cette machine macOS. `npm run dev` crashe systématiquement avec `Failed to restore task data (corrupted database or bug)`.
- **Workaround** : utiliser `npm run build && npm start` au lieu de `npm run dev`
- En mode `npm start`, pas de hot-reload — il faut rebuild après chaque modif
- À investiguer : possible bug Next.js 16.1.6 + Turbopack sur macOS

### Prompts disponibles (à utiliser avec Claude Code ou Codex)

| Fichier | Contenu |
|---------|---------|
| `PROMPT-CLAUDE-CODE-LANDING-V4.md` | **⭐ PROMPT ULTIME** — Redesign complet, synthèse de V2+V3+fixes, palette indigo, scénarios légaux |
| `PROMPT-CLAUDE-CODE-LANDING-V3.md` | Redesign complet de la landing (V3, palette indigo) |
| `PROMPT-CLAUDE-CODE-LANDING-V2.md` | Redesign V2 (Dynamic Island, Bento Grid, masonry) |
| `PROMPT-CLAUDE-CODE-LANDING-REDESIGN.md` | Premier prompt de redesign (V1) |
| `PROMPT-CLAUDE-CODE-QUICK-FIXES.md` | 4 corrections ciblées (titre hero, centrage, marquee, bulles features) |
| `PROMPT-CLAUDE-CODE-FIX-LAYOUT.md` | Fix alignement Features + Comment ça marche |
| `PROMPT-CLAUDE-CODE-LANDING-SKILL.md` | Refonte avec le skill "UI UX pro max" |
| `PROMPT-CODEX-FIX-TESTIMONIALS.md` | Remplacement légal des faux avis clients par des scénarios illustratifs |
| `PROMPT-CODEX-LEGAL-PAGES.md` | Génération des pages légales (CGU, Confidentialité, Mentions légales, Cookies) |
| `PROMPT-CLAUDE-CODE-FIX-DEV-SERVER.md` | Fix crash Turbopack (cache SST corrompu) |
