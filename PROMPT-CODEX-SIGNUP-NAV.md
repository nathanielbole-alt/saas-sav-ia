# PROMPT CODEX — Inscription fonctionnelle + Navigation Landing Page

## Contexte

Stack : Next.js 16 (App Router, Turbopack), Supabase Auth (email/password), TypeScript, Tailwind CSS, Framer Motion.
Le projet est un SaaS B2B de SAV automatisé par IA. La landing page utilise un thème dark (`bg-[#09090b]`) avec des accents emerald/teal.

---

## Problème 1 — L'inscription ne fonctionne pas

### État actuel
- Il n'y a **aucune page `/signup` dédiée**. L'inscription est un simple bouton "S'inscrire" à côté de "Se connecter" sur `/login` (`src/app/login/login-form.tsx`).
- La fonction `handleSignUp` appelle `supabase.auth.signUp()` mais **l'utilisateur ne reçoit aucun retour visuel clair**, et si la confirmation email est activée côté Supabase, il n'y a pas de flow UX pour guider l'utilisateur.
- Le callback auth est dans `src/app/api/auth/callback/route.ts` — il fait `exchangeCodeForSession` puis redirige vers `/dashboard`.
- Après inscription, l'utilisateur est supposé atterrir sur `/dashboard/onboarding`.

### Ce qu'il faut faire

1. **Créer une vraie page d'inscription `/signup`** (`src/app/signup/page.tsx` + `src/app/signup/signup-form.tsx`) :
   - Design premium cohérent avec le thème dark de la landing (`bg-[#09090b]`, accents emerald, typographie moderne)
   - Champs : Nom complet, Email, Mot de passe, Confirmation du mot de passe
   - Validation côté client (email valide, mot de passe ≥ 8 caractères, correspondance des mots de passe)
   - Feedback visuel : loading state, messages d'erreur clairs en français, message de succès
   - Bouton "Se connecter" en lien vers `/login`
   - L'inscription utilise `supabase.auth.signUp()` avec `emailRedirectTo` pointant vers `/api/auth/callback`
   - Si la confirmation email est désactivée sur Supabase, rediriger directement vers `/dashboard/onboarding` après signup
   - Si la confirmation email est activée, afficher un bel écran "Vérifiez votre boîte mail" avec icône et instructions

2. **Mettre à jour le bouton "Essai gratuit" et "S'inscrire"** partout dans l'app pour pointer vers `/signup` au lieu de `/login` :
   - `src/components/landing/navbar.tsx` : le CTA "Essai gratuit" (desktop et mobile) → `href="/signup"`
   - `src/components/landing/hero.tsx` : le CTA principal → `href="/signup"`
   - `src/components/landing/pricing.tsx` : les boutons "Démarrer" des cartes pricing → `href="/signup"`
   - `src/app/login/login-form.tsx` : remplacer le bouton "S'inscrire" par un lien vers `/signup`

3. **Adapter la page `/login`** :
   - Retirer le bouton "S'inscrire" inline
   - Ajouter un lien texte en bas : "Pas encore de compte ? Créer un compte" → `/signup`
   - Garder uniquement le flow de connexion

4. **S'assurer que le callback auth gère bien le signup** :
   - Vérifier que `src/app/api/auth/callback/route.ts` redirige vers `/dashboard/onboarding` pour les nouveaux utilisateurs (vérifier si le profil existe dans la table `profiles`)

---

## Problème 2 — Les liens de navigation "Cas d'usage" et "FAQ" ne fonctionnent pas

### État actuel
- La navbar (`src/components/landing/navbar.tsx`) définit les liens suivants :
  ```ts
  const navLinks = [
    { label: 'Fonctionnalités', href: '#features' },     // ✅ Fonctionne — id="features" présent dans features.tsx
    { label: 'Cas d\'usage', href: '#use-cases' },        // ❌ Cassé
    { label: 'Tarifs', href: '#pricing' },                 // ✅ Fonctionne — id="pricing" présent dans pricing.tsx
    { label: 'FAQ', href: '#faq' },                        // ❌ Cassé
  ]
  ```
- **`src/components/landing/use-cases.tsx`** : la `<section>` n'a **pas d'attribut `id="use-cases"`**
- **`src/components/landing/faq.tsx`** : la `<section>` n'a **pas d'attribut `id="faq"`**

### Ce qu'il faut faire

1. **`src/components/landing/use-cases.tsx`** — Ajouter `id="use-cases"` sur la balise `<section>` (ligne 36) :
   ```tsx
   // Avant :
   <section className="overflow-hidden border-t border-white/5 bg-[#09090b] py-28 relative">
   // Après :
   <section id="use-cases" className="overflow-hidden border-t border-white/5 bg-[#09090b] py-28 relative">
   ```

2. **`src/components/landing/faq.tsx`** — Ajouter `id="faq"` sur la balise `<section>` (ligne 36) :
   ```tsx
   // Avant :
   <section className="border-t border-white/5 bg-[#09090b] py-32 relative" ref={ref}>
   // Après :
   <section id="faq" className="border-t border-white/5 bg-[#09090b] py-32 relative" ref={ref}>
   ```

3. **(Bonus)** Ajouter un `scroll-margin-top: 80px` (ou `scroll-mt-20` en Tailwind) sur toutes les sections pour compenser la navbar fixe lors du scroll vers les ancres.

---

## Vérification attendue

1. Naviguer sur `http://localhost:3000` → cliquer sur "Cas d'usage" dans la navbar → la page doit scroller vers la section correspondante
2. Cliquer sur "FAQ" dans la navbar → la page doit scroller vers la section FAQ
3. Cliquer sur "Essai gratuit" → doit mener vers `/signup`
4. Sur `/signup`, remplir le formulaire et soumettre → l'inscription doit fonctionner (soit redirect vers dashboard, soit écran de confirmation email)
5. Sur `/login`, vérifier que le lien "Créer un compte" redirige bien vers `/signup`
6. Tester sur mobile (menu hamburger) : les liens de navigation et les CTAs doivent aussi fonctionner

---

## Fichiers à modifier/créer

| Action | Fichier |
|--------|---------|
| **CRÉER** | `src/app/signup/page.tsx` |
| **CRÉER** | `src/app/signup/signup-form.tsx` |
| **MODIFIER** | `src/components/landing/navbar.tsx` |
| **MODIFIER** | `src/components/landing/hero.tsx` |
| **MODIFIER** | `src/components/landing/pricing.tsx` |
| **MODIFIER** | `src/components/landing/use-cases.tsx` |
| **MODIFIER** | `src/components/landing/faq.tsx` |
| **MODIFIER** | `src/app/login/login-form.tsx` |
| **MODIFIER** | `src/app/login/page.tsx` |
| **VÉRIFIER** | `src/app/api/auth/callback/route.ts` |

## Contraintes de design pour la page `/signup`

- Même esthétique que la landing page : fond `bg-[#09090b]`, texte `text-zinc-50`, accents `emerald-500`
- Bordures subtiles `border-white/5` ou `border-white/10`
- Bouton principal : `bg-emerald-500 text-[#09090b] font-bold rounded-xl` avec hover glow `shadow-[0_0_20px_rgba(16,185,129,0.3)]`
- Inputs : fond sombre, bordures subtiles, focus emerald
- Responsive : doit être parfait sur mobile
- Animation d'entrée avec Framer Motion (fade in + slide up)
- Logo "SAV IA" en haut de la page d'inscription avec lien vers `/`
