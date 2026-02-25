# CODEX PROMPT — Implementation of Premium Features (Business & Enterprise)

## Context

This is a Next.js 16 + Supabase + TypeScript SaaS application called **Savly** (AI-powered customer support).
- Located at: `saas-sav-ia/`
- Authentication: Supabase Auth (server-side client at `@/lib/supabase/server`)
- Database: Supabase PostgreSQL
- Plans are defined in `src/lib/plans.ts` — three tiers: `pro`, `business`, `enterprise`
- Feature gating is in `src/lib/feature-gate.ts` — exposes `checkFeatureAccess`, `enforceFeatureAccess`
- Settings UI is in `src/app/dashboard/settings/settings-client.tsx`
- Billing UI is in `src/app/dashboard/billing/billing-client.tsx`
- Organization data lives in the `organizations` table (columns: `id`, `name`, `plan`, `owner_id`)

---

## Goal

Implement 4 new premium features gated by plan:
1. **Custom Branding** — Business & Enterprise plan
2. **Account Manager Dédié** — Business & Enterprise plan (in-app support channel)
3. **SLA Garanti** — Visible display + status dashboard for Enterprise
4. **SSO / SAML** — Enterprise plan only, using WorkOS (or a stub UI if WorkOS is not already set up)

---

## Feature 1: Custom Branding (Business+)

### What it does
Allows organizations to upload a custom logo and choose an accent color. This branding is applied to outgoing AI-generated email responses and their dashboard header.

### Implementation Steps

#### A. Database Migration
Create a new Supabase migration: `supabase/migrations/YYYYMMDD_custom_branding.sql`
```sql
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS brand_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS brand_accent_color TEXT DEFAULT '#E8856C',
  ADD COLUMN IF NOT EXISTS brand_email_footer TEXT;
```

#### B. Settings UI — New "Branding" Tab
In `src/app/dashboard/settings/settings-client.tsx`:
- Add a new tab section `Branding` visible only when `org.plan === 'business' || org.plan === 'enterprise'`.
- If the user is on `pro`, show a locked UI with a coral "Upgrade to Business" upsell badge.
- Inside the Branding section:
  - **Logo upload**: a `<input type="file" accept="image/*">` that uploads to Supabase Storage (`buckets/brand-assets/{org_id}/logo`). Show image preview if `brand_logo_url` exists.
  - **Accent color picker**: a `<input type="color">` bound to `brand_accent_color`. Show a live preview swatch.
  - **Email footer text**: a `<textarea>` with max 200 chars for the footer disclaimer.
- Submit calls a new server action `updateBranding(orgId, { logo_url, accent_color, email_footer })`.

#### C. Server Action
Create `src/lib/actions/branding.ts`:
```typescript
'use server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function updateBranding(orgId: string, data: {
  brand_logo_url?: string
  brand_accent_color?: string
  brand_email_footer?: string
}) {
  const { error } = await supabaseAdmin
    .from('organizations')
    .update(data)
    .eq('id', orgId)
  if (error) throw new Error(error.message)
}
```

#### D. Feature Gate
In `src/lib/feature-gate.ts`, add `'custom_branding'` to `FeatureKey` and check that `plan !== 'pro'`.

---

## Feature 2: Account Manager Dédié (Business+)

### What it does
Shows a dedicated "Your Account Manager" card in the settings with contact info. For now, this is a static card with your contact info (name, email, Calendly link). The card only shows for Business and Enterprise users.

### Implementation Steps

#### A. Settings UI — "Support" or "Votre Manager" Tab
In `src/app/dashboard/settings/settings-client.tsx`:
- Add a `Votre Manager` tab section gated to `business` and `enterprise` plans.
- If on `pro`, show a locked upsell card.
- The card should show:
  - Avatar (a placeholder initials avatar using the new coral `#E8856C` theme)
  - Name: (hardcoded for now, e.g., "Nathan — Account Manager")
  - Email: (admin email)
  - Optional Calendly link — a coral "Planifier un appel" button
  - Support hours: e.g., "Lun–Ven, 9h–18h (CET)"
- Style using the "Taste-Skill" palette: `bg-[#131316]`, `border-white/[0.06]`, `text-[#EDEDED]`

#### B. Feature Gate
Add `'account_manager'` to `FeatureKey` in `feature-gate.ts`, checking plan is not `pro`.

---

## Feature 3: SLA Garanti (Enterprise)

### What it does
Shows an "SLA Status" card for Enterprise users, confirming their uptime guarantee and current service status. Links to a status page.

### Implementation Steps

#### A. Settings or Billing UI — "SLA & Uptime" Section
In `src/app/dashboard/settings/settings-client.tsx`, add a `SLA & Uptime` tab gated to `enterprise` plan only.

The section should display:
- **Status badge**: a green pulsing dot with "Tous les systèmes opérationnels" (hardcoded for now, or fetch from `https://status.savly.io` if available).
- **SLA Commitment card**: 
  - "Uptime garanti : **99.9%**"
  - "Temps de réponse incidents critiques : **< 4h**"
  - "Temps de maintien mensuel : **43h 48min max"** (this is what 99.9% translates to)
- **History table**: last 3 months uptime — hardcoded with 3 rows of "100%" to start.
- **External link** button: "Voir la page de statut publique →" (link to `https://status.savly.io` or a Statuspage.io setup).

#### B. Feature Gate
Add `'sla'` to `FeatureKey`, only allowed for `enterprise` plan.

---

## Feature 4: SSO / SAML (Enterprise)

### What it does
Allows Enterprise organizations to configure Single Sign-On via SAML 2.0 (e.g., Google Workspace, Okta, Microsoft Azure AD).

### Implementation Steps

**Important:** If WorkOS is not yet installed, use a **UI stub** that explains the feature is being set up. However, add all the database schema and UI structure so it can be wired to WorkOS later.

#### A. Database Migration
```sql
-- supabase/migrations/YYYYMMDD_sso_settings.sql
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS sso_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sso_provider TEXT, -- 'google', 'okta', 'microsoft', 'custom'
  ADD COLUMN IF NOT EXISTS sso_idp_metadata_url TEXT,
  ADD COLUMN IF NOT EXISTS sso_connection_id TEXT; -- WorkOS connection ID (added later)
```

#### B. Settings UI — "SSO / SAML" Tab
In `src/app/dashboard/settings/settings-client.tsx`, add a `SSO / SAML` tab gated to `enterprise` only.  
If not on Enterprise, show a locked upsell card.

The section should include:
- A toggle to **Enable SSO** (only clickable if configured).
- A form with:
  - **Provider selector**: dropdown of Google Workspace, Microsoft Azure AD, Okta, Custom SAML
  - **IdP Metadata URL**: text input for the SAML metadata URL
  - A "Configure SSO" submit button
- On submit, call a new server action `configureSso(orgId, { sso_provider, sso_idp_metadata_url })`
- If `sso_enabled`, show a success banner: "SSO actif — Les connexions via votre fournisseur d'identité sont activées."
- Also show: **ACS URL** (the URL your IdP must redirect to): `https://app.savly.io/api/auth/sso/callback/{orgId}` (read-only, copy button)
- Also show: **SP Entity ID**: `https://app.savly.io` (read-only, copy button)

#### C. Server Action
Create `src/lib/actions/sso.ts`:
```typescript
'use server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function configureSso(orgId: string, data: {
  sso_provider: string
  sso_idp_metadata_url: string
}) {
  const { error } = await supabaseAdmin
    .from('organizations')
    .update({ ...data, sso_enabled: true })
    .eq('id', orgId)
  if (error) throw new Error(error.message)
}
```

#### D. Feature Gate
Add `'sso'` to `FeatureKey`, only allowed for `enterprise` plan.

---

## General Constraints

1. **DO NOT** modify `src/lib/stripe.ts` or any Stripe-related files.
2. **DO NOT** modify `src/middleware.ts`.
3. **DO USE** the "Taste-Skill" palette: backgrounds `#0B0B0F`, surfaces `#131316`, borders `white/[0.06]`, accent `#E8856C`.
4. **DO USE** the existing server action pattern: `'use server'` directive, Supabase admin client, Zod validation if accepting user input.
5. **DO ADD** upsell cards when a feature is not available for the current plan — use `border-[#E8856C]/20 bg-[#E8856C]/[0.04] rounded-xl p-6` with an upgrade CTA linking to `/dashboard/billing`.
6. **DO USE** `npx tsc --noEmit` to validate TypeScript at the end. Fix all errors before considering the task complete.
7. Run `npm run build` at the end to verify the production build succeeds.

---

## Deliverables

1. SQL migrations for `custom_branding` and `sso_settings` columns.
2. New server actions: `src/lib/actions/branding.ts` and `src/lib/actions/sso.ts`.
3. Updated `feature-gate.ts` with new feature keys: `'custom_branding'`, `'account_manager'`, `'sla'`, `'sso'`.
4. Updated `settings-client.tsx` with 4 new tab sections, with proper plan gating and upsell states.
5. TypeScript and build validation passing.
