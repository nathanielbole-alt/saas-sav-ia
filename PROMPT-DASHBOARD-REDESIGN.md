# 🎯 MISSION : Refonte Totale du Dashboard — Style Apple

## Contexte

Tu es un **expert en front-end design** et tu dois **refaire entièrement le dashboard** de cette application SaaS de SAV (Service Après-Vente) avec IA. Le dashboard actuel est fonctionnel mais son design est générique et ne correspond pas au niveau de qualité attendu.

**Tu DOIS utiliser tes compétences en front-end design pour créer une interface qui rivalise avec les meilleurs produits SaaS du marché.**

Lis `CLAUDE.md` à la racine du projet pour comprendre la stack, la structure et les fonctionnalités existantes.

---

## 🍎 Direction Artistique : Apple Design Language

L'inspiration principale est **apple.com** et les applications Apple (iCloud, Apple Music, Finder). Voici les principes NON-NÉGOCIABLES :

### Couleurs
- **Background principal** : `#000000` (noir pur) ou `#0a0a0a`
- **Surfaces/cartes** : `#1c1c1e` (gris Apple Dark)
- **Surfaces secondaires** : `#2c2c2e`
- **Bordures** : `rgba(255,255,255,0.08)` — ultra-subtiles, jamais agressives
- **Texte principal** : `#f5f5f7` (blanc Apple)
- **Texte secondaire** : `#86868b` (gris Apple)
- **Accent principal** : `#0a84ff` (bleu Apple) pour les actions, liens, éléments actifs
- **Accent succès** : `#30d158` (vert Apple)
- **Accent danger** : `#ff453a` (rouge Apple)
- **Accent warning** : `#ffd60a` (jaune Apple)

### Typographie
- **Font-family** : `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif`
- **Titres de page** : `28-34px`, `font-weight: 700`, `letter-spacing: -0.02em`
- **Titres de section** : `20-22px`, `font-weight: 600`, `letter-spacing: -0.01em`
- **Métriques/KPIs** : `48-56px`, `font-weight: 700`, `letter-spacing: -0.04em`
- **Body text** : `14-15px`, `font-weight: 400`, `line-height: 1.5`
- **Labels/captions** : `12-13px`, `font-weight: 500`, `color: #86868b`
- **JAMAIS de font-mono** sauf pour les données techniques (IDs, timestamps)

### Effets Visuels
- **Border-radius** : `12px` pour les cartes, `8px` pour les boutons, `20px` pour les conteneurs larges
- **Shadows** : Box-shadow très subtiles avec forte diffusion : `0 2px 20px rgba(0,0,0,0.3)`
- **Backdrop-blur** : `backdrop-filter: blur(20px) saturate(180%)` pour les surfaces vitrées
- **Transitions** : `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` — fluides, jamais brusques
- **Hover states** : changement de background très léger (`rgba(255,255,255,0.05)`), jamais de changement de couleur brutal
- **AUCUN glow néon, AUCUNE ombre colorée, AUCUN gradient agressif** — Apple est élégant et discret

### Espacements
- Système de spacing cohérent : `4, 8, 12, 16, 20, 24, 32, 40, 48, 64px`
- Padding des cartes : `24px` minimum
- Gap entre les cartes : `16-20px`
- Les éléments RESPIRENT — jamais entassés

---

## 📐 Structure à Refaire

### 1. Layout Principal (`src/app/dashboard/layout.tsx`)

**Structure cible :**
```
┌─────────────────────────────────────────────────┐
│  SIDEBAR (260px)  │  MAIN CONTENT (flex-1)      │
│                   │                             │
│  Logo SAV IA      │  [Page content ici]         │
│                   │                             │
│  ─────────────    │                             │
│  Navigation       │                             │
│  · Inbox          │                             │
│  · Tickets        │                             │
│  · Clients        │                             │
│  · Analytics      │                             │
│  · Billing        │                             │
│  · Settings       │                             │
│                   │                             │
│  ─────────────    │                             │
│  Notifications    │                             │
│  Search ⌘K       │                             │
│                   │                             │
│  ─────────────    │                             │
│  User Profile     │                             │
│  Logout           │                             │
└─────────────────────────────────────────────────┘
```

- Sidebar FIXE à gauche, `width: 260px`, background `#1c1c1e`
- Séparateur : `border-right: 1px solid rgba(255,255,255,0.08)`
- Navigation items : `height: 36px`, icône 18px + texte 14px, `border-radius: 8px`
- Active state : background `rgba(10,132,255,0.12)`, texte et icône en `#0a84ff`
- Hover state : background `rgba(255,255,255,0.05)`
- Main content : `background: #000000`, `overflow-y: auto`, `padding: 32px`

### 2. Sidebar (`src/components/dashboard/sidebar.tsx`)

Refaire entièrement avec :
- Logo en haut avec le nom "SAV IA" propre
- Navigation groupée avec séparateurs visuels fins
- Section bottom : notifications, recherche, profil utilisateur
- **NE PAS casser les imports existants** (NotificationBell, Search, navigation links)
- **Conserver toute la logique existante** du `useRealtimeNotifications()`

### 3. Inbox / Dashboard principal (`src/app/dashboard/client-page.tsx`)

Split-pane rigide :
```
┌──────────────────────────────────────────────┐
│  TICKET LIST (380px)  │  TICKET DETAIL       │
│                       │  (flex-1)            │
│  Search bar           │                      │
│  Filter tabs          │  Header + status     │
│  ─────────────────    │  ─────────────────   │
│  [Ticket 1] ←active   │  Messages thread     │
│  [Ticket 2]           │  (scrollable)        │
│  [Ticket 3]           │                      │
│  ...                  │  ─────────────────   │
│                       │  Reply composer      │
└──────────────────────────────────────────────┘
```

#### `ticket-list.tsx` :
- Header : titre "Inbox" + compteur tickets dans un badge
- Search : input avec icône, `background: #2c2c2e`, `border: none`
- Filter tabs : boutons segmentés (Tous / Non lus / Assignés), style Apple SegmentedControl
- Chaque ticket card :
  - Avatar cercle avec initiales (background `#2c2c2e`)
  - Nom client (14px semibold blanc), sujet (13px medium gris)
  - Preview du dernier message (12px, gris clair, tronqué à 1 ligne)
  - Timestamp discret en haut à droite (12px, `#86868b`)
  - Indicateur unread : petit point bleu `#0a84ff` (6x6px)
  - Selected state : background `rgba(10,132,255,0.08)`, barre latérale gauche `#0a84ff` 3px
  - Hover : background `rgba(255,255,255,0.03)`
  - Tags priority : petits labels avec radius, couleurs Apple (rouge=urgent, orange=high, gris=medium/low)

#### `ticket-detail.tsx` :
- Header : sujet en gros (20px bold), status badge, infos client (nom + email), boutons action
- Messages thread : vue linéaire (PAS de bulles chat), chaque message est une section avec :
  - Avatar + nom + timestamp sur une ligne
  - Corps du message en dessous (14px, leading relaxed)
  - Messages IA : bande gauche bleue subtile + badge "IA"
  - Messages agent : légèrement surélevés (background `#1c1c1e`)
  - Messages client : background transparent
- Reply composer en bas :
  - Textarea avec placeholder, `background: #1c1c1e`, `border-radius: 12px`
  - Barre d'outils : bouton pièce jointe + bouton envoi (bleu Apple, `border-radius: 8px`)
  - Raccourci `⌘ + Enter` affiché

### 4. Analytics (`src/app/dashboard/analytics/analytics-client.tsx`)

Refaire complètement :
- **Header** : "Vue d'ensemble" (28px bold) + sélecteur de période + indicateur temps réel
- **Stat Cards** (grille 3 colonnes) :
  - Chaque carte : `background: #1c1c1e`, `border-radius: 16px`, `padding: 24px`
  - Label en haut (13px, `#86868b`)
  - Valeur massive (48px, bold, blanc)
  - Trend badge : vert si positif, rouge si négatif, petit et discret
  - Sous-texte optionnel (12px, `#86868b`)
- **Graphique principal** (area chart) : occupe 2/3 de la largeur
  - SVG custom, ligne fine `#0a84ff`, fill gradient très subtil
  - Grille de fond quasi invisible
  - Axes avec labels discrets
- **Graphique secondaire** (bar chart) : 1/3 de la largeur
  - Barres arrondies, couleurs Apple
- **Distributions** (3 colonnes) : barres de progression horizontales avec legend

### 5. Autres pages

Appliquer le même style Apple à :
- `billing-client.tsx` : cartes de plans avec style Apple, boutons bleu Apple
- `settings-client.tsx` : formulaires avec inputs style Apple (background `#2c2c2e`, `border: none`, `border-radius: 8px`)
- `customers-client.tsx` : table/liste avec style Apple
- `tickets-client.tsx` : même design que l'inbox
- `onboarding-client.tsx` : wizard avec style Apple

---

## ⚠️ Règles Critiques

1. **NE TOUCHE PAS à la logique métier** — seul le JSX/CSS change
2. **NE CASSE PAS les imports** — garde les mêmes exports, props, types
3. **NE SUPPRIME AUCUNE fonctionnalité** — tout doit continuer de marcher
4. **NE CHANGE PAS les Server Actions, hooks, ou API routes**
5. **Utilise UNIQUEMENT Tailwind CSS** (v4, pas de fichier CSS custom sauf `globals.css`)
6. **Garde Lucide React** pour les icônes
7. **Teste que `npm run build` passe** après chaque fichier modifié
8. **CHAQUE composant doit être visuellement magnifique** — pas de placeholder, pas de "on verra plus tard"

---

## 📁 Fichiers à Modifier (dans cet ordre)

1. `src/app/globals.css` — mettre à jour les variables CSS de base
2. `src/app/dashboard/layout.tsx` — nouveau layout (sidebar + main)
3. `src/components/dashboard/sidebar.tsx` — refonte sidebar Apple
4. `src/components/dashboard/ticket-list.tsx` — refonte liste tickets
5. `src/components/dashboard/ticket-detail.tsx` — refonte détail ticket
6. `src/app/dashboard/client-page.tsx` — ajuster le wrapper si besoin
7. `src/app/dashboard/analytics/analytics-client.tsx` — refonte complète
8. `src/app/dashboard/billing/billing-client.tsx` — style Apple
9. `src/app/dashboard/settings/settings-client.tsx` — style Apple
10. `src/app/dashboard/customers/customers-client.tsx` — style Apple
11. `src/app/dashboard/tickets/tickets-client.tsx` — style Apple
12. `src/app/dashboard/onboarding/onboarding-client.tsx` — style Apple

---

## 🏁 Critères de Succès

- [ ] `npm run build` passe sans erreur
- [ ] Le dashboard ressemble à une application Apple (dark mode)
- [ ] Toutes les fonctionnalités existantes fonctionnent
- [ ] La navigation est fluide avec des transitions douces
- [ ] La typographie est premium (-apple-system, spacing tight sur les titres)
- [ ] Les couleurs suivent strictement la palette Apple (#0a84ff, #30d158, #ff453a, etc.)
- [ ] Les cartes et surfaces sont en `#1c1c1e` avec des bordures subtiles
- [ ] L'inbox a un vrai split-pane professionnel
- [ ] Les graphiques analytics sont beaux et minimalistes
- [ ] Le résultat fait "wow" dès le premier regard
