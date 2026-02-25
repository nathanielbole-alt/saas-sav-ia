# PROMPT CLAUDE CODE — Corriger l'alignement Features + Comment ça marche

## Problème 1 — `src/components/landing/features.tsx`

### Ce qui cloche actuellement
- La grande card "Une inbox qui voit tout" (col-span-2) prend toute la largeur mais semble vide
- La liste des 4 features en dessous (`md:col-span-3`) est dans une grille séparée → les cases ne s'alignent pas

### Solution : remplacer tout le Bento par une grille uniforme 3 colonnes

**Supprimer** toute la structure actuelle (grande card + liste en dessous) et la remplacer par une **grille homogène 3 colonnes** où chaque card a la même hauteur visuelle et le même format.

**Nouveau layout pour le JSX des cards (à partir de la ligne `{/* Bento Grid */}`)** :

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

  {/* Card 1 — Inbox unifiée — pleine largeur en mobile, normale en desktop */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={isInView ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.55, delay: 0.1 }}
    className="group sm:col-span-2 lg:col-span-1 relative rounded-2xl border border-indigo-500/[0.1]
               bg-[#13131a] p-7 hover:border-indigo-500/[0.22] hover:-translate-y-1
               transition-all duration-300"
  >
    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20
                    flex items-center justify-center mb-5">
      <Mail className="h-5 w-5 text-indigo-400" />
    </div>
    <h3 className="text-[16px] font-bold text-[#f0f0ff]">Une inbox qui voit tout</h3>
    <p className="mt-2 text-[13px] text-[#8b8ba8] leading-relaxed">
      Gmail, Shopify, Instagram, Messenger — tout arrive au même endroit, trié par urgence.
    </p>
    {/* Chips channels */}
    <div className="mt-5 flex flex-wrap gap-2">
      {['Gmail', 'Shopify', 'Instagram', 'Messenger', 'Google Reviews'].map(ch => (
        <span key={ch} className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full
                                   border bg-indigo-500/[0.04] border-indigo-500/[0.12] text-[#8b8ba8]">
          {ch}
        </span>
      ))}
    </div>
  </motion.div>

  {/* Card 2 — Elle connaît vos clients — cyan */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={isInView ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.55, delay: 0.17 }}
    className="group relative rounded-2xl border border-cyan-500/[0.1] bg-[#13131a] p-7
               hover:border-cyan-500/[0.25] hover:-translate-y-1 transition-all duration-300"
  >
    <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20
                    flex items-center justify-center mb-5">
      <Brain className="h-5 w-5 text-cyan-400" />
    </div>
    <h3 className="text-[16px] font-bold text-[#f0f0ff]">Elle connaît vos clients</h3>
    <p className="mt-2 text-[13px] text-[#8b8ba8] leading-relaxed">
      L'IA lit le profil Shopify avant de répondre — commandes, retours, historique. Pas une réponse générique.
    </p>
  </motion.div>

  {/* Card 3 — Elle envoie, vous supervisez — violet */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={isInView ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.55, delay: 0.22 }}
    className="group relative rounded-2xl border border-violet-500/[0.1] bg-[#13131a] p-7
               hover:border-violet-500/[0.25] hover:-translate-y-1 transition-all duration-300"
  >
    <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20
                    flex items-center justify-center mb-5">
      <Zap className="h-5 w-5 text-violet-400" />
    </div>
    <h3 className="text-[16px] font-bold text-[#f0f0ff]">Elle envoie, vous supervisez</h3>
    <p className="mt-2 text-[13px] text-[#8b8ba8] leading-relaxed">
      Dès qu'un client écrit, l'IA répond en 30 secondes. Vous validez ou laissez faire selon le cas.
    </p>
  </motion.div>

  {/* Card 4 — Elle sait quand s'arrêter — rose */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={isInView ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.55, delay: 0.27 }}
    className="group relative rounded-2xl border border-rose-500/[0.1] bg-[#13131a] p-7
               hover:border-rose-500/[0.25] hover:-translate-y-1 transition-all duration-300"
  >
    <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20
                    flex items-center justify-center mb-5">
      <AlertTriangle className="h-5 w-5 text-rose-400" />
    </div>
    <h3 className="text-[16px] font-bold text-[#f0f0ff]">Elle sait quand s'arrêter</h3>
    <p className="mt-2 text-[13px] text-[#8b8ba8] leading-relaxed">
      Cas complexe ou client VIP ? L'IA détecte, stoppe l'auto-envoi et vous alerte avec tout le contexte.
    </p>
  </motion.div>

  {/* Card 5 — Vous mesurez tout — amber */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={isInView ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.55, delay: 0.32 }}
    className="group relative rounded-2xl border border-amber-500/[0.1] bg-[#13131a] p-7
               hover:border-amber-500/[0.25] hover:-translate-y-1 transition-all duration-300"
  >
    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20
                    flex items-center justify-center mb-5">
      <BarChart3 className="h-5 w-5 text-amber-400" />
    </div>
    <h3 className="text-[16px] font-bold text-[#f0f0ff]">Vous mesurez tout</h3>
    <p className="mt-2 text-[13px] text-[#8b8ba8] leading-relaxed">
      CSAT, temps de réponse, volume par canal — en live, sans dashboard supplémentaire.
    </p>
  </motion.div>

</div>
```

**Supprimer** le composant `FeatureCard` et l'interface `FeatureCardProps` — ils ne servent plus.
**Garder** tous les imports existants nécessaires (`Brain`, `Zap`, `AlertTriangle`, `BarChart3`, `Mail`).

---

## Problème 2 — `src/components/landing/how-it-works.tsx`

### Ce qui cloche actuellement
- Layout `lg:grid-cols-[1fr_400px]` (2 colonnes) — la colonne droite est `sticky` ce qui crée un grand vide sous les steps quand on scrolle
- La colonne droite (mockup + proof points + CTA) flotte seule et crée des espaces vides énormes

### Solution : passer en layout vertical (1 colonne centrée)

**Supprimer** le grid 2 colonnes (`grid lg:grid-cols-[1fr_400px] gap-16`) et **déplacer** le contenu de la colonne droite **sous les steps** en pleine largeur.

**Nouveau layout** :

```tsx
<div className="mx-auto max-w-3xl">

  {/* Steps — colonne unique centrée */}
  <div className="relative pl-12">
    {/* SVG line — garder tel quel */}
    ...

    {/* Steps — garder tel quel */}
    ...
  </div>

  {/* Mockup ticket flow — SOUS les steps, pleine largeur max-w-lg mx-auto */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={isInView ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.6, delay: 0.5 }}
    className="mt-16 max-w-lg mx-auto"
  >
    {/* Garder exactement le même JSX du mockup ticket */}
    ...

    {/* Proof points — en ligne au lieu de colonne */}
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {proofPoints.map((point, i) => (
        <motion.div
          key={point}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.7 + i * 0.08 }}
          className="flex items-center gap-2 text-sm text-[#8b8ba8]"
        >
          <div className="h-4 w-4 rounded-full bg-indigo-500/10 border border-indigo-500/20
                          flex items-center justify-center shrink-0">
            <Check className="h-2.5 w-2.5 text-indigo-400" strokeWidth={3} />
          </div>
          {point}
        </motion.div>
      ))}
    </div>

    {/* CTA */}
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.9, duration: 0.5 }}
      className="mt-8"
    >
      <Link href="/signup"
            className="group w-full inline-flex items-center justify-center gap-2
                       bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-2xl
                       transition-all hover:bg-indigo-400
                       hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 text-sm">
        Commencer maintenant
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  </motion.div>

</div>
```

**Points clés** :
- Retirer `lg:sticky lg:top-28` sur la colonne droite
- Changer `max-w-6xl` → `max-w-3xl` sur le conteneur principal
- Les steps gardent exactement leur style actuel, seul le conteneur change

---

## Vérifications

1. `npm run build` → 0 erreur TypeScript
2. Sur `http://localhost:3000` :
   - **Features** : 5 cards alignées en grille uniforme, même hauteur visuelle, pas d'espace vide
   - **Comment ça marche** : 3 steps en colonne, mockup centré en dessous sans espace vide
   - Les 2 sections sont responsive (1 colonne sur mobile, grille sur desktop)
