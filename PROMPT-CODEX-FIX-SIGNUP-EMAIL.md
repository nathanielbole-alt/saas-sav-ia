# PROMPT CODEX — Résoudre l'inscription qui ne fonctionne pas (pas de mail de confirmation)

## Contexte

Stack : Next.js 16 (App Router), Supabase Auth (email/password), TypeScript.
Le formulaire d'inscription `/signup` appelle `supabase.auth.signUp()` correctement (avec `emailRedirectTo` vers `/api/auth/callback?next=/dashboard/onboarding`). Le code est fonctionnel. **Le problème est que l'email de confirmation n'arrive jamais** (ni en inbox, ni en spam).

## Diagnostic

Le problème vient de la **configuration Supabase**, pas du code applicatif. Deux causes possibles :

### Cause A — Confirmation email activée + SMTP par défaut Supabase (InBucket)
Supabase utilise par défaut un mailer interne très limité (InBucket en dev, rate-limited en prod). Les emails de confirmation sont souvent :
- Bloqués par les FAI (pas de SPF/DKIM)
- Rate-limité (3 emails/heure max sur le plan gratuit)
- Totalement non envoyés en local

### Cause B — Confirmation email activée mais inutile pour le moment
En phase de développement/MVP, la confirmation email est un frein inutile. Il vaut mieux la **désactiver** pour que l'inscription soit instantanée.

---

## Solution recommandée : Désactiver la confirmation email (dev/MVP)

### Étape 1 — Côté Supabase Dashboard (action manuelle, pas de code)
1. Aller sur https://supabase.com/dashboard → ton projet
2. **Authentication** → **Providers** → **Email**
3. **Décocher** "Confirm email" (ou "Enable Email Confirmations")
4. **Sauvegarder**

> Avec cette option désactivée, `supabase.auth.signUp()` retourne directement une `session` → le code existant dans `signup-form.tsx` (ligne 97) redirigera automatiquement vers `/dashboard/onboarding` sans attendre d'email.

### Étape 2 — Vérifier que le code gère le cas "pas de confirmation"

Le code actuel dans `src/app/signup/signup-form.tsx` gère déjà les deux cas :

```typescript
// Ligne 97-104 — déjà correct
if (data.session) {
  // Confirmation désactivée → session immédiate → redirect
  router.push('/dashboard/onboarding')
  router.refresh()
  return
}

// Confirmation activée → pas de session → afficher écran "vérifiez votre mail"
setEmailConfirmationRequired(true)
setLoading(false)
```

**Il n'y a rien à changer dans le code** si on désactive la confirmation email côté Supabase.

### Étape 3 — Tester le flow

1. Aller sur `http://localhost:3000/signup`
2. Remplir le formulaire (nom, email, mot de passe, confirmation)
3. Cliquer "Créer mon compte"
4. **Résultat attendu** : redirection directe vers `/dashboard/onboarding` (plus d'écran "Vérifiez votre boîte mail")

---

## Solution alternative : Configurer un vrai SMTP (pour la production)

Si tu veux garder la confirmation email (recommandé en production), il faut configurer un SMTP custom dans Supabase :

### Option A — Resend (recommandé, gratuit jusqu'à 3000 emails/mois)
1. Créer un compte sur https://resend.com
2. Ajouter et vérifier ton domaine (`savly.com`)
3. Récupérer la **clé API**
4. Dans Supabase Dashboard → **Project Settings** → **Auth** → **SMTP Settings** :
   - **Enable Custom SMTP** : ✅
   - **Sender email** : `noreply@savly.com`
   - **Sender name** : `Savly`
   - **Host** : `smtp.resend.com`
   - **Port** : `465`
   - **Username** : `resend`
   - **Password** : ta clé API Resend (`re_xxxxxxxxxxxx`)
5. Sauvegarder

### Option B — Gmail SMTP (rapide mais limité à 500/jour)
1. Créer un **App Password** dans Google Account → Security → 2FA → App Passwords
2. Dans Supabase Dashboard → SMTP Settings :
   - **Host** : `smtp.gmail.com`
   - **Port** : `465`
   - **Username** : ton adresse Gmail
   - **Password** : l'App Password (pas le vrai mot de passe)
   - **Sender email** : ton adresse Gmail

### Personnaliser le template d'email (optionnel)
Dans Supabase Dashboard → **Authentication** → **Email Templates** → **Confirm signup** :

```html
<h2>Bienvenue sur Savly ! 🎉</h2>
<p>Bonjour,</p>
<p>Merci de vous être inscrit sur Savly. Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et accéder à votre espace :</p>
<p style="margin: 24px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #10b981; color: #09090b; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">
    Confirmer mon compte
  </a>
</p>
<p style="color: #71717a; font-size: 13px;">Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
<p style="color: #71717a; font-size: 13px;">— L'équipe Savly</p>
```

---

## Résumé des actions

| # | Action | Type | Priorité |
|---|--------|------|----------|
| 1 | Désactiver "Confirm email" dans Supabase Dashboard | Config manuelle | 🔴 Immédiat (dev/MVP) |
| 2 | Tester l'inscription → doit redirect vers onboarding | Test | 🔴 Immédiat |
| 3 | (Prod) Configurer SMTP custom (Resend recommandé) | Config manuelle | 🟡 Avant déploiement |
| 4 | (Prod) Personnaliser le template email Supabase | Config manuelle | 🟢 Optionnel |

---

## Fichiers concernés (AUCUNE modification de code nécessaire)

Le code actuel dans `src/app/signup/signup-form.tsx` gère déjà les deux cas (avec et sans confirmation). **La seule action requise est côté Supabase Dashboard.**

Si Codex ne peut pas modifier la config Supabase (c'est un dashboard web, pas du code), voici l'alternative code :

### Alternative code : forcer le signup sans confirmation via l'API Admin

Si tu ne veux pas toucher au dashboard Supabase, on peut créer une **route API server-side** qui utilise `supabaseAdmin.auth.admin.createUser()` avec `email_confirm: true` (pré-confirme l'email) :

#### [NEW] `src/app/api/auth/signup/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(100),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, fullName } = signupSchema.parse(body)

    // Créer l'utilisateur via Admin API (bypass email confirmation)
    const { data: adminData, error: adminError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // ← pré-confirme l'email
        user_metadata: { full_name: fullName },
      })

    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: 400 })
    }

    // Connecter l'utilisateur immédiatement côté server
    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, userId: adminData.user.id })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: err.errors },
        { status: 422 }
      )
    }
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
```

#### [MODIFY] `src/app/signup/signup-form.tsx`

Remplacer l'appel `supabase.auth.signUp()` par un `fetch('/api/auth/signup')` :

```typescript
// Remplacer lignes 80-104 par :
const res = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: email.trim(),
    password,
    fullName: fullName.trim(),
  }),
})

const result = await res.json()

if (!res.ok) {
  setFormError(result.error || 'Une erreur est survenue.')
  setLoading(false)
  return
}

router.push('/dashboard/onboarding')
router.refresh()
```

---

## Vérification

1. `npm run build` doit passer
2. Aller sur `/signup` → remplir le formulaire → cliquer "Créer mon compte"
3. L'utilisateur doit être redirigé **directement** vers `/dashboard/onboarding`
4. Vérifier dans Supabase Dashboard → Authentication → Users que l'utilisateur apparaît avec `email_confirmed_at` renseigné
5. Se déconnecter → se reconnecter sur `/login` avec les mêmes identifiants → doit fonctionner
