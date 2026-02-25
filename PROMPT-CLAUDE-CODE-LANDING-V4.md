# PROMPT CLAUDE CODE — Savly Landing Page — REFONTE ULTIME V4
# ⚠️ TOUT RÉÉCRIRE DE ZÉRO. ZÉRO COPIER-COLLER DU CODE EXISTANT.

## PREMIÈRE INSTRUCTION — OBLIGATOIRE

**Active et utilise le skill "UI UX pro max" MAINTENANT.** Lis ses instructions en entier et applique-les tout au long de cette tâche. Si le skill n'est pas disponible, inspire-toi des meilleures landing pages SaaS de 2026 (Linear, Vercel, Raycast, Arc, Resend).

---

## MISSION

Tu vas **supprimer et réécrire de zéro** l'intégralité de la landing page de **Savly** — un SaaS B2B IA qui gère le support client (SAV) pour toute entreprise (pas seulement e-commerce). Le code actuel a des problèmes critiques :

### Ce qui cloche actuellement
1. **Layout Features** — Des cards de tailles différentes mal alignées, des espaces vides énormes
2. **Section "Comment ça marche"** — Layout 2 colonnes avec colonne droite sticky qui crée des vides
3. **Testimonials** — Faux avis clients avec noms inventés (illégal en France, art. L121-4)
4. **Titre Hero** — Mentionne "e-commerce" alors qu'on vise TOUTE entreprise
5. **Copy générique** — "Vos clients méritent mieux", "Simple et transparent" = phrases vues 10,000 fois
6. **Sensation globale** — Ça fait générique et "AI-generated", pas premium

### L'objectif
Une landing page qui **impressionne dès la première seconde**. Qui donne envie de s'inscrire. Qui respire la qualité, la confiance et la modernité. Pas un template — une vraie identité visuelle.

---

## STACK TECHNIQUE

- Next.js 16 (App Router), TypeScript strict, Tailwind CSS 4, Framer Motion 11, Lucide React
- Police : Inter (déjà configurée)
- Fichiers : `src/components/landing/*.tsx`

---

## NOUVELLE IDENTITÉ VISUELLE

### Palette de couleurs (OBLIGATOIRE — remplace tout emerald)

```
Fond principal :    #0a0a0f    (bleu-noir profond, pas noir pur)
Surface cards :     #13131a    (légèrement plus clair)
Élevé / hover :     #1a1a24    (éléments en relief)

Accent principal :  Indigo #6366f1  (text-indigo-400, bg-indigo-500)
Accent secondaire : Cyan #22d3ee   (highlights IA)

Texte principal :   #f0f0ff    (légèrement bleuté)
Texte secondaire :  #8b8ba8    (violet-gris)
Texte muet :        #4a4a6a    (très atténué)

Bordures :          border-indigo-500/[0.12]
Glow :              shadow-[0_0_40px_rgba(99,102,241,0.2)]
```

### Typographie
- **Titres** : `font-black tracking-[-0.04em] leading-[0.92]` — ultra serrés, impactants
- **Body** : `text-[14px] leading-[1.7]` — aéré, lisible
- **Labels** : `font-mono text-[10px] uppercase tracking-[0.25em]` — épuré
- **Coins** : `rounded-3xl` sur les cards (pas rounded-2xl — plus doux, plus premium)

---

## FICHIERS À RÉÉCRIRE (TOUS)

```
src/components/landing/navbar.tsx         ← Dynamic Island indigo
src/components/landing/hero.tsx           ← Centré, nouveau titre, nouveau mockup
src/components/landing/features.tsx       ← Bento Grid 3 colonnes parfaitement aligné
src/components/landing/use-cases.tsx      ← GARDER marquee, 2 rangées max, nouveau style
src/components/landing/how-it-works.tsx   ← Layout vertical centré (PAS 2 colonnes)
src/components/landing/testimonials.tsx   ← Scénarios illustratifs (PAS de faux avis)
src/components/landing/pricing.tsx        ← Cards alignées, flex-col h-full
src/components/landing/faq.tsx            ← Accordion épuré indigo
src/components/landing/footer.tsx         ← Couleurs indigo, liens légaux
```

---

## 1. NAVBAR — Dynamic Island Flottante

Pill centrée flottante qui **rétrécit au scroll > 60px** :
- État initial : ~900px, affiche logo "Savly" + 4 liens + "Connexion" + bouton "Essai gratuit"
- Après scroll : ~520px, masque liens et "Connexion", bouton affiche "→"
- Fond : `bg-[#0a0a0f]/80 backdrop-blur-xl`
- Border : `border-indigo-500/[0.15]`
- Shadow : `shadow-[0_0_0_1px_rgba(99,102,241,0.08),0_8px_40px_rgba(0,0,0,0.6)]`
- Animation : `type: 'spring', stiffness: 380, damping: 38`
- Logo : carré indigo `bg-indigo-500` avec `shadow-[0_0_14px_rgba(99,102,241,0.5)]`
- Mobile : header fixe classique avec hamburger animé (3 barres → X)

Liens navigation :
```tsx
const NAV = [
  { label: 'Produit', href: '#features' },
  { label: 'Comment ça marche', href: '#how-it-works' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]
```

---

## 2. HERO — Centré, titre universel, mockup en dessous

### ⚠️ NOUVEAU TITRE (PAS de "e-commerce")
```
L'IA qui gère
votre support client
à votre place.
```

### Layout : TOUT CENTRÉ
- Badge pill centré
- H1 centré
- Subtitle centré
- CTAs centrés
- Trust signals centrés
- Stats centrés
- Mockup en pleine largeur EN DESSOUS avec perspective 3D

### Copy exacte
- **Badge** : `"IA en production · Réponse en < 30 secondes"`
- **Titre** : `"L'IA qui gère votre support client à votre place."`
- **Sous-titre** : `"Savly centralise vos emails, réseaux sociaux et avis clients dans une seule inbox. L'IA répond en 28 secondes avec le contexte complet — historique, commandes, politique SAV."`
- **CTA principal** : `"Démarrer mon essai"` → `/signup`
- **CTA secondaire** : `"Voir en 2 min →"`
- **Trust** : `"Sans carte bancaire · 7 jours offerts · Données en Europe"`

### Fond Hero
```css
/* Radial glow indigo centré */
background: radial-gradient(ellipse 80% 60% at 50% -20%, rgba(99,102,241,0.15), transparent);
/* Grille fine */
background-image: linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
background-size: 40px 40px;
/* Masque elliptique */
mask-image: radial-gradient(ellipse 100% 80% at 50% 10%, black 40%, transparent 100%);
```

### Mockup — Inbox Savly
Reproduire un vrai UI d'inbox avec :
- Chrome bar (3 dots + URL bar `app.savly.com/inbox`)
- Sidebar avec 4 tickets (noms, canaux, preview message, timestamps)
- Panel conversation : message client + réponse IA avec badge "Savly IA · 28 sec"
- Réponse IA dans un gradient `from-indigo-600/80 to-indigo-800/80`
- Perspective : `rotateX(6deg) rotateZ(-1deg)`
- Shadow : `shadow-[0_60px_140px_rgba(0,0,0,0.9)]`

### Badges flottants animés
2 badges qui flottent (`y: [0, -8, 0]` en boucle) :
- "4.9 / 5 — Marchands" (en haut à droite)
- "43% résolus sans intervention" (en bas à gauche)

---

## 3. FEATURES — Bento Grid 3 colonnes PARFAITEMENT ALIGNÉ

### ⚠️ ALIGNEMENT CRITIQUE
Toutes les cards doivent avoir :
- `flex flex-col h-full` pour étirer à la même hauteur
- `items-stretch` sur le grid parent
- `rounded-3xl` (pas 2xl)
- `p-8` uniforme

### Layout : grid 3 colonnes
```
Rangée 1 : [Inbox unifiée — col-span-2]  [Elle connaît vos clients]
Rangée 2 : [Elle envoie]  [Elle sait s'arrêter]  [Vous mesurez tout]
```

### 5 features avec accents colorés

| # | Titre | Description | Accent |
|---|-------|-------------|--------|
| 1 | Une inbox qui voit tout | Gmail, Shopify, Instagram, Messenger — tout au même endroit, trié par urgence. | Indigo |
| 2 | Elle connaît vos clients | L'IA lit le profil avant de répondre — commandes, retours, historique. | Cyan |
| 3 | Elle envoie, vous supervisez | 30 secondes après le message, la réponse est prête ou déjà envoyée. | Violet |
| 4 | Elle sait quand s'arrêter | Cas complexe ? L'IA stoppe l'auto-envoi et vous alerte avec contexte. | Rose |
| 5 | Vous mesurez tout | CSAT, temps de réponse, volume par canal — en live. | Amber |

### Card 1 (Inbox) — contenu enrichi
En plus du texte, ajouter les chips canaux :
```tsx
<div className="mt-6 flex flex-wrap gap-2 pt-5 border-t border-indigo-500/[0.08]">
  {['Gmail', 'Shopify', 'Instagram', 'Messenger', 'Google Reviews'].map(ch => (
    <span key={ch} className="text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-full
                               border bg-indigo-500/[0.04] border-indigo-500/[0.12] text-[#8b8ba8]">
      {ch}
    </span>
  ))}
</div>
```

### Titre de section
- Label : `"Fonctionnalités"`
- H2 : `"Tout ce qu'il faut, rien de superflu."`
- Subtitle : `"Une plateforme complète pour centraliser, automatiser et mesurer votre support."`

---

## 4. USE-CASES — Conserver marquee, 2 rangées MAX

### ⚠️ CONSERVER le composant Marquee + WordRotate
### ⚠️ SEULEMENT 2 RANGÉES (pas 3)

### Titre
```tsx
<h2>
  Savly gère les <WordRotate words={['urgences', 'retours', 'livraisons', 'remboursements', 'avis Google', 'questions simples']} />
  — vous gérez la croissance.
</h2>
```

### Items marquee
```
Top → : Suivre une livraison Colissimo, Répondre à un avis Google 2 étoiles, Traiter un retour sous garantie, Répondre à 'où est ma commande ?', Confirmer une annulation
Bottom ← : Escalader un dossier litigieux, Proposer un bon de réduction, Répondre en dehors des heures, Gérer un client VIP mécontent, Créer un ticket depuis un DM Instagram
```

---

## 5. HOW IT WORKS — Layout VERTICAL CENTRÉ (pas 2 colonnes)

### ⚠️ PAS de layout 2 colonnes (ça crée des espaces vides)
### Layout : colonne unique, max-w-3xl, centré

### Titre : `"De 0 à opérationnel en 10 minutes."`

### 3 steps avec timeline SVG animée à gauche
1. **"Branchez vos sources"** (indigo) — `< 5 min` — Gmail, Shopify, Instagram : 3 clics, zéro code. Les messages arrivent dans Savly dans la minute.
2. **"L'IA apprend votre ton"** (cyan) — `< 30 sec` — Elle analyse vos tickets passés, votre charte, vos politiques. Chaque réponse est rédigée avec votre ton exact.
3. **"Partez en production"** (violet) — `1 clic` — Activez l'auto-réponse sur les cas simples. Gardez la main sur les cas complexes.

### Après les steps : mockup ticket centré
Le mockup (message client → "IA en cours · 2s" → brouillon IA avec boutons Envoyer/Modifier) se place **sous les steps**, centré, `max-w-lg mx-auto`.

### Proof points en ligne (pas en colonne)
```tsx
<div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
  {['Opérationnel en 10 minutes', 'Sans carte bancaire', "7 jours d'essai gratuit"].map(...)}
</div>
```

### CTA : `"Commencer maintenant"` → `/signup`

---

## 6. TESTIMONIALS — SCÉNARIOS ILLUSTRATIFS (PAS de faux avis)

### ⚠️ ILLÉGAL de mettre de faux avis clients (art. L121-4 Code de la consommation)
### Remplacer par des SCÉNARIOS concrets du produit

### Titre : `"Ce que ça change, concrètement."`

### Stats strip (garder)
- `5h` gagnées/semaine
- `−68%` temps de réponse
- `4.9/5` note marchands
- `30s` brouillon IA

### Label légal OBLIGATOIRE au-dessus de la grille
```tsx
<p className="text-center text-[11px] text-[#4a4a6a] font-mono uppercase tracking-widest mb-8">
  Exemples illustratifs — basés sur les capacités du produit
</p>
```

### 6 scénarios (PAS des avis clients)

| Icône | Situation | Avant | Après Savly | Temps |
|-------|-----------|-------|-------------|-------|
| Truck | Shopify · Livraison | "Où est ma commande #4821 ?" | Réponse IA avec lien suivi Colissimo. Zéro intervention. | 28 sec |
| RefreshCcw | Gmail · Retour | "Je veux retourner mon article, trop grand." | Bon de retour prépayé + étiquette PDF. Résolu sans agent. | 41 sec |
| Star | Google Reviews · Avis négatif | Avis 2 étoiles : "Livraison trop longue" | Réponse publique rédigée avec excuses et numéro de suivi. | 15 sec |
| MessageSquare | Instagram DM · Question | "Ce jean est disponible en 36 ?" à 23h47 | L'IA vérifie le stock Shopify et répond. | 22 sec |
| AlertTriangle | Gmail · Escalade | "Si vous ne remboursez pas, je fais un chargeback." | L'IA détecte le risque et vous alerte avec contexte complet. | Immédiat |
| CreditCard | Shopify · Remboursement | "J'ai reçu un article cassé, remboursez-moi." | L'IA initie le remboursement Shopify + email de confirmation. | 33 sec |

### Style des cards scénarios
- Structure : Avant (italique, gris) → séparateur flèche ↓ → Après Savly (blanc)
- Badge temps en bas à droite : `bg-indigo-500/10 text-indigo-300 font-mono`
- Grid : `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start`

---

## 7. PRICING — Cards alignées, flex h-full

### Titre : `"Un prix honnête pour chaque étape."`
### Sous-titre : `"Commencez gratuitement. Montez en puissance quand vous avez prouvé la valeur."`

### 3 plans

| Plan | Prix | Features |
|------|------|----------|
| Pro | 29€/mois | 500 tickets/mois, 1 boîte mail, IA contextuelle, Tableau de bord |
| Business (⭐ Populaire) | 79€/mois | 2000 tickets/mois, 3 boîtes mail, Priorité support, API accès |
| Enterprise | 149€/mois | Illimité, Boîtes illimitées, Account manager, SLA garanti |

### Alignement CRITIQUE
```tsx
<div className="flex flex-col h-full">
  {/* En-tête + prix */}
  <div>...</div>
  {/* Features — prend l'espace restant */}
  <ul className="flex-1 my-7 space-y-3">...</ul>
  {/* CTA — TOUJOURS en bas */}
  <Link className="mt-auto block w-full ...">...</Link>
</div>
```

### Couleurs
- Badge "Populaire" : `bg-indigo-500 text-white`
- Card featured : `border-indigo-500/40 shadow-[0_0_60px_rgba(99,102,241,0.15)]`
- CTA featured : `bg-indigo-500 text-white hover:bg-indigo-400`
- Check : `text-indigo-400`

---

## 8. FAQ — Accordion épuré

### Titre : `"Questions fréquentes"`
### Style : séparateurs `border-b border-indigo-500/[0.1]`, pas de cards
### Icône + : tourne à 45° quand ouvert
### Animation : `AnimatePresence` pour la hauteur

### Questions
1. Combien de temps pour l'installation ?
2. L'IA répond-elle vraiment toute seule ?
3. Quels canaux sont supportés ?
4. Mes données sont-elles sécurisées ?
5. Puis-je annuler à tout moment ?
6. Que se passe-t-il après l'essai gratuit ?

---

## 9. FOOTER — Couleurs indigo + liens légaux

- Toutes les refs `emerald` → `indigo`
- CTA : `"Prêt à déléguer votre support ?"` → `/signup`
- Liens légaux : CGU (`/cgu`), Confidentialité (`/confidentialite`), Mentions légales (`/mentions-legales`), Cookies (`/cookies`)
- Fond : `bg-[#0a0a0f]`

---

## MICRO-ANIMATIONS PREMIUM (à appliquer partout)

1. **Entrée au scroll** : `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}` avec `useInView`
2. **Hover cards** : `hover:-translate-y-1` + glow coloré + border plus visible
3. **Badges flottants** : `y: [0, -8, 0]` repeat Infinity
4. **Timeline SVG** : `scaleY: 0 → 1` au scroll
5. **Dynamic Island** : spring animation sur la largeur
6. **FAQ accordion** : `AnimatePresence` + rotate icône
7. **Channel chips** : entrée séquentielle avec delay

---

## VÉRIFICATIONS OBLIGATOIRES

### Code
```bash
npx tsc --noEmit           # 0 erreur TypeScript
npm run build              # doit compiler
```

### Visuel (http://localhost:3000)
- [ ] Palette indigo visible partout (ZÉRO emerald)
- [ ] Dynamic Island rétrécit au scroll
- [ ] Hero centré, titre "L'IA qui gère votre support client à votre place."
- [ ] Features : Bento Grid parfaitement aligné, même hauteur
- [ ] Use-cases : 2 marquees seulement
- [ ] Comment ça marche : layout vertical centré, pas d'espace vide
- [ ] Testimonials : scénarios illustratifs, label "Exemples illustratifs" visible
- [ ] Pricing : 3 CTAs exactement à la même hauteur
- [ ] Mobile (375px) : hamburger menu, hero centré, cards en colonne
- [ ] Aucun des textes suivants ne doit apparaître :
  - "Vos clients méritent mieux"
  - "Le SAV e-commerce"
  - "Simple et transparent"
  - "Des résultats mesurables, dès la première semaine"

### Contenu légal
- [ ] AUCUN faux avis client (noms inventés interdits)
- [ ] Label "Exemples illustratifs" présent au-dessus des scénarios

---

## RÉCAPITULATIF

| Composant | Action | Changement clé |
|-----------|--------|----------------|
| `navbar.tsx` | Réécriture | Dynamic Island indigo, spring animation |
| `hero.tsx` | Réécriture | CENTRÉ, titre universel, mockup perspective 3D |
| `features.tsx` | Réécriture | Bento 3 cols, h-full, rounded-3xl, 5 accents |
| `use-cases.tsx` | Amélioration | 2 marquees max, WordRotate, nouveau style indigo |
| `how-it-works.tsx` | Réécriture | Vertical centré, timeline SVG, mockup en dessous |
| `testimonials.tsx` | Réécriture | Scénarios illustratifs LÉGAUX, stats strip |
| `pricing.tsx` | Réécriture | flex-col h-full, CTA mt-auto, indigo |
| `faq.tsx` | Réécriture | Accordion sans cards, indigo, rotate + icon |
| `footer.tsx` | Mise à jour | Indigo, /signup, liens légaux complets |
