# PROMPT CODEX — Remplacer les faux avis clients par une section légale

## Contexte légal

Les témoignages actuels dans `src/components/landing/testimonials.tsx` sont fictifs (noms inventés, avis fabriqués). C'est illégal en France sous l'article L121-4 du Code de la consommation (pratique commerciale trompeuse). Il faut les remplacer.

## Solution — Transformer en section "Résultats & Cas d'usage"

Au lieu de faux avis clients, afficher :
1. **Les 4 stats clés** (déjà présentes, les garder)
2. **Des "Scénarios concrets"** — présentés explicitement comme des exemples illustratifs du produit, pas comme de vrais témoignages

## Fichier à modifier : `src/components/landing/testimonials.tsx`

### Changement 1 — Supprimer complètement le tableau `testimonials`

Supprimer les lignes de `const testimonials = [` jusqu'à `]` (les 6 faux avis).

### Changement 2 — Remplacer le titre de la section

```tsx
// AVANT
<h2>Des résultats mesurables,<br/>
  <span>dès la première semaine.</span>
</h2>

// APRÈS
<h2>Ce que ça change,<br/>
  <span>concrètement.</span>
</h2>
```

### Changement 3 — Remplacer la grille de témoignages par des "Scénarios"

Créer un nouveau tableau `scenarios` (ce ne sont PAS des avis clients, mais des exemples de ce que fait le produit) :

```typescript
const scenarios = [
  {
    icon: Truck,           // import depuis lucide-react
    situation: 'Shopify · Livraison',
    before: '"Où est ma commande #4821 ?" — arrivé à 14h23',
    after: 'Réponse IA envoyée à 14h23 avec lien de suivi Colissimo. Zéro intervention.',
    time: '28 sec',
  },
  {
    icon: RefreshCcw,
    situation: 'Gmail · Retour',
    before: 'Email entrant : "Je veux retourner mon article, trop grand."',
    after: "L'IA génère le bon de retour prépayé et l'étiquette PDF. Résolu sans agent.",
    time: '41 sec',
  },
  {
    icon: Star,
    situation: 'Google Reviews · Avis négatif',
    before: 'Avis 2 étoiles : "Livraison trop longue, j\'attends toujours."',
    after: "Réponse publique rédigée par l'IA avec les excuses et le numéro de suivi.",
    time: '15 sec',
  },
  {
    icon: MessageSquare,
    situation: 'Instagram DM · Question produit',
    before: '"Ce jean est disponible en 36 ?" — message reçu à 23h47',
    after: "L'IA vérifie le stock Shopify et répond avec la disponibilité et le lien produit.",
    time: '22 sec',
  },
  {
    icon: AlertTriangle,
    situation: 'Gmail · Escalade automatique',
    before: 'Email agressif : "Si vous ne remboursez pas, je fais un chargeback."',
    after: "L'IA détecte le risque et vous alerte immédiatement avec contexte complet.",
    time: 'Escalade immédiate',
  },
  {
    icon: CreditCard,
    situation: 'Shopify · Remboursement',
    before: '"J\'ai reçu un article cassé, je veux être remboursé."',
    after: "L'IA initie le remboursement Shopify et envoie la confirmation par email.",
    time: '33 sec',
  },
]
```

### Changement 4 — Nouveau JSX pour afficher les scénarios

Remplacer la grille de témoignages par :

```tsx
{/* Label légal discret au-dessus */}
<p className="text-center text-[11px] text-[#4a4a6a] font-mono uppercase tracking-widest mb-8">
  Exemples illustratifs — basés sur les capacités du produit
</p>

{/* Grille scénarios — CSS Grid strict */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
  {scenarios.map((s, i) => (
    <motion.div
      key={s.situation}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.2 + i * 0.07 }}
      className="rounded-2xl border border-indigo-500/[0.1] bg-[#13131a] p-6
                 hover:border-indigo-500/[0.22] hover:-translate-y-0.5
                 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20
                        flex items-center justify-center shrink-0">
          <s.icon className="h-4 w-4 text-indigo-400" />
        </div>
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#4a4a6a]">
          {s.situation}
        </span>
      </div>

      {/* Avant */}
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-widest font-mono text-[#4a4a6a] mb-1.5">Avant</p>
        <p className="text-[13px] text-[#8b8ba8] leading-relaxed italic">
          {s.before}
        </p>
      </div>

      {/* Séparateur avec flèche */}
      <div className="flex items-center gap-2 my-3">
        <div className="flex-1 h-px bg-indigo-500/[0.1]" />
        <span className="text-indigo-400 text-xs">↓</span>
        <div className="flex-1 h-px bg-indigo-500/[0.1]" />
      </div>

      {/* Après */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-widest font-mono text-indigo-400 mb-1.5">Après Savly</p>
        <p className="text-[13px] text-[#f0f0ff] leading-relaxed">
          {s.after}
        </p>
      </div>

      {/* Badge temps */}
      <div className="flex justify-end">
        <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300
                         text-[10px] font-mono font-bold px-2.5 py-1 rounded-full">
          ⏱ {s.time}
        </span>
      </div>
    </motion.div>
  ))}
</div>
```

### Imports à ajouter

```tsx
import { Truck, RefreshCcw, Star, MessageSquare, AlertTriangle, CreditCard } from 'lucide-react'
```

## Résultat attendu

- La section n'affiche plus de faux "témoignages clients" avec des noms inventés
- Elle montre des **cas d'usage concrets** du produit, clairement identifiés comme exemples
- Un label "Exemples illustratifs" en petit texte en haut protège légalement
- L'alignement est parfait (CSS Grid, pas CSS columns)
- Le style visuel reste cohérent avec le reste de la landing

## Vérification

1. `npm run build` → 0 erreur
2. Vérifier que les mots "Sophie M.", "Julie B.", "Alexis D.", "Thomas L.", "Marc P.", "Camille R." n'apparaissent plus dans le HTML rendu
3. Vérifier que le label "Exemples illustratifs" est visible au-dessus de la grille
