# Prompt Codex — Corrections de bugs & migration Next.js 16

## Contexte

Application SaaS de SAV automatisé par IA. Stack : **Next.js 16.1.6**, TypeScript strict, Tailwind CSS, Supabase (auth + DB), Stripe (billing), Framer Motion.

> **Important** : lire `CLAUDE.md` à la racine du projet pour le contexte complet (architecture, conventions, changelog).

## ⚠️ Contrainte critique : PAS de `npm run dev`

Le cache Turbopack est corrompu sur cette machine macOS. **NE PAS utiliser `npm run dev`**. À la place :

```bash
rm -rf .next && npm run build && npm start
```

---

## Tâche 1 — Migrer le middleware vers le nouveau format "proxy" (Next.js 16)

**Problème** : Next.js 16 affiche un warning à chaque build :

```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```

**Fichier concerné** : `src/middleware.ts`

**Action** :
1. Lire la documentation Next.js 16 sur la migration middleware → proxy : https://nextjs.org/docs/messages/middleware-to-proxy
2. Migrer `src/middleware.ts` vers le nouveau format `proxy` tout en conservant exactement la même logique (appel à `updateSession` de Supabase + matcher sur `/dashboard/:path*`, `/login`, `/signup`)
3. Si la migration nécessite un changement dans `src/lib/supabase/middleware.ts`, l'adapter également
4. Vérifier que le build passe sans le warning

---

## Tâche 2 — VideoModal : remplacer le placeholder par une vraie modale

**Problème** : Le composant `VideoModal` dans `src/components/landing/hero.tsx` (lignes ~68-74) est un placeholder vide qui ne fait rien quand on clique "Voir la démo".

**Action** :
1. Implémenter une vraie modale vidéo avec :
   - Overlay sombre semi-transparent avec `backdrop-blur`
   - Conteneur centré avec ratio 16:9
   - Fermeture au clic sur l'overlay ou avec la touche Escape
   - Animation d'entrée/sortie avec Framer Motion (`AnimatePresence`)
   - Un `<iframe>` YouTube ou un `<video>` HTML5 (utiliser un placeholder URL pour l'instant, ex: `https://www.youtube.com/embed/dQw4w9WgXcQ`)
2. Respecter le design system : fond `#0B0B0F`, bordures `border-white/[0.06]`, coins arrondis `rounded-xl`

---

## Tâche 3 — Robustesse des intégrations OAuth

**Fichiers concernés** :
- `src/app/api/integrations/gmail/callback/route.ts`
- `src/app/api/integrations/shopify/callback/route.ts`
- `src/app/api/integrations/meta/callback/route.ts`

**Action** :
1. Vérifier que chaque callback OAuth gère correctement les cas d'erreur :
   - Token expiré ou invalide → redirection propre vers `/dashboard/settings?{provider}=error`
   - State mismatch (CSRF) → rejet avec message clair
   - API provider down → timeout + message utilisateur
2. Ajouter des blocs `try/catch` si manquants autour des appels `fetch` vers les APIs tierces
3. S'assurer qu'aucun callback ne peut crasher silencieusement (toujours retourner une `Response` ou une redirection)

---

## Tâche 4 — Accessibilité minimale de la landing page

**Fichiers concernés** : tous les composants dans `src/components/landing/`

**Action** :
1. Vérifier que tous les boutons et liens interactifs ont un `aria-label` quand le texte n'est pas explicite
2. Ajouter `role="region"` et `aria-labelledby` sur les sections principales
3. S'assurer que l'accordion FAQ (`faq.tsx`) utilise les bons attributs ARIA :
   - `aria-expanded` sur les boutons
   - `role="region"` sur les panneaux de réponse
   - `aria-controls` / `id` pour lier bouton et panneau
4. Vérifier les contrastes texte : `#555` sur `#0B0B0F` est très faible — proposer une alternative comme `#777` pour les labels secondaires si c'est trop bas

---

## Tâche 5 — Nettoyage et hardening général

**Action** :
1. Vérifier que `npx tsc --noEmit` passe sans erreur (il passe déjà, le maintenir)
2. Vérifier que `npm run build` passe sans erreur ni warning (hors Turbopack)
3. S'assurer que les pages légales (`/cgu`, `/confidentialite`, `/mentions-legales`, `/cookies`) ont bien des balises `<title>` et `<meta description>` uniques
4. Vérifier que le sitemap (`/sitemap.xml`) inclut toutes les pages publiques

---

## Vérification finale

```bash
rm -rf .next && npm run build
```

Le build doit passer **sans erreur** et **sans le warning middleware deprecated**. Confirmer dans un commentaire de PR les résultats du build.
