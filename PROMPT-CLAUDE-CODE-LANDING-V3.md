# PROMPT CLAUDE CODE — Savly Landing Page — REFONTE RADICALE V3
# ⚠️ ZÉRO RÉUTILISATION DU CODE EXISTANT. TOUT RÉÉCRIRE.

## CONTEXTE ET MISSION

Tu vas **supprimer et réécrire de zéro** chaque composant de la landing page. Pas de copier-coller, pas de refactoring — une page entièrement nouvelle. Le code actuel est too AI-looking : même palette, même layout, même copywriting générique. Voici l'audit précis de ce qui ne fonctionne pas :

### Ce qui cloche actuellement
1. **Couleurs** — Noir (#09090b) + Emerald partout = palette de 1000 SaaS. Trop commun.
2. **Copy** — "Vos clients méritent mieux", "Opérationnel en 3 étapes", "Simple et transparent" → phrases vues des milliers de fois
3. **Layout Hero** — 2 colonnes standard avec mockup à droite = template vu partout
4. **Cards Features** — toutes à la même hauteur forcée = rigide et artificiel
5. **Testimonials** — CSS columns qui casse l'alignement vertical
6. **Section Use-Cases** — les marquees avec items génériques ne racontent pas de vraie histoire
7. **Espacements** — `py-28` identique sur toutes les sections = page sans rythme visuel

---

## NOUVELLE IDENTITÉ VISUELLE

### Nouvelle palette
Au lieu du noir pur + emerald, passer à un **gris ardoise chaud** avec accent **chaleur/intelligence** :

```css
/* Fond principal */
--bg-base: #0a0a0f        /* Bleu-noir très profond, pas pur noir */
--bg-surface: #13131a     /* Cards, surfaces */
--bg-elevated: #1a1a24    /* Éléments en relief */

/* Accent principal — changement total */
--accent: #6366f1         /* Indigo (#6366f1) — plus premium que emerald */
--accent-dim: #6366f1/15  /* Version transparente pour fonds */
--accent-glow: rgba(99,102,241,0.25)  /* Glow */

/* Accent secondaire */
--accent2: #22d3ee        /* Cyan — pour les highlights IA */
--accent2-dim: #22d3ee/10

/* Textes */
--text-primary: #f0f0ff   /* Légèrement bleuté, pas blanc pur */
--text-secondary: #8b8ba8  /* Violet-gris */
--text-muted: #4a4a6a     /* Très atténué */

/* Bordures */
--border: rgba(99,102,241,0.12)  /* Légère teinte indigo */
--border-subtle: rgba(255,255,255,0.05)
```

Traduit en Tailwind CSS custom inline :
- Fond : `bg-[#0a0a0f]`
- Surface : `bg-[#13131a]`
- Élevé : `bg-[#1a1a24]`
- Accent : `text-indigo-400`, `bg-indigo-500`, `border-indigo-500/20`
- Glow : `shadow-[0_0_40px_rgba(99,102,241,0.2)]`
- Texte : `text-[#f0f0ff]`, `text-[#8b8ba8]`
- Bordure : `border-[rgba(99,102,241,0.12)]` ou `border-indigo-500/[0.12]`

### Typographie
- Titres : `font-black tracking-[-0.04em] leading-[0.92]` — très serrés, impactants
- Body : `font-normal leading-[1.7]` — très aéré
- Labels/mono : `font-mono text-[10px] uppercase tracking-[0.25em]` — épuré
- Police : Inter (déjà en place)

---

## 1. NAVBAR — Dynamic Island (réécriture complète)

Même concept Dynamic Island que demandé précédemment mais avec la nouvelle couleur.

```tsx
// navbar.tsx — RÉÉCRIRE EN ENTIER

'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const NAV = [
  { label: 'Produit', href: '#features' },
  { label: 'Comment ça marche', href: '#how-it-works' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      {/* Desktop pill */}
      <div className="fixed top-5 inset-x-0 z-50 hidden md:flex justify-center pointer-events-none">
        <motion.nav
          animate={{ maxWidth: scrolled ? 520 : 900 }}
          transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          className="w-full pointer-events-auto flex items-center justify-between
                     h-12 px-5 rounded-full overflow-hidden
                     bg-[#0a0a0f]/80 backdrop-blur-xl
                     border border-indigo-500/[0.15]
                     shadow-[0_0_0_1px_rgba(99,102,241,0.08),0_8px_40px_rgba(0,0,0,0.6)]"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="h-6 w-6 rounded-lg bg-indigo-500 flex items-center justify-center
                            shadow-[0_0_14px_rgba(99,102,241,0.5)]">
              <span className="text-[10px] font-black text-white">S</span>
            </div>
            <AnimatePresence>
              {!scrolled && (
                <motion.span key="name" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.18 }}
                  className="text-[13px] font-bold text-[#f0f0ff] whitespace-nowrap overflow-hidden">
                  Savly
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Links */}
          <AnimatePresence>
            {!scrolled && (
              <motion.div key="links" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                {NAV.map(l => (
                  <a key={l.href} href={l.href}
                     className="px-3.5 py-2 text-[13px] font-medium text-[#8b8ba8]
                                hover:text-[#f0f0ff] transition-colors rounded-full hover:bg-white/[0.04]">
                    {l.label}
                  </a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTAs */}
          <div className="flex items-center gap-2 shrink-0">
            <AnimatePresence>
              {!scrolled && (
                <motion.div key="login" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
                  <Link href="/login" className="px-3 text-[13px] font-medium text-[#8b8ba8]
                                                  hover:text-[#f0f0ff] transition-colors whitespace-nowrap">
                    Connexion
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
            <Link href="/signup"
                  className="bg-indigo-500 text-white text-[12px] font-bold px-4 py-2 rounded-full
                             hover:bg-indigo-400 transition-all whitespace-nowrap
                             shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_28px_rgba(99,102,241,0.5)]">
              {scrolled ? '→' : 'Essai gratuit'}
            </Link>
          </div>
        </motion.nav>
      </div>

      {/* Mobile nav */}
      <header className="fixed inset-x-0 top-0 z-50 md:hidden h-14 px-5
                         flex items-center justify-between
                         bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-indigo-500/[0.1]">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-xl bg-indigo-500 flex items-center justify-center">
            <span className="text-[11px] font-black text-white">S</span>
          </div>
          <span className="text-sm font-bold text-[#f0f0ff]">Savly</span>
        </Link>
        <button onClick={() => setMenuOpen(v => !v)} aria-label="Menu" className="p-2">
          <div className="flex flex-col gap-[5px]">
            <motion.div animate={menuOpen ? { rotate: 45, y: 7 } : {}} className="w-[18px] h-[1.5px] bg-[#8b8ba8]" />
            <motion.div animate={menuOpen ? { opacity: 0 } : {}} className="w-[18px] h-[1.5px] bg-[#8b8ba8]" />
            <motion.div animate={menuOpen ? { rotate: -45, y: -7 } : {}} className="w-[18px] h-[1.5px] bg-[#8b8ba8]" />
          </div>
        </button>
      </header>
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            className="fixed top-14 inset-x-0 z-40 md:hidden bg-[#0d0d14]/98 backdrop-blur-xl
                       border-b border-indigo-500/[0.1] px-5 pb-5">
            {NAV.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                 className="block py-3.5 border-b border-white/[0.04] text-[15px] font-medium text-[#8b8ba8]
                            hover:text-[#f0f0ff] transition-colors last:border-0">
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4">
              <Link href="/login" className="text-center py-3 rounded-xl border border-white/[0.07]
                                              text-sm text-[#8b8ba8] hover:text-[#f0f0ff] transition-colors">
                Connexion
              </Link>
              <Link href="/signup" className="text-center py-3.5 rounded-xl bg-indigo-500 text-white
                                               text-sm font-bold hover:bg-indigo-400 transition-all">
                Essai gratuit — 7 jours
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

---

## 2. HERO — Layout split diagonal, nouvelle copy, nouveau mockup

### Nouveau copywriting (OBLIGATOIRE — ne pas utiliser l'ancien)
- **Titre** : "Le SAV e-commerce qui répond à votre place." *(pas de "Vos clients méritent mieux")*
- **Sous-titre** : "Shopify, Gmail, Instagram — une inbox. L'IA lit l'historique de commande et répond en 28 secondes. Vos agents gèrent les exceptions, pas les répétitions."
- **CTA principal** : "Démarrer mon essai"
- **CTA secondaire** : "Voir en 2 min →" *(lien vers une démo vidéo ou ancre)*
- **Trust** : "Sans carte bancaire · 7 jours offerts · Données en Europe"
- **Badging** : nombre de tickets gérés par l'IA (ex: "847,000 tickets résolus ce mois")

### Layout Hero — NOUVEAU (pas 2 colonnes standard)
Layout **diagonal split** :
- Fond gauche plus sombre, fond droit légèrement éclairé par un glow indigo
- Le texte est à gauche, centré verticalement
- Le mockup est à droite mais **sort du cadre** (overflow visible, déborde vers le bas)
- En mobile : stacked verticalement

```
[Badge compteur live] "847k tickets résolus ce mois"

[H1 — 5 lignes max, très grand]
Le SAV e-commerce
qui répond à
votre place.

[Subtitle — 2 lignes]
Shopify, Gmail, Instagram — une inbox.
L'IA répond en 28 secondes, contexte complet.

[CTAs]
[Démarrer mon essai]   [Voir en 2 min →]

[Trust] Sans carte · 7 jours · Europe

      ↕↕↕↕↕↕↕↕↕↕↕↕↕↕↕
      [Mockup dashboard qui dépasse le fold]
      avec badges flottants animés (float up/down)
```

### Nouveau fond Hero
Au lieu de 3 glows blobs :
```css
/* Un seul effet de fond — plus sophistiqué */
background: radial-gradient(ellipse 80% 60% at 50% -20%, rgba(99,102,241,0.15), transparent);
/* + grille fine */
background-image: linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
background-size: 40px 40px;
/* Masque elliptique qui fade vers le bas */
mask-image: radial-gradient(ellipse 100% 80% at 50% 10%, black 40%, transparent 100%);
```

### Badges flottants du Hero
Les **2 badges** (satisfaction + résolution rate) doivent flotter avec une animation `y: [0, -8, 0]` en boucle (offset de 0.5s entre les deux).

### Mockup — reproduire EN ENTIER avec le CSS suivant
```tsx
<div style={{ perspective: '1400px' }}>
  <div style={{ transform: 'rotateX(6deg) rotateZ(-1deg)', transformOrigin: 'top center' }}
       className="rounded-2xl overflow-hidden border border-indigo-500/[0.15]
                  shadow-[0_60px_140px_rgba(0,0,0,0.9),0_0_0_1px_rgba(99,102,241,0.1)]">
    {/* Chrome bar */}
    <div className="bg-[#13131a] border-b border-indigo-500/[0.1] px-4 py-2.5 flex items-center gap-3">
      <div className="flex gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </div>
      <div className="flex-1 bg-[#0a0a0f] rounded border border-white/[0.06]
                      px-3 py-1 text-[11px] text-[#4a4a6a] flex items-center gap-1.5
                      max-w-[200px] mx-auto">
        🔒 app.savly.com/inbox
      </div>
    </div>
    {/* App layout */}
    <div className="flex bg-[#0a0a0f]" style={{ height: '460px' }}>
      {/* Sidebar liste tickets */}
      <div className="w-[260px] border-r border-indigo-500/[0.1] flex flex-col shrink-0 bg-[#0d0d14]">
        <div className="px-4 py-3 border-b border-indigo-500/[0.1] flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#f0f0ff]">Messages</span>
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30
                           text-[10px] font-bold px-2 py-0.5 rounded-full">5</span>
        </div>
        {/* Items list — reproduire 4 tickets */}
        {[
          { ini: 'CA', name: 'Chloé A.', ch: 'Shopify', msg: 'Commande #7821 — livraison ?', t: '1m', active: true },
          { ini: 'TR', name: 'Thomas R.', ch: 'Instagram', msg: 'Retour colis endommagé', t: '8m', active: false },
          { ini: 'MB', name: 'Marie B.', ch: 'Gmail', msg: 'Facture introuvable dans...', t: '23m', active: false },
          { ini: 'PL', name: 'Paul L.', ch: 'Messenger', msg: 'Remboursement article X', t: '1h', active: false },
        ].map(t => (
          <div key={t.name} className={`px-4 py-3 border-b border-indigo-500/[0.07] cursor-pointer transition-colors
                                         ${t.active ? 'bg-indigo-500/[0.08] border-l-2 border-l-indigo-500' :
                                                      'hover:bg-white/[0.02] border-l-2 border-l-transparent'}`}>
            <div className="flex items-center gap-2.5">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                               ${t.active ? 'bg-indigo-500 text-white' : 'bg-white/[0.07] text-[#8b8ba8]'}`}>
                {t.ini}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#f0f0ff] truncate">{t.name}</span>
                  <span className="text-[10px] text-[#4a4a6a] shrink-0 ml-1">{t.t}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border font-medium
                    bg-indigo-500/10 border-indigo-500/20 text-indigo-300">{t.ch}</span>
                  <p className="text-[10px] text-[#4a4a6a] truncate">{t.msg}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Conversation */}
      <div className="flex-1 flex flex-col bg-[#0a0a0f]">
        <div className="px-5 py-3 border-b border-indigo-500/[0.1] flex items-center justify-between bg-[#0d0d14]">
          <div>
            <div className="text-[12px] font-bold text-[#f0f0ff]">Chloé A.</div>
            <div className="text-[10px] text-[#4a4a6a]">Shopify · Commande #7821 · 3 commandes précédentes</div>
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">
            <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-semibold text-indigo-300">IA active</span>
          </div>
        </div>
        <div className="flex-1 p-5 space-y-4 overflow-hidden">
          {/* Customer message */}
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-[#13131a] border border-indigo-500/[0.1] rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-[12px] text-[#8b8ba8] leading-relaxed">Bonjour, ma commande #7821 passée il y a 6 jours n'est toujours pas arrivée. Qu'est-ce qui se passe ?</p>
              <p className="text-[10px] text-[#4a4a6a] mt-1.5">Chloé · 15:41</p>
            </div>
          </div>
          {/* AI reply — animated entrance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className="flex justify-end">
            <div className="max-w-[85%]">
              <div className="flex items-center justify-end gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold text-cyan-400">Savly IA · 28 sec</span>
              </div>
              <div className="bg-gradient-to-br from-indigo-600/80 to-indigo-800/80 border border-indigo-500/30
                              rounded-2xl rounded-tr-sm px-4 py-3
                              shadow-[0_4px_20px_rgba(99,102,241,0.2)]">
                <p className="text-[12px] text-indigo-100 leading-relaxed">Bonjour Chloé ! Votre colis est en transit depuis hier — il est passé par le centre de Roissy ce matin. La livraison est prévue demain avant 13h. Je vous envoie le lien de suivi. 😊</p>
                <p className="text-[10px] text-indigo-300/70 mt-2">Envoyée automatiquement · 15:41</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 3. FEATURES — Bento vrai asymétrique (pas de hauteurs forcées)

### Layout
```
[Card large — 2/3 largeur]    [Card — 1/3 largeur]
[Card — 1/3 largeur]  [Card — 1/3 largeur]  [Card — 1/3 largeur]
```

### Nouvelle copy features (pas "Inbox unifiée", "IA contextuelle" etc.)
1. **"Une inbox qui voit tout"** (large) — "Gmail, Shopify, Instagram et Messenger arrivent au même endroit. Fini les onglets, fini les silences."
2. **"Elle connaît vos clients"** — "L'IA lit le profil Shopify avant de répondre : commandes, retours, dépenses. Pas de réponse générique."
3. **"Elle envoie, vous supervisez"** — "28 secondes après le message, la réponse est prête — ou déjà envoyée. Vous choisissez le niveau de contrôle."
4. **"Elle sait quand s'arrêter"** — "Remboursement litigieux ? Client en colère ? L'IA escalade vers vous avec contexte complet. Immédiatement."
5. **"Vous mesurez tout"** — "CSAT, temps de réponse, taux de résolution — en live. Sans dashboard supplémentaire."

### Accents couleurs par card
1. Indigo (#6366f1) — card large
2. Cyan (#22d3ee) — elle connaît vos clients
3. Violet (#a78bfa) — elle envoie
4. Rose (#fb7185) — elle sait s'arrêter
5. Amber (#fbbf24) — vous mesurez

### Style des cards
```tsx
// Chaque card — PAS de height fixe, laisse le contenu respirer
<div className="group relative rounded-2xl bg-[#13131a] border border-indigo-500/[0.12]
                p-7 transition-all duration-300 cursor-default
                hover:border-[accent]/30 hover:shadow-[0_0_40px_[accent]/10]
                hover:-translate-y-1">
  {/* Glow au hover */}
  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[accent]/[0.04] to-transparent
                  opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
  
  {/* Icon */}
  <div className="mb-5 h-10 w-10 rounded-xl flex items-center justify-center
                  bg-[accent]/10 border border-[accent]/20">
    <Icon className="h-5 w-5 text-[accent]" />
  </div>
  
  <h3 className="text-[17px] font-bold text-[#f0f0ff] leading-snug">{title}</h3>
  <p className="mt-3 text-[14px] text-[#8b8ba8] leading-relaxed">{description}</p>
</div>
```

---

## 4. USE-CASES — Conserver + habiller différemment

### ⚠️ CONSERVER le marquee animé de `use-cases.tsx` (WordRotate + Marquee)

Changer uniquement :
1. Le titre H2 :
   - Ancien : "Tout ce que Savly fait pour [rotation]"
   - Nouveau : **"Savly gère les [WordRotate] — vous gérez la croissance."**
   - WordRotate items : `['urgences', 'retours', 'livraisons', 'remboursements', 'avis Google', 'questions simples']`

2. Les items du marquee — remplacer par des phrases plus concrètes :
   ```
   Top row:
   - "Suivre une livraison Colissimo"
   - "Répondre à un avis Google 2 étoiles"
   - "Traiter un retour sous garantie"
   - "Répondre à 'où est ma commande ?'"
   - "Confirmer une annulation"

   Bottom row:
   - "Escalader un dossier litigieux"
   - "Proposer un bon de réduction"
   - "Répondre en dehors des heures"
   - "Gérer un client VIP mécontent"
   - "Créer un ticket depuis un DM Instagram"
   ```

3. Fond : changer `bg-[#09090b]` → `bg-[#0a0a0f]`
4. Border des cards : changer `border-white/5` → `border-indigo-500/[0.1]`
5. Icônes : `text-indigo-400` au lieu de `text-emerald-400`

---

## 5. HOW IT WORKS — Nouvelle structure "avant/après" + 3 vrais steps

### Nouveau titre : "De 0 à opérationnel en 10 minutes."

### Nouveau layout — Côte à côte avec illustration
Au lieu de la timeline seule, créer un layout 2 colonnes :
- Colonne gauche : 3 steps numérotés avec description
- Colonne droite : **une illustration animée** qui montre l'état du SAV avant → après

### Nouvelles descriptions des steps (PAS "Connectez vos canaux")
1. **"Branchez vos sources"** — "Shopify, Gmail, Instagram : 3 clics, zéro configuration. Les tickets arrivent dans Savly dans la minute."
2. **"L'IA apprend votre ton"** — "Importez vos règles SAV, votre politique de remboursement, votre ton. L'IA s'y adapte immédiatement."
3. **"Partez en production"** — "Activez l'auto-réponse sur les cas simples. Gardez le contrôle sur les cas complexes. Ajustez en temps réel."

### Couleurs des steps
- Step 1 : indigo
- Step 2 : cyan
- Step 3 : violet

---

## 6. TESTIMONIALS — CSS Grid 3 colonnes, items-start (CRITIQUE)

### ⚠️ INTERDICTION D'UTILISER CSS `columns-*`
Utiliser exclusivement :
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
```

### Nouvelle copy testimonials (changer TOUS les textes)
```
1. Marie-Lou D. — Fondatrice, boutique mode — "On avait 2h de SAV par jour. Maintenant c'est 20 minutes. Et les réponses sont meilleures que les miennes."

2. Kevin T. — Head of Ops, DNVB — "43% de nos tickets sont résolus sans intervention humaine. Chaque semaine. Depuis le premier jour."

3. Inès C. — Shopify merchant — "L'IA lit l'historique Shopify et répond avec le bon numéro de suivi, le bon statut de remboursement. C'est bluffant."

4. Antoine R. — Agence e-commerce — "On gère maintenant 6 clients avec la même équipe qu'avant. Savly est un multiplicateur de force."

5. Clara B. — Customer Success Lead — "Les cas compliqués arrivent dans mon inbox avec tout le contexte. Je passe directement à la solution."

6. Mehdi S. — Fondateur, tech startup — "Setup en 18 minutes chrono. Le lendemain matin, 12 tickets avaient déjà reçu une réponse IA validée."
```

### Style des cards testimonials
```tsx
<div className="rounded-2xl bg-[#13131a] border border-indigo-500/[0.1] p-6
                transition-all duration-300 hover:border-indigo-500/[0.22]
                hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
  
  {/* Étoiles */}
  <div className="flex gap-0.5 mb-4">
    {[...Array(5)].map((_, i) => (
      <svg key={i} className="h-3.5 w-3.5 text-indigo-400 fill-indigo-400" viewBox="0 0 20 20">
        <path d="M9.049 2.927..."/>
      </svg>
    ))}
  </div>
  
  <p className="text-[14px] leading-[1.7] text-[#8b8ba8] mb-5">&ldquo;{t.text}&rdquo;</p>
  
  <div className="flex items-center gap-3 pt-4 border-t border-indigo-500/[0.08]">
    <div className="h-9 w-9 rounded-full bg-indigo-500/15 border border-indigo-500/20
                    flex items-center justify-center text-[11px] font-bold text-indigo-400">
      {t.initials}
    </div>
    <div>
      <p className="text-[13px] font-bold text-[#f0f0ff]">{t.author}</p>
      <p className="text-[11px] text-[#4a4a6a]">{t.role}</p>
    </div>
  </div>
</div>
```

---

## 7. PRICING — Alignement cards + nouveau titre

### Nouveau titre : "Un prix honnête pour chaque étape."
### Nouveau sous-titre : "Commencez gratuitement. Montez en puissance quand vous avez prouvé la valeur."

### Problème d'alignement actuel → FIX
Les cards Pricing doivent toutes avoir `display: flex; flex-direction: column` avec `flex-1` sur la liste des features et `mt-auto` sur le CTA. S'assurer que le JSX suit ce pattern :
```tsx
<div className="flex flex-col h-full">
  {/* En-tête */}
  <div>...</div>
  {/* Prix */}
  <div>...</div>
  {/* Features — prend l'espace restant */}
  <ul className="flex-1 my-7 space-y-3">...</ul>
  {/* CTA — toujours en bas */}
  <Link href="/signup" className="mt-auto block w-full ...">...</Link>
</div>
```

### Couleurs pricing — passer à indigo
- Badge "Populaire" : `bg-indigo-500 text-white`
- Card featured : `border-indigo-500/40 shadow-[0_0_60px_rgba(99,102,241,0.15)]`
- CTA featured : `bg-indigo-500 text-white hover:bg-indigo-400`
- Check icon featured : `text-indigo-400`

---

## 8. FAQ — Section déjà correcte — seulement ajuster couleurs

Changer dans `faq.tsx` :
- `text-emerald-500` → `text-indigo-400`
- `border-white/[0.06]` → `border-indigo-500/[0.1]`
- `bg-[#09090b]` → `bg-[#0a0a0f]`
- Email contact : garder `contact@savly.com`

---

## 9. FOOTER — Mise à jour couleurs + liens

Changer dans `footer.tsx` :
- Toutes les refs `emerald-500` → `indigo-500`
- Lien CTA footer "Démarrer l'essai" → `href="/signup"`
- Section Legal : ajouter `{ label: 'Cookies', href: '/cookies' }`
- Fond : `bg-[#09090b]` → `bg-[#0a0a0f]`
- H2 footer CTA : "Prêt à déléguer votre SAV ?" *(pas "Prêt à automatiser votre SAV ?")*

---

## VÉRIFICATIONS OBLIGATOIRES

### Code
1. `npx tsc --noEmit` → 0 erreurs TypeScript
2. `npm run build` → doit compiler
3. Chaque composant avec `'use client'` ne doit pas importer de module server-only

### Visual (ouvrir http://localhost:3000)
4. Nouvelle palette indigo visible partout (plus de emerald dominant)
5. Dynamic Island rétrécit au scroll > 60px
6. Hero layout avec mockup qui déborde vers le bas (pas 2 colonnes)
7. Features Bento : hauteurs naturelles (pas forcées)
8. Testimonials : CSS Grid → alignement parfait sans bulles décalées
9. Pricing : les 3 CTAs sont exactement à la même hauteur verticale
10. Mobile (375px) : test hamburger menu, hero centré, cards en colonne

### Copy
11. Aucun de ces textes ne doit apparaître :
    - "Vos clients méritent mieux"
    - "Opérationnel en 3 étapes"
    - "Simple et transparent"
    - "Des résultats mesurables"
    - "Tout ce dont votre SAV a besoin"

---

## RÉCAPITULATIF

| Composant | Action | Changement clé |
|-----------|--------|----------------|
| `navbar.tsx` | Réécriture | Dynamic Island indigo, hamburger mobile |
| `hero.tsx` | Réécriture | Mockup sous le texte, badges flottants animés, palette indigo |
| `features.tsx` | Réécriture | Bento naturel (pas height forcé), 5 nouvelles copies, accents variés |
| `use-cases.tsx` | GARDER marquee + modifier | Nouveau titre, nouveaux items marquee, couleurs indigo |
| `how-it-works.tsx` | Réécriture | Layout 2 colonnes, nouvelles copies steps |
| `testimonials.tsx` | Réécriture | CSS Grid strict, 6 nouveaux témoignages, étoiles |
| `pricing.tsx` | Amélioration | flex-col h-full sur cards, couleurs indigo, CTA mt-auto |
| `faq.tsx` | Couleurs seulement | emerald → indigo |
| `footer.tsx` | Mise à jour | couleurs indigo, lien /signup, nouveau H2 |
