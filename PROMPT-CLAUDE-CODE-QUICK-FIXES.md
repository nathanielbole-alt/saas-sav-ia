# PROMPT CLAUDE CODE — 4 corrections ciblées landing page

## Modifications à apporter — dans l'ordre

---

### FIX 1 — Supprimer la 3ème rangée de marquee dans use-cases.tsx

**Fichier** : `src/components/landing/use-cases.tsx`

Supprimer :
1. Le tableau `const useCasesThird` (lignes ~37-43)
2. Le 3ème bloc `<Marquee>` dans le JSX (lignes ~112-122) — celui qui affiche `useCasesThird`
3. L'import de `ShoppingCart` s'il n'est plus utilisé ailleurs dans ce fichier

Ne pas toucher aux 2 premières rangées marquee.

---

### FIX 2 — Supprimer les 5 petites cards dispersées dans features.tsx

**Fichier** : `src/components/landing/features.tsx`

Le Bento Grid actuel a :
- 1 grande card (col-span-2) : "Une inbox qui voit tout" → **GARDER**
- 4 petites cards via `<FeatureCard>` : "Elle connaît vos clients", "Elle envoie, vous supervisez", "Elle sait quand s'arrêter", "Vous mesurez tout" → **SUPPRIMER les 4**

**Remplacer les 4 petites cards** par une seule liste de fonctionnalités propre et sobre, sous la grande card :

```tsx
{/* Liste de features — sous la grande card */}
<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
  {[
    { icon: Brain, title: 'Elle connaît vos clients', desc: "L'IA lit le profil Shopify avant de répondre. Commandes, retours, historique — tout est injecté.", color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { icon: Zap, title: 'Elle envoie, vous supervisez', desc: "Dès qu'un client écrit, l'IA analyse et répond en 30 secondes. Vous validez ou laissez faire.", color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    { icon: AlertTriangle, title: 'Elle sait quand s\'arrêter', desc: 'Cas complexe ? L\'IA stoppe l\'auto-envoi et vous alerte immédiatement avec tout le contexte.', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { icon: BarChart3, title: 'Vous mesurez tout', desc: 'CSAT, temps de réponse, volume par canal — en live, sans configuration supplémentaire.', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ].map((f, i) => (
    <motion.div
      key={f.title}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
      className="flex items-start gap-4 p-5 rounded-2xl border border-indigo-500/[0.08]
                 bg-[#13131a]/60 hover:border-indigo-500/[0.16] transition-all duration-200"
    >
      <div className={`mt-0.5 h-8 w-8 shrink-0 rounded-xl border flex items-center justify-center ${f.color}`}>
        <f.icon className="h-4 w-4" />
      </div>
      <div>
        <h3 className="text-[14px] font-bold text-[#f0f0ff]">{f.title}</h3>
        <p className="mt-1 text-[13px] text-[#8b8ba8] leading-relaxed">{f.desc}</p>
      </div>
    </motion.div>
  ))}
</div>
```

Supprimer aussi le composant `FeatureCard` et son interface `FeatureCardProps` (ils ne servent plus).

Le résultat final de la section Features doit être :
```
[Grande card — inbox — pleine largeur]
[Feature item]  [Feature item]
[Feature item]  [Feature item]
```

---

### FIX 3 — Changer le titre du Hero

**Fichier** : `src/components/landing/hero.tsx`

Chercher et remplacer exactement :

```
AVANT (lignes ~65-67) :
Le SAV e-commerce
qui répond à
votre place.
```

```
APRÈS :
L'IA qui gère
votre support client
à votre place.
```

En TSX, la ligne exacte à modifier est :
```tsx
// AVANT
<>Le SAV e-commerce<br/>qui répond à<br/>votre place.</>

// APRÈS — texte JSX à adapter selon la structure existante
// Garantir que le rendu produit exactement :
// L'IA qui gère
// votre support client
// à votre place.
```

---

### FIX 4 — Centrer le Hero (texte + éléments alignés au centre)

**Fichier** : `src/components/landing/hero.tsx`

Le layout actuel est en 2 colonnes (texte à gauche, mockup à droite). Tout le bloc textuel gauche doit passer en **centré** :

Sur le conteneur texte principal, ajouter/modifier :
- `text-center` (si pas déjà présent)
- Les `<p>`, le badge, les CTAs et les trust signals doivent avoir `mx-auto` et être centrés

Spécifiquement :
- Le badge pill : entourer d'un `<div className="flex justify-center">` ou mettre `mx-auto`
- Le `<h1>` : s'assurer que `text-center` est appliqué
- Le `<p>` subtitle : `mx-auto text-center`
- Les CTAs : `justify-center` sur le flex container
- Les trust signals (✓ Sans carte etc.) : `justify-center` sur le flex container
- Les stats : `mx-auto` sur la grid

**Note** : si le layout est en 2 colonnes grid (`lg:grid-cols-2`), retirer le grid et passer tout le contenu texte en colonne unique centrée. Le mockup reste en dessous.

---

## Vérifications

1. `npm run build` → 0 erreur TypeScript
2. Visuellement sur http://localhost:3000 :
   - Use-cases : 2 rangées marquee seulement (plus de 3ème rangée)
   - Features : grande card + 4 items en grille 2 colonnes (plus les 5 bulles éparpillées)
   - Hero : titre "L'IA qui gère votre support client à votre place."
   - Hero : tout le texte est centré horizontalement
