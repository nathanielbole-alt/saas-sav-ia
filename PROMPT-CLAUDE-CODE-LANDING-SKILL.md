# PROMPT CLAUDE CODE — Refonte landing page avec le skill "UI UX pro max"

## PREMIÈRE INSTRUCTION — OBLIGATOIRE

**Active et utilise le skill "UI UX pro max" maintenant, avant d'écrire la moindre ligne de code.** Lis ses instructions en entier et applique-les tout au long de cette tâche.

---

## Mission

Refaire entièrement la landing page de **Savly** — un SaaS B2B IA de gestion du support client (SAV). La page actuelle ressemble trop à du contenu généré par IA : palette trop commune, copy générique, layout standard. Elle doit être refaite de zéro avec une vraie identité visuelle, un vrai fil narratif, et une qualité premium.

---

## AVANT DE COMMENCER — Pose-moi toutes les questions

**Ne commence PAS à coder immédiatement. Pose-moi d'abord toutes les questions dont tu as besoin pour faire un travail parfait**, notamment :

- Direction artistique souhaitée (exemples de sites que j'aime ?)
- Palette de couleurs à conserver ou à changer complètement ?
- Ton éditorial (sérieux/corporatif vs direct/startup vs chaleureux ?)
- Sections à garder absolument / à supprimer ?
- Le mockup du dashboard doit-il être redessiné ?
- Référence de landing pages que j'admire ?
- Des contraintes techniques spécifiques ?

---

## Contexte technique

- Stack : Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Framer Motion 11
- Composants landing : `src/components/landing/`
  - `navbar.tsx` — Dynamic Island flottante
  - `hero.tsx` — Section hero
  - `features.tsx` — Bento grid fonctionnalités
  - `use-cases.tsx` — Marquees animés (à conserver)
  - `how-it-works.tsx` — Timeline 3 étapes
  - `testimonials.tsx` — Scénarios illustratifs (pas de faux avis)
  - `pricing.tsx` — 3 plans tarifaires
  - `faq.tsx` — Accordion
  - `footer.tsx` — Pied de page

## Règles non négociables

1. **Pas de faux témoignages** — La section testimonials utilise des "scénarios illustratifs" (exemples du produit), pas de faux noms/avis clients (illégal en France, art. L121-4 Code de la consommation)
2. **Section use-cases** — Conserver le marquee animé (2 rangées max)
3. **CSS Grid** pour les testimonials/scénarios — pas de `columns-*` CSS
4. **Pas de e-commerce dans le hero** — Savly vise tout type d'entreprise, pas seulement l'e-commerce
5. **0 erreur TypeScript** — `npx tsc --noEmit` doit passer

## Produit — Ce que fait Savly

Savly est un SaaS qui :
- Centralise tous les canaux support (Gmail, Shopify, Instagram, Messenger, Google Reviews)
- Génère des réponses IA en < 30 secondes avec le contexte complet (historique Shopify, etc.)
- Permet à l'équipe de valider ou laisser l'IA envoyer automatiquement
- Détecte les cas complexes et escalade vers un humain
- Fournit des analytics en temps réel (CSAT, temps de réponse, taux de résolution)

Plans : Pro (29€), Business (79€), Enterprise (149€) — 7 jours d'essai gratuit

## Après avoir reçu mes réponses

Fournis un **plan de redesign validé** avant de toucher au code, avec :
- Palette choisie
- Layout de chaque section
- Copywriting proposé pour les titres et sous-titres
- Liste des animations prévues

Attends ma validation du plan avant de commencer à coder.
