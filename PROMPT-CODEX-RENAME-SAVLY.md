# PROMPT CODEX — Renommer "SAV IA" → "Savly" dans tout le projet

## Objectif

Renommer toutes les occurrences de **"SAV IA"** par **"Savly"** dans l'ensemble du projet. Cela inclut les textes affichés à l'utilisateur, les métadonnées SEO, le manifest, le branding dans le dashboard, et les scripts.

Le sous-titre "Pilote automatique" dans la navbar doit aussi être mis à jour en un tagline cohérent avec le nouveau nom (par exemple : **"SAV intelligent"** ou **"Service client IA"**).

---

## Règles de remplacement

| Ancien | Nouveau | Notes |
|--------|---------|-------|
| `SAV IA` | `Savly` | Partout (textes, titres, labels, métadonnées) |
| `sav-ia` (dans les URLs affichées) | `savly` | Ex: `app.sav-ia.com` → `app.savly.com` |
| `saas-sav.ia` (email) | `savly.com` | Email de contact |
| `SAV IA Pro` / `Business` / `Enterprise` | `Savly Pro` / `Business` / `Enterprise` | Plans Stripe |
| `Pilote automatique` (tagline navbar) | Tagline cohérent avec "Savly" | Ex: "SAV intelligent" |
| `SaaS SAV IA` (dans CLAUDE.md) | `Savly` | Documentation interne |

> **NE PAS renommer** le dossier du projet (`saas-sav-ia/`), le champ `name` dans `package.json` et `package-lock.json`, ni les noms de variables/fonctions dans le code. Seuls les textes visibles par l'utilisateur et la documentation doivent être modifiés.

---

## Fichiers à modifier (liste exhaustive)

### Landing Page
| Fichier | Ligne(s) | Contenu actuel |
|---------|----------|----------------|
| `src/components/landing/navbar.tsx` | 39 | `SAV IA` → `Savly` |
| `src/components/landing/navbar.tsx` | 41 | `Pilote automatique` → nouveau tagline |
| `src/components/landing/hero.tsx` | 97 | `SAV IA connecte votre boutique...` |
| `src/components/landing/hero.tsx` | 167 | `app.sav-ia.com/inbox` → `app.savly.com/inbox` |
| `src/components/landing/faq.tsx` | 14 | `SAV IA se connecte à vos outils...` |
| `src/components/landing/faq.tsx` | 57 | `fonctionnement de SAV IA` |
| `src/components/landing/faq.tsx` | 120 | `contact@saas-sav.ia` → `contact@savly.com` |
| `src/components/landing/footer.tsx` | 89 | `SAV IA` |
| `src/components/landing/footer.tsx` | 124 | `SAV IA. Tous droits réservés.` |
| `src/components/landing/use-cases.tsx` | 45 | `SAV IA fait pour` |
| `src/components/landing/testimonials.tsx` | 99 | `SAV IA récupère le numéro de commande...` |

### Dashboard
| Fichier | Ligne(s) | Contenu actuel |
|---------|----------|----------------|
| `src/app/dashboard/layout.tsx` | 67 | `SAV IA` |
| `src/components/dashboard/sidebar.tsx` | 179 | `SAV IA` |
| `src/app/dashboard/onboarding/onboarding-client.tsx` | 304 | `Bienvenue sur SAV IA !` |
| `src/app/dashboard/onboarding/onboarding-client.tsx` | 761 | `Votre espace SAV IA est configuré...` |
| `src/app/dashboard/settings/settings-client.tsx` | 971 | `directement dans SAV IA` |
| `src/app/dashboard/settings/settings-client.tsx` | 1401 | `api.sav-ia.com` → `api.savly.com` |

### Auth & Signup
| Fichier | Ligne(s) | Contenu actuel |
|---------|----------|----------------|
| `src/app/login/page.tsx` | 10 | `SAV IA` |
| `src/app/signup/page.tsx` | 5-6 | `SAV IA` (titre + description meta) |
| `src/app/signup/signup-form.tsx` | 119, 167, 173 | `SAV IA` |
| `src/app/invite/[token]/invite-client.tsx` | 115 | `organisation sur SAV IA` |

### Composants UI
| Fichier | Ligne(s) | Contenu actuel |
|---------|----------|----------------|
| `src/components/ui/header.tsx` | 19 | `SAV IA` |
| `src/components/ui/video-modal.tsx` | 50 | `Démonstration SAV IA` |

### Layout & SEO
| Fichier | Ligne(s) | Contenu actuel |
|---------|----------|----------------|
| `src/app/layout.tsx` | 17 | `SAV IA — Votre SAV, boosté par l'IA` → `Savly — Votre SAV, boosté par l'IA` |
| `src/app/layout.tsx` | 24 | `SAV IA` → `Savly` |

### Data & Logic
| Fichier | Ligne(s) | Contenu actuel |
|---------|----------|----------------|
| `src/lib/mock-data.ts` | 144 | `senderName: 'SAV IA'` → `'Savly'` |
| `src/lib/actions/tickets.ts` | 107, 214 | `'SAV IA'` → `'Savly'` |
| `src/hooks/use-realtime-tickets.ts` | 51 | `'SAV IA'` → `'Savly'` |

### Scripts & Config
| Fichier | Ligne(s) | Contenu actuel |
|---------|----------|----------------|
| `scripts/setup-stripe.ts` | 18 | `SAV IA Pro` → `Savly Pro` |
| `scripts/setup-stripe.ts` | 24 | `SAV IA Business` → `Savly Business` |
| `scripts/setup-stripe.ts` | 30 | `SAV IA Enterprise` → `Savly Enterprise` |
| `public/manifest.json` | 2-3 | `"name": "SAV IA"` et `"short_name": "SAV IA"` → `"Savly"` |

### Tests
| Fichier | Ligne(s) | Contenu actuel |
|---------|----------|----------------|
| `e2e/onboarding.spec.ts` | 29 | `Bienvenue sur SAV IA` → `Bienvenue sur Savly` |

### Documentation (adapter aussi)
| Fichier | Ligne(s) | Contenu actuel |
|---------|----------|----------------|
| `CLAUDE.md` | 1 | `# SaaS SAV IA` → `# Savly` |

---

## Logo

Le logo dans la navbar utilise actuellement la lettre **"S"** dans un carré gradient. C'est cohérent avec "Savly", donc **garder le logo "S" tel quel**.

---

## Vérification

1. `npm run build` doit passer sans erreurs
2. Ouvrir `http://localhost:3000` et vérifier qu'il n'y a plus aucune mention de "SAV IA" visible
3. Vérifier le dashboard (`/dashboard`) — sidebar, header, onboarding
4. Vérifier la page signup (`/signup`) et login (`/login`)
5. Vérifier le title de la page dans l'onglet du navigateur → doit afficher "Savly"
6. Grep pour s'assurer qu'il ne reste plus de `SAV IA` dans le code (hors package.json/package-lock.json)
