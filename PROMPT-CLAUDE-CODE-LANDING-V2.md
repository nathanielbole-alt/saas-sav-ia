# PROMPT CLAUDE CODE — Landing Page Savly — Refonte V2 (Ultra-détaillé)

## 🔧 PREMIÈRE INSTRUCTION OBLIGATOIRE
**Utilise le serveur MCP Gemini Design MAINTENANT avant d'écrire une seule ligne de code. Requête : "2026 SaaS landing page design — dark minimal, floating pill navbar, asymmetric bento grid, masonry testimonials, scroll-triggered animations". Inspire-toi profondément des résultats avant de commencer.**

---

## Contexte et objectif

Tu vas **réécrire entièrement** la landing page de Savly. Pas de retouches — une réécriture totale de chaque fichier. Le premier passage était trop proche de l'original. Cette fois, l'UX et le code doivent être fondamentalement différents.

Stack : Next.js 16 App Router, TypeScript strict, Tailwind CSS 4, Framer Motion 11, Lucide React.

Design system :
- Fond : `#09090b`
- Surface cards : `#0c0c10` ou `#111116`
- Bordures : `border-white/[0.07]` (très subtiles)
- Texte primary : `text-zinc-100`
- Texte muted : `text-zinc-400`, `text-zinc-500`
- Accent : `emerald-500` (#10b981)
- Accent 2 : violet (#a78bfa), amber (#fbbf24), sky (#38bdf8)
- Font : Inter (déjà configuré dans layout.tsx)

---

## RÈGLE N°1 — NE PAS SUPPRIMER LA SECTION USE-CASES

⚠️ **CRITIQUE** : Le fichier `src/components/landing/use-cases.tsx` contient une section avec deux marquees animées (rangée d'icônes qui défilent de gauche à droite et de droite à gauche). **Cette section DOIT être conservée et améliorée**. Ne la supprime PAS. Elle s'appelle actuellement "Tout ce que Savly fait pour" avec un `<WordRotate>`. Tu dois la garder ET l'améliorer visuellement.

---

## RÈGLE N°2 — ZÉRO CSS `columns-` pour les testimonials

Le fichier `testimonials.tsx` actuel utilise `columns-1 md:columns-2 lg:columns-3`. **Ce pattern CSS columns cause des problèmes d'alignement** (les cards ne s'alignent pas correctement). Utilise à la place une **CSS Grid** avec des colonnes explicites et `align-items: start`.

---

## Fichiers à réécrire

```
src/components/landing/navbar.tsx        ← RÉÉCRIRE (Dynamic Island)
src/components/landing/hero.tsx          ← RÉÉCRIRE (layout centré + mockup largescreen)
src/components/landing/features.tsx      ← RÉÉCRIRE (bento asymétrique)
src/components/landing/use-cases.tsx     ← AMÉLIORER (garder marquee, refaire titre/style)
src/components/landing/how-it-works.tsx  ← RÉÉCRIRE (timeline visuelle plus impactante)
src/components/landing/testimonials.tsx  ← RÉÉCRIRE (grid CSS propre, pas columns)
src/components/landing/pricing.tsx       ← AMÉLIORER (déjà bon, ajuster alignement)
src/components/landing/faq.tsx           ← RÉÉCRIRE (accordion plus épuré)
src/components/landing/footer.tsx        ← METTRE À JOUR (liens + CTA /signup)
```

---

## 1. NAVBAR — Dynamic Island Flottante

### Concept exact
Remplace la navbar full-width par une **pill flottante centrée** qui :
- Est fixe en haut (`fixed top-4 inset-x-0 z-50 flex justify-center`)
- À l'état initial (top de page) : largeur ~820px, affiche logo + "Savly" + liens + "Connexion" + bouton CTA
- Après 80px de scroll : rétrécit à ~480px (pill compacte), masque liens et "Connexion", le bouton CTA affiche "→" au lieu de "Essai gratuit"
- Au hover de la pill compacte : se ré-étend
- Fond : `bg-[#09090b]/75 backdrop-blur-xl`
- Bordure : `border border-white/[0.09]`
- Shadow : `shadow-[0_8px_32px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.05)]`
- Animation de la largeur : `type: 'spring', stiffness: 400, damping: 35`

### Code complet de navbar.tsx

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: "Cas d'usage", href: '#use-cases' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const compact = scrolled && !hovered

  return (
    <>
      {/* Desktop Dynamic Island */}
      <div className="fixed top-4 inset-x-0 z-50 hidden md:flex justify-center pointer-events-none">
        <motion.nav
          aria-label="Navigation principale"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          animate={{ width: compact ? 480 : 820 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="pointer-events-auto relative flex items-center justify-between h-11 px-4 rounded-full
                     bg-[#09090b]/75 backdrop-blur-xl border border-white/[0.09]
                     shadow-[0_8px_32px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.05)]
                     overflow-hidden"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600
                            flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.35)]">
              <span className="text-[10px] font-black text-[#09090b]">S</span>
            </div>
            <AnimatePresence>
              {!compact && (
                <motion.span
                  key="savly-name"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-bold text-white whitespace-nowrap overflow-hidden"
                >
                  Savly
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Nav links — hidden when compact */}
          <AnimatePresence>
            {!compact && (
              <motion.div
                key="nav-links"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5"
              >
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="px-3.5 py-1.5 text-[13px] font-medium text-zinc-400
                               hover:text-white transition-colors rounded-full hover:bg-white/[0.06]"
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
              {!compact && (
                <motion.div
                  key="login-link"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <Link
                    href="/login"
                    className="text-[13px] font-medium text-zinc-400 hover:text-white
                               transition-colors px-2 whitespace-nowrap"
                  >
                    Connexion
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
            <Link
              href="/signup"
              className="bg-emerald-500 text-[#09090b] font-bold rounded-full
                         transition-all hover:bg-emerald-400
                         hover:shadow-[0_0_16px_rgba(16,185,129,0.4)]
                         whitespace-nowrap"
              style={{ padding: compact ? '5px 10px' : '5px 14px', fontSize: '12px' }}
            >
              {compact ? '→' : 'Essai gratuit'}
            </Link>
          </div>
        </motion.nav>
      </div>

      {/* Mobile nav — simple top bar with hamburger */}
      <nav className="fixed top-0 inset-x-0 z-50 md:hidden flex items-center justify-between
                      px-5 h-14 bg-[#09090b]/90 backdrop-blur-xl border-b border-white/[0.07]">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600
                          flex items-center justify-center">
            <span className="text-[11px] font-black text-[#09090b]">S</span>
          </div>
          <span className="text-sm font-bold text-white">Savly</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
          className="flex flex-col gap-1.5 p-1"
        >
          <motion.span
            animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            className="block w-5 h-px bg-zinc-400"
          />
          <motion.span
            animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
            className="block w-5 h-px bg-zinc-400"
          />
          <motion.span
            animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            className="block w-5 h-px bg-zinc-400"
          />
        </button>
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed top-14 inset-x-0 z-40 md:hidden overflow-hidden
                       bg-[#0c0c10]/98 backdrop-blur-xl border-b border-white/[0.07]"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-[15px] font-semibold text-zinc-300 hover:text-white
                             transition-colors border-b border-white/[0.05] last:border-0"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4">
                <Link href="/login" className="text-center text-sm font-medium text-zinc-400
                                               py-3 rounded-xl hover:bg-white/[0.05] hover:text-white transition-all">
                  Se connecter
                </Link>
                <Link href="/signup" className="text-center text-sm font-bold bg-emerald-500
                                                 text-[#09090b] py-3.5 rounded-xl hover:bg-emerald-400 transition-all">
                  Essai gratuit 7 jours
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

---

## 2. HERO — Layout centré avec mockup grande taille

### Ce qui doit CHANGER par rapport à l'actuel
- Layout actuel : 2 colonnes (texte gauche, mockup droite) → **REMPLACER par layout 100% centré**
- Badge, H1, subtitle, CTAs : tous centrés
- Le mockup passe EN DESSOUS du texte, en pleine largeur (max-w-5xl), avec effet de perspective 3D CSS
- Un seul glow de fond centré (pas 3 blobs qui font cheap)
- La grille de fond reste (elle est jolie) mais légèrement réduite en opacité

### Structure exacte du JSX Hero

```
<section className="min-h-screen bg-[#09090b] relative overflow-hidden pt-32 pb-20 flex flex-col items-center">

  {/* 1 seul glow centré */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px]
                  bg-gradient-to-b from-emerald-600/20 to-transparent blur-[120px] pointer-events-none" />
  
  {/* Grid de fond */}
  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),
                  linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:32px_32px]
                  [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_50%,transparent_100%)]" />
  
  {/* Contenu centré */}
  <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
    
    {/* Badge pill */}
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} ...>
      <span className="inline-flex items-center gap-2 bg-emerald-500/[0.08] border border-emerald-500/20
                       rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        IA en production · Réponse en &lt; 30 secondes
      </span>
    </motion.div>

    {/* H1 — très grande, tracking serré */}
    <motion.h1 className="mt-8 text-6xl sm:text-7xl xl:text-8xl font-black leading-[0.95]
                           tracking-[-0.04em] text-white">
      Vos clients{' '}
      <br />
      <span className="bg-clip-text text-transparent bg-gradient-to-r
                        from-emerald-400 via-emerald-500 to-teal-500">
        méritent mieux.
      </span>
    </motion.h1>

    {/* Subtitle */}
    <motion.p className="mt-8 text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
      Savly centralise Gmail, Shopify, Instagram et Messenger dans une seule inbox.
      L&apos;IA rédige la réponse parfaite en 30 secondes — historique de commande inclus.
    </motion.p>

    {/* CTAs */}
    <motion.div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
      <Link href="/signup" className="group relative inline-flex items-center gap-2.5
                                      bg-emerald-500 text-[#09090b] font-bold px-8 py-4
                                      rounded-2xl text-[15px] transition-all
                                      hover:bg-emerald-400 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]
                                      hover:-translate-y-0.5">
        Tester gratuitement 7 jours
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </Link>
      <button className="inline-flex items-center gap-2 text-zinc-400 hover:text-white
                         text-[15px] font-medium transition-colors">
        <span className="h-10 w-10 rounded-full bg-white/[0.06] border border-white/[0.1]
                        flex items-center justify-center">▷</span>
        Voir la démo
      </button>
    </motion.div>

    {/* Trust signals */}
    <motion.div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {['Sans carte bancaire', 'Onboarding 5 min', 'Annulation libre'].map(item => (
        <span key={item} className="flex items-center gap-1.5 text-[13px] text-zinc-500">
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          {item}
        </span>
      ))}
    </motion.div>

    {/* Stats row */}
    <motion.div className="mt-16 grid grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden
                            border border-white/[0.07] max-w-lg mx-auto">
      {[
        { value: '< 30s', label: 'Réponse IA' },
        { value: '43%', label: 'Résolus auto' },
        { value: '4.9/5', label: 'Note clients' },
      ].map(stat => (
        <div key={stat.value} className="bg-[#0c0c10] py-5 text-center">
          <div className="text-2xl font-black text-white font-mono">{stat.value}</div>
          <div className="text-[11px] text-zinc-600 uppercase tracking-wider font-medium mt-1">{stat.label}</div>
        </div>
      ))}
    </motion.div>
  </div>

  {/* Mockup pleine largeur SOUS le texte */}
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4, duration: 0.8 }}
    className="relative mt-20 mx-auto w-full max-w-5xl px-6"
    style={{ perspective: '1200px' }}
  >
    <div style={{ transform: 'rotateX(4deg) rotateY(-1deg)', transformOrigin: 'top center' }}
         className="relative rounded-2xl overflow-hidden border border-white/[0.1]
                    shadow-[0_40px_120px_rgba(0,0,0,0.8)] ring-1 ring-white/[0.05]">
      {/* Chrome bar du navigateur */}
      <div className="bg-[#111116] border-b border-white/[0.07] px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
        </div>
        <div className="flex-1 bg-[#09090b] rounded-md border border-white/[0.06] px-3 py-1.5
                        text-[11px] text-zinc-600 flex items-center gap-1.5 max-w-xs mx-auto">
          🔒 app.savly.com/inbox
        </div>
      </div>
      {/* App content */}
      <div className="bg-[#09090b] flex" style={{ height: '480px' }}>
        {/* Sidebar liste tickets */}
        <div className="w-[280px] border-r border-white/[0.06] flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200">Inbox</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">3</span>
          </div>
          {/* tickets list — même contenu qu'avant */}
          ...
        </div>
        {/* Conversation panel */}
        <div className="flex-1 flex flex-col">
          ...
        </div>
      </div>
    </div>

    {/* Badges flottants */}
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      className="absolute -top-4 -right-2 md:right-8 bg-[#111116]/95 backdrop-blur-md
                 border border-white/[0.1] rounded-2xl px-4 py-3 shadow-2xl z-20">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
        </div>
        <div>
          <div className="text-sm font-black text-white">4.9 / 5</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Marchands</div>
        </div>
      </div>
    </motion.div>

    <motion.div
      animate={{ y: [0, 6, 0] }}
      transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
      className="absolute -bottom-4 -left-2 md:left-8 bg-[#111116]/95 backdrop-blur-md
                 border border-white/[0.1] rounded-2xl px-4 py-3 shadow-2xl z-20">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
          <Check className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-sm font-black text-white">43% résolus</div>
          <div className="text-[10px] text-zinc-500 tracking-wide">sans intervention</div>
        </div>
      </div>
    </motion.div>
  </motion.div>

  {/* Strip channels intégrations */}
  <motion.div className="mt-24 text-center">
    <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-700 mb-6">
      Connecté nativement à
    </p>
    <div className="flex flex-wrap items-center justify-center gap-3">
      {['Gmail', 'Shopify', 'Instagram', 'Messenger', 'Google Reviews'].map(ch => (
        <div key={ch} className="bg-[#111116] border border-white/[0.07] rounded-full
                                  px-5 py-2 text-sm text-zinc-500 font-medium
                                  hover:border-white/[0.15] hover:text-zinc-300 transition-all cursor-default">
          {ch}
        </div>
      ))}
    </div>
  </motion.div>
</section>
```

---

## 3. FEATURES — Bento Grid asymétrique (RÉÉCRITURE TOTALE)

### Layout exact

```
Rangée 1 : [Grande card 2 colonnes] + [Card normale]
Rangée 2 : [Card normale] + [Card normale] + [Card normale]
```

### 5 features avec leurs accents de couleur

1. **Inbox unifiée** (grande, 2 cols) — toutes vos sources dans une vue — accent `emerald-500`
   - Contient une mini-animation CSS : des messages qui "arrivent" depuis différents canaux
   
2. **IA contextuelle** — répond avec Shopify + historique — accent `violet-500` (#a78bfa)

3. **Auto-envoi 30s** — déclenché automatiquement — accent `amber-500` (#fbbf24)

4. **Escalade intelligente** — passe la main si besoin — accent `rose-500` (#fb7185)

5. **Analytics temps réel** — CSAT, volume, temps réponse — accent `sky-500` (#38bdf8)

### Chaque card a :
- `bg-[#0c0c10]/80 border border-white/[0.07] rounded-2xl p-6`
- Au hover : `border-[accent-color]/30 shadow-[0_0_30px_accent-color/10] -translate-y-1`
- Icône avec fond `bg-[accent-color]/10 border border-[accent-color]/20`
- Titre `text-zinc-100 font-bold text-lg`
- Description `text-zinc-500 text-sm leading-relaxed mt-2`

### Structure JSX

```tsx
<section id="features" className="scroll-mt-20 bg-[#09090b] py-32 border-t border-white/[0.06]">
  <div className="mx-auto max-w-7xl px-6">
    
    {/* Header */}
    <div className="text-center mb-16">
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-500 font-bold">Fonctionnalités</span>
      <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-[-0.03em] text-white">
        Tout ce dont votre<br />
        <span className="text-zinc-600">SAV a besoin.</span>
      </h2>
    </div>

    {/* Bento Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      {/* Grande card — 2 colonnes */}
      <div className="md:col-span-2 group relative rounded-2xl border border-white/[0.07]
                      bg-[#0c0c10]/80 p-8 overflow-hidden transition-all duration-300
                      hover:border-emerald-500/25 hover:shadow-[0_0_40px_rgba(16,185,129,0.08)]
                      hover:-translate-y-1">
        {/* Glow en arrière plan au hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.05] to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="relative z-10">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                           flex items-center justify-center mb-5">
            <Inbox className="h-5 w-5 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100">Inbox unifiée</h3>
          <p className="mt-2 text-zinc-500 text-[15px] leading-relaxed">
            Gmail, Shopify, Instagram et Messenger dans une seule vue. Plus jamais un message manqué.
          </p>
          {/* Mini visual des channels */}
          <div className="mt-6 flex flex-wrap gap-2">
            {['Gmail', 'Shopify', 'Instagram', 'Messenger'].map((ch, i) => (
              <motion.span
                key={ch}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-[11px] font-mono font-bold px-3 py-1 rounded-full border
                           bg-white/[0.04] border-white/[0.1] text-zinc-400"
              >
                {ch}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* Card normale — IA contextuelle — violet */}
      <FeatureCard
        icon={Brain}
        title="IA contextuelle"
        description="L'IA lit le profil Shopify du client avant de répondre. Commandes, retours, historique — tout est injecté."
        accentClass="text-violet-400 bg-violet-500/10 border-violet-500/20"
        hoverGlow="hover:border-violet-500/25 hover:shadow-[0_0_40px_rgba(167,139,250,0.07)]"
      />

      {/* Card normale — Auto-envoi — amber */}
      <FeatureCard
        icon={Zap}
        title="Réponse en 30 secondes"
        description="Dès qu'un client écrit, l'IA analyse et envoie automatiquement. Zéro intervention pour les cas simples."
        accentClass="text-amber-400 bg-amber-500/10 border-amber-500/20"
        hoverGlow="hover:border-amber-500/25 hover:shadow-[0_0_40px_rgba(251,191,36,0.07)]"
      />

      {/* Card normale — Escalade — rose */}
      <FeatureCard
        icon={AlertTriangle}
        title="Escalade intelligente"
        description="Cas complexe ? L'IA le détecte et vous alerte immédiatement. Vous gardez le contrôle."
        accentClass="text-rose-400 bg-rose-500/10 border-rose-500/20"
        hoverGlow="hover:border-rose-500/25 hover:shadow-[0_0_40px_rgba(251,113,133,0.07)]"
      />

      {/* Card normale — Analytics — sky */}
      <FeatureCard
        icon={BarChart3}
        title="Analytics temps réel"
        description="CSAT, temps de réponse moyen, volume par canal. Tout en live, sans configuration."
        accentClass="text-sky-400 bg-sky-500/10 border-sky-500/20"
        hoverGlow="hover:border-sky-500/25 hover:shadow-[0_0_40px_rgba(56,189,248,0.07)]"
      />
    </div>
  </div>
</section>
```

**Créer le composant helper `FeatureCard`** dans le même fichier :
```tsx
function FeatureCard({ icon: Icon, title, description, accentClass, hoverGlow }: {...}) {
  return (
    <div className={`group relative rounded-2xl border border-white/[0.07] bg-[#0c0c10]/80
                     p-7 overflow-hidden transition-all duration-300 hover:-translate-y-1 ${hoverGlow}`}>
      <div className={`h-10 w-10 rounded-xl border flex items-center justify-center mb-5 ${accentClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-bold text-zinc-100">{title}</h3>
      <p className="mt-2 text-[14px] text-zinc-500 leading-relaxed">{description}</p>
    </div>
  )
}
```

---

## 4. USE-CASES — CONSERVER + AMÉLIORER LE MARQUEE

⚠️ **NE PAS SUPPRIMER CE COMPOSANT**. Conserver le marquee existant avec ses items et leur `WordRotate`.

### Changements à apporter sur `use-cases.tsx`
- Ajouter `id="use-cases"` et `scroll-mt-20` sur la `<section>` (déjà fait normalement)
- Changer le titre : rendre le `<WordRotate>` plus grand et le H2 plus impactant
- Améliorer les cards du marquee : la border au hover devient emerald avec un léger glow
- Ajouter une 3ème rangée de marquee avec 5 nouveaux items (couleur subtile différente)
- Conserver `<Marquee>` et `<WordRotate>` exactement — juste améliorer les styles

### Nouveaux items pour la 3ème rangée

```tsx
const useCasesThird = [
  { icon: CheckCircle2, label: 'Confirmer les paiements' },
  { icon: Package, label: 'Gérer les livraisons' },
  { icon: Heart, label: 'Fidéliser les clients' },
  { icon: Globe, label: 'Support multilingue' },
  { icon: Clock, label: 'Répondre 24h/24' },
]
```

---

## 5. HOW IT WORKS — Timeline verticale avec connecteur SVG animé

### Ce qui change par rapport à l'actuel
- Actuel : timeline fonctionnelle mais duplique la sidebar gauche
- Nouveau : ajouter un **connecteur SVG animé** entre les steps (une ligne qui se "dessine" au scroll)
- Chaque step card doit avoir une **micro-animation d'entrée alternée** (gauche pour 1 et 3, droite pour 2)

### Ajout du SVG animé
Devant la liste des steps, ajouter une ligne SVG verticale qui se remplit au scroll :

```tsx
{/* Animated SVG line */}
<svg className="absolute left-5 top-10 h-[calc(100%-80px)] w-px" aria-hidden="true">
  <motion.line
    x1="0.5" y1="0" x2="0.5" y2="100%"
    stroke="url(#lineGradient)"
    strokeWidth="1"
    strokeDasharray="4 4"
    pathLength={1}
    initial={{ pathLength: 0, opacity: 0 }}
    animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
    transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.2 }}
  />
  <defs>
    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#38bdf8" />
      <stop offset="50%" stopColor="#10b981" />
      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
    </linearGradient>
  </defs>
</svg>
```

---

## 6. TESTIMONIALS — CSS Grid (PAS columns)

### Problème actuel
`columns-1 md:columns-2 lg:columns-3` cause un désalignement visuel. **Remplacer par une CSS Grid explicite**.

### Structure CSS Grid correcte

```tsx
{/* 3 colonnes, les cards s'alignent en haut */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
  {testimonials.map((t, i) => (
    <motion.div
      key={t.author}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: 0.25 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col rounded-2xl border border-white/[0.07]
                 bg-[#0c0c10]/80 p-6 transition-all duration-300
                 hover:-translate-y-1 hover:border-white/[0.12] hover:shadow-xl"
    >
      {/* Quote mark décoratif */}
      <span className="absolute top-4 right-5 font-serif text-6xl text-zinc-800/50
                       leading-none pointer-events-none select-none">&rdquo;</span>

      {/* Texte du témoignage */}
      <p className="relative z-10 text-[14px] leading-relaxed text-zinc-300 flex-1 mb-5">
        &ldquo;{t.text}&rdquo;
      </p>

      {/* Auteur — aligné en bas */}
      <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
        <div className="h-9 w-9 shrink-0 rounded-full bg-white/[0.06] border border-white/[0.09]
                        flex items-center justify-center text-xs font-bold text-zinc-400
                        group-hover:bg-emerald-500/10 group-hover:text-emerald-300
                        group-hover:border-emerald-500/20 transition-all">
          {t.initials}
        </div>
        <div>
          <p className="text-sm font-bold text-white">{t.author}</p>
          <p className="text-xs text-zinc-600 mt-0.5">{t.role}</p>
        </div>
      </div>
    </motion.div>
  ))}
</div>
```

**Important** : supprimer la propriété `size` des données testimonials (elle ne sert plus maintenant qu'on utilise une grid uniforme).

---

## 7. FAQ — Accordion épuré

### Ce qui change
- Supprimer les cards avec fond — remplacer par des séparateurs simples `border-b border-white/[0.07]`
- L'icône `+` tourne à 45° quand l'accordéon est ouvert
- Animation `AnimatePresence` pour la hauteur

### Structure exacte

```tsx
{faqs.map((faq, i) => (
  <div key={i} className="border-b border-white/[0.07] last:border-0">
    <button
      onClick={() => setOpen(open === i ? null : i)}
      className="flex w-full items-center justify-between py-5 text-left gap-4"
      aria-expanded={open === i}
    >
      <span className="text-[15px] font-semibold text-zinc-200 pr-4">{faq.question}</span>
      <motion.span
        animate={{ rotate: open === i ? 45 : 0 }}
        transition={{ duration: 0.2 }}
        className="shrink-0 h-5 w-5 rounded-full border border-white/[0.15] text-zinc-500
                   flex items-center justify-center text-[11px]"
      >
        +
      </motion.span>
    </button>
    <AnimatePresence>
      {open === i && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <p className="pb-5 text-[14px] text-zinc-500 leading-relaxed">{faq.answer}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
))}
```

---

## 8. FOOTER — Mises à jour

Dans `footer.tsx` :
1. Changer `href="/login"` du CTA "Démarrer l'essai" → `href="/signup"`
2. S'assurer que les liens légaux pointent vers les vraies routes :
   ```tsx
   Legal: [
     { label: 'CGU', href: '/cgu' },
     { label: 'Confidentialité', href: '/confidentialite' },
     { label: 'Mentions légales', href: '/mentions-legales' },
   ],
   ```

---

## Vérifications obligatoires après implémentation

1. **TypeScript** : `npx tsc --noEmit` → 0 erreur
2. **ESLint** : `npx eslint src/components/landing/` → 0 erreur
3. **Build** : `npm run build` → doit passer
4. **Visual checks** (ouvrir http://localhost:3000) :
   - La Dynamic Island est centrée et flotte bien
   - Elle rétrécit quand on scroll vers le bas
   - Le Hero est centré avec le mockup en dessous
   - Les cards Features ont des couleurs d'accents différentes
   - La section Use-Cases existe encore avec les marquees animées
   - Les testimonials sont en CSS Grid — horizontalement alignés
   - Le FAQ utilise l'accordion sans cards

5. **Mobile** (320px et 375px) :
   - La navbar mobile s'affiche (hamburger, pas la Dynamic Island)
   - Le Hero H1 ne déborde pas
   - Les bento cards passent en colonne unique

---

## RÉCAPITULATIF DES CHANGEMENTS OBLIGATOIRES

| Section | Action | Différence clé vs avant |
|---------|--------|------------------------|
| Navbar | Réécriture complète | Dynamic Island flottante au lieu de full-width fixe |
| Hero | Réécriture complète | Layout centré + mockup pleine largeur + perspective 3D |
| Features | Réécriture complète | Bento Grid 2×3 avec couleurs d'accents distincts |
| Use-Cases | Amélioration (GARDER MARQUEE) | Ajouter une 3ème rangée, améliorer styles |
| How It Works | Amélioration | SVG line animation au scroll |
| Testimonials | Réécriture | CSS GRID au lieu de CSS COLUMNS |
| Pricing | Déjà bon | Vérifier l'alignement des cards |
| FAQ | Réécriture | Accordion sans cards, icône +/× |
| Footer | Mise à jour | Liens vers /signup et pages légales |
