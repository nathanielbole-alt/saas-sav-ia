# PROMPT CLAUDE CODE — Refonte complète landing page Savly (style 2026)

## 🔧 PREMIÈRE INSTRUCTION OBLIGATOIRE
**Avant tout, utilise le serveur MCP Gemini Design pour t'inspirer des tendances UI/UX 2026 les plus avancées : interfaces sobres, spatiales, minimalistes dynamiques. Requête suggérée : "2026 SaaS landing page design trends — Dynamic Island navigation, spatial UI, minimal dark mode, motion design".**

---

## Contexte projet

Stack : Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS 4, Framer Motion.
**Savly** = SaaS B2B de SAV automatisé par IA pour e-commerçants. Centralise emails, Shopify, Instagram, Messenger.

Couleurs actuelles conservées :
- Fond : `#09090b` (quasi-noir)
- Accents : `emerald-500` (#10b981) / `teal-500`
- Textes : `zinc-100`, `zinc-400`, `zinc-600`

Fichiers concernés :
```
src/
├── app/page.tsx
└── components/landing/
    ├── navbar.tsx          ← REMPLACER par Dynamic Island
    ├── hero.tsx            ← REFONTE TOTALE
    ├── features.tsx        ← REFONTE
    ├── use-cases.tsx       ← REFONTE
    ├── how-it-works.tsx    ← REFONTE
    ├── testimonials.tsx    ← REFONTE
    ├── pricing.tsx         ← REFONTE
    ├── faq.tsx             ← REFONTE
    └── footer.tsx          ← MISE À JOUR
```

---

## 1. DYNAMIC ISLAND — Remplacer la navbar classique

### Concept
Remplacer la navbar fixe full-width par une **Dynamic Island flottante** centrée, à la manière de la Dynamic Island de l'iPhone mais pour le web. Elle :
- Apparaît en haut de page, centrée, flottante (pas full-width)
- S'étend et se rétracte avec des animations fluides selon le scroll
- Change de forme selon le contexte (compacte au scroll, étendue au top)
- Glassmorphism ultra-léger (`backdrop-blur-xl`, fond `#09090b/70`)

### Comportement

```
État IDLE (haut de page) :
┌─────────────────────────────────────────────────────┐
│  [S] Savly    Fonct.  Cas d'usage  Tarifs  FAQ     [Se connecter]  [Essai gratuit →] │
└─────────────────────────────────────────────────────┘
Forme : pill allongée, largeur ~800px max, rounded-full

État SCROLLED (après 80px) :
        ┌──────────────────────────────┐
        │  [S]  Fonct.  Tarifs  FAQ  [→] │
        └──────────────────────────────┘
Forme : pill plus compacte, largeur ~500px, se rétrécit + glisse vers le haut
Transition : spring animation Framer Motion

Hover sur pill scrollée : s'étend légèrement pour montrer le CTA complet
```

### Code à implémenter dans `navbar.tsx` :

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: "Cas d'usage", href: '#use-cases' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isCompact = scrolled && !hovered

  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none">
      <motion.nav
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={{
          width: isCompact ? '480px' : '820px',
          paddingLeft: isCompact ? '16px' : '24px',
          paddingRight: isCompact ? '16px' : '24px',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="pointer-events-auto relative flex items-center justify-between h-12 rounded-full
                   bg-[#09090b]/70 backdrop-blur-xl border border-white/10
                   shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]"
      >
        {/* Logo — toujours visible */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.4)]">
            <span className="text-[10px] font-black text-white">S</span>
          </div>
          <AnimatePresence>
            {!isCompact && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-bold text-white overflow-hidden whitespace-nowrap"
              >
                Savly
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Nav links — masqués en compact */}
        <AnimatePresence>
          {!isCompact && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 text-[13px] text-zinc-400 font-medium hover:text-white
                             transition-colors rounded-full hover:bg-white/5"
                >
                  {link.label}
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTAs */}
        <div className="flex items-center gap-2 shrink-0">
          <AnimatePresence>
            {!isCompact && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
              >
                <Link
                  href="/login"
                  className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors px-3 whitespace-nowrap"
                >
                  Connexion
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          <Link
            href="/signup"
            className="bg-emerald-500 text-[#09090b] text-[12px] font-bold px-4 py-1.5
                       rounded-full hover:bg-emerald-400 transition-all
                       hover:shadow-[0_0_16px_rgba(16,185,129,0.4)] whitespace-nowrap"
          >
            {isCompact ? '→' : 'Essai gratuit'}
          </Link>
        </div>
      </motion.nav>
    </div>
  )
}
```

---

## 2. HERO — Refonte radicale

### Vision 2026
- Layout **centré** (pas 2 colonnes) — headline monumentale qui prend toute la largeur
- Typographie ultra-bold, kerning serré (`tracking-[-0.04em]`)
- Un seul effet de fond : **grain texture** subtil + **un seul glow** centré emerald/teal (pas 3 spots qui font cheap)
- Le **mockup produit** descend EN DESSOUS du texte, prend 100% de la largeur (pas coincé à droite)
- **Effet de profondeur** : le mockup a une légère perspective 3D CSS (`rotateX(4deg)`)
- Badges stats flottants avec **animation magnetic** (bougent légèrement au hover de la section)
- Strip "connecté à" transformé en **logos animés avec icônes SVG** réelles (pas juste du texte)

### Structure
```
[Badge pill] "Nouveau : réponses IA en < 30 secondes"

[H1 centré, très grand]
Vos clients attendent.
Votre IA répond.

[Subtitle centré, max-w-xl]
Savly centralise tous vos canaux SAV et rédige la réponse parfaite — 
historique de commande, ton adapté, contexte complet.

[2 CTAs centrés]
[Tester 7 jours → ]  [Voir la démo ▷]

[Trust row]
✓ Sans carte bancaire  ✓ Onboarding 5 min  ✓ Annulation libre

[Stats row — 3 chiffres avec ligne séparatrice]
< 30s  |  43%  |  4.9/5

[Mockup pleine largeur avec perspective 3D]
[Image du dashboard animée]
```

---

## 3. FEATURES — Bento Grid revisité

### Style 2026
- **Bento grid asymétrique** : 1 grande carte + 4 petites
- Les cartes ont des micro-animations **déclenchées au scroll** (Intersection Observer via `useInView`)
- Pas de fond coloré fort — juste `bg-[#0c0c10]/60` avec `border border-white/5`
- Chaque carte a un **accent de couleur UNIQUE** (pas tout en emerald) : une en violet, une en amber, une en blue, une en emerald
- **Hover state** : la carte s'élève légèrement + un glow de la couleur d'accent filtre depuis le bas

### 5 features à mettre en avant
1. **Inbox unifiée** (grande) — tous vos canaux en 1 vue, accent emerald
2. **IA contextuelle** — répond avec historique Shopify, accent violet (#a78bfa)
3. **Auto-réponse 30s** — déclenché automatiquement, accent amber
4. **Escalade intelligente** — détecte les cas complexes, accent rose
5. **Analytics temps réel** — CSAT, temps réponse, ticket volume, accent blue

---

## 4. USE-CASES — Section "Qui utilise Savly"

### Style 2026
Transformer la section marquee en **3 profils utilisateurs interactifs** :
- 3 cards cliquables : "E-commerce Shopify", "Agence SAV", "Marque DTC"
- Quand on clique/hover sur une card → le contenu de droite (mockup) change avec une animation fluide
- Inspiration : le pattern "feature tabs" de Vercel/Linear

### Structure
```
[Titre] Pour qui est fait Savly ?

[3 onglets horizontaux]
[Shopify Store]  [Agence SAV]  [Marque DTC]

[Panel animé selon onglet actif]
→ Shopify Store : "Sync automatique commandes, gestion retours, avis Google"
→ Agence SAV : "Multi-clients, vue équipe, mode white-label"  
→ Marque DTC : "Ton de marque injecté dans chaque réponse IA"
```

---

## 5. HOW IT WORKS — Timeline verticale animée

### Style 2026
Transformer en **timeline verticale** avec :
- Ligne centrale verticale qui se "remplit" au fur et à mesure du scroll (SVG stroke animation)
- 4 étapes avec numéros, icônes, et une courte description
- À gauche les étapes impaires, à droite les paires (zigzag)

### 4 étapes
1. **Connectez vos canaux** — Gmail, Shopify, Instagram en 1 clic
2. **Savly apprend votre business** — politiques SAV, ton, FAQ automatique
3. **L'IA répond à votre place** — en 30s, contexte Shopify inclus
4. **Vous supervisez** — escalade si besoin, analytics en temps réel

---

## 6. TESTIMONIALS — Format "Wall of Love"

### Style 2026
- **Masonry grid** (pas de carousel) — 6 à 9 témoignages en grille asymétrique
- Les cards ont des tailles différentes (3 petites + 2 moyennes + 1 grande featured)
- La grande card a une citation longue avec avatar et company logo placeholder
- Léger **parallax** au scroll (Framer Motion `useScroll` + `useTransform`)
- Pas d'étoiles répétées partout — juste sur la grande card

---

## 7. PRICING — Cards avec effet de comparaison

### Style 2026
- 3 plans : Pro (29€), Business (79€), Enterprise (149€)
- La card "Business" (plan recommandé) est mise en avant avec :
  - Border `emerald-500/50` + glow `shadow-[0_0_40px_rgba(16,185,129,0.15)]`
  - Badge pill "Le plus populaire" en emerald
  - Légèrement plus grande (scale transform au hover)
- **Toggle mensuel/annuel** (-20%) avec animation spring
- CTAs → `/signup`

---

## 8. FAQ — Accordion épuré

### Style 2026
- Accordion ultra-minimaliste
- Pas de bordures de cards — juste des séparateurs `border-b border-white/5`
- Icône `+` / `×` avec rotation animée
- L'accordéon ouvert révèle le contenu avec une animation `height: auto` douce (Framer Motion `AnimatePresence`)
- Ajouter les `id="faq"` et `scroll-mt-20` (déjà fait)

---

## 9. FOOTER — Mise à jour

- Mettre le lien CTA footer → `/signup`
- Ajouter le lien `/cookies` dans la section Legal (déjà dans footerLinks si créé, sinon ajouter)
- Remplacer le lien `href="/login"` du CTA footer par `href="/signup"`

---

## Contraintes techniques importantes

### Performance
- Pas d'imports CSS externes (pas de Google Fonts runtime — déjà géré dans `layout.tsx`)
- Les animations avec `useInView` doivent utiliser `{ once: true }` pour ne pas re-animer au scroll retour
- Les composants `'use client'` uniquement si nécessaire (hooks ou événements)
- Pas de librairies tierces supplémentaires (pas d'installation npm) — tout avec Framer Motion + Tailwind + Lucide React

### Accessibilité
- Le Dynamic Island doit avoir un `aria-label="Navigation principale"`
- Les accordions FAQ doivent avoir `aria-expanded` et `aria-controls`
- Le focus trap dans le menu mobile si ajouté

### Cohérence de design
- **PAS** de `rounded-lg` partout — varier : `rounded-xl` pour cards, `rounded-full` pour pills/badges, `rounded-2xl` pour les grandes surfaces
- **PAS** de gradients en fond sur tout — economy of attention : gradient seulement sur les éléments clés (le glow hero, le badge pill du hero, les CTA)
- Les `text-sm` dans les subtitles → passer en `text-base` ou `text-lg` pour la lisibilité
- **Espacement généreux** : sections à `py-32` minimum, pas `py-20`

---

## Fichiers à MODIFIER (aucun fichier à créer)

| Fichier | Changement |
|---------|------------|
| `src/components/landing/navbar.tsx` | **REMPLACER** entièrement par Dynamic Island |
| `src/components/landing/hero.tsx` | **REFONTE** — layout centré, mockup pleine largeur |
| `src/components/landing/features.tsx` | **REFONTE** — Bento Grid asymétrique |
| `src/components/landing/use-cases.tsx` | **REFONTE** — 3 onglets avec panel animé |
| `src/components/landing/how-it-works.tsx` | **REFONTE** — timeline verticale animée |
| `src/components/landing/testimonials.tsx` | **REFONTE** — masonry grid |
| `src/components/landing/pricing.tsx` | **REFONTE** — toggle annuel/mensuel + card featured |
| `src/components/landing/faq.tsx` | **REFONTE** — accordion épuré |
| `src/components/landing/footer.tsx` | **UPDATE** — liens + CTA vers /signup |

---

## Vérification finale

1. `npm run build` doit passer 0 erreur TypeScript
2. ESLint : 0 erreur (2 warnings max tolérés)
3. Le Dynamic Island doit animer correctement entre l'état idle et scrolled
4. Scroll vers `#features`, `#use-cases`, `#pricing`, `#faq` depuis la navbar doit fonctionner
5. CTA "Essai gratuit" et "Tester 7 jours" doivent pointer vers `/signup`
6. Le site doit être responsive — tester à 375px (iPhone SE), 768px (iPad), 1280px (desktop)
7. Sur mobile : le Dynamic Island devient un menu hamburger accessible (slide-down ou bottom sheet)
