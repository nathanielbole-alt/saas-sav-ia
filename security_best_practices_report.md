# Security and Code Quality Audit

## Executive Summary

The SQL-side multi-tenant model is mostly sound: the Supabase RLS policies in the migrations consistently scope `organizations`, `customers`, `tickets`, `messages`, `notifications`, and `invitations` to the current user's `organization_id`. I did not find an obvious cross-organization leak in the RLS SQL itself.

The main risk is elsewhere: the application frequently bypasses RLS with the service-role client (`supabaseAdmin`), and a few of those service-role code paths do not re-apply authorization strictly enough. The highest-impact issues are:

1. Privileged invitation data is fetched server-side and serialized to all authenticated users on the settings page, even though the UI later hides the team section for non-admins.
2. Third-party OAuth tokens are stored in plaintext in the `integrations` table.
3. Non-admin users can trigger Gmail and Shopify sync flows that ingest external data and create internal side effects.
4. The global CSP is weakened by `'unsafe-inline'` and `'unsafe-eval'`.

On the quality/performance side, the app will degrade materially as ticket/message volume grows because several pages fetch full ticket/message graphs and recompute aggregates on every render.

## Security Findings

### SEC-01 - High - Invitation tokens and team data are exposed to every authenticated org member through the settings payload

**Impact:** Any authenticated agent can recover pending invitation links and internal team data from the client payload, even when the UI hides the team section. That leaks privileged onboarding links and internal email data inside the tenant boundary.

**Locations**

- `src/lib/actions/invitations.ts:159-202`
- `src/lib/actions/invitations.ts:318-328`
- `src/app/dashboard/settings/page.tsx:7-13`
- `src/app/dashboard/settings/settings-client.tsx:19-31`
- `src/app/dashboard/settings/settings-client.tsx:63-68`

**Evidence**

```ts
export async function getInvitations(): Promise<InvitationWithInviter[]> {
  const profile = await getAuthProfile()
  if (!profile) return []

  const { data: invitations } = await supabaseAdmin
    .from('invitations')
    .select('id, email, role, status, token, expires_at, created_at, invited_by')
    .eq('organization_id', profile.organization_id)
```

```ts
export default async function SettingsPage() {
  const [profile, organization, integrations, teamMembers, invitations] = await Promise.all([
    getProfile(),
    getOrganization(),
    getAllIntegrations(),
    getTeamMembers(),
    getInvitations(),
  ])
```

```ts
<SettingsClient
  profile={profile}
  organization={organization}
  integrations={integrations}
  teamMembers={teamMembers}
  invitations={invitations}
/>
```

**Why this is dangerous**

- `getInvitations()` uses `supabaseAdmin`, so RLS is bypassed.
- `getInvitations()` does not require `owner`/`admin`.
- The full `invitations` array, including `token`, is passed into a client component for all users.
- `TeamSection` hides the UI for non-admins client-side only; the data has already crossed the trust boundary.

**Secure fix**

1. Enforce the role check in `getInvitations()` and `getTeamMembers()` before any service-role query.
2. Do not include `token` in the default settings payload.
3. Split admin-only settings data into a separate server component that only renders for `owner`/`admin`.

**Suggested implementation**

```ts
async function requireOrgAdmin() {
  const profile = await getAuthProfile()
  if (!profile || (profile.role !== 'owner' && profile.role !== 'admin')) {
    throw new Error('Forbidden')
  }
  return profile
}

export async function getInvitations(): Promise<Omit<InvitationWithInviter, 'token'>[]> {
  const profile = await requireOrgAdmin()

  const { data: invitations, error } = await supabaseAdmin
    .from('invitations')
    .select('id, email, role, status, expires_at, created_at, invited_by')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (error || !invitations) return []
  // map inviter names as before, but never serialize the raw token here
}
```

For copy-link behavior, return the token only from `sendInvitation()` immediately after creation, or expose a separate admin-only action that re-issues a new invitation link on demand.

### SEC-02 - High - OAuth access and refresh tokens are stored in plaintext

**Impact:** A database leak, admin panel compromise, or accidental log/backup exposure would immediately compromise connected Gmail, Meta, and Shopify accounts.

**Locations**

- `supabase/migrations/00003_integrations.sql:3-13`
- `src/app/api/integrations/gmail/callback/route.ts:139-156`
- `src/app/api/integrations/meta/callback/route.ts:204-224`
- `src/app/api/integrations/shopify/callback/route.ts:186-202`

**Evidence**

```sql
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'inactive',
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  email text,
  metadata jsonb DEFAULT '{}',
```

```ts
await supabase
  .from('integrations')
  .upsert(
    {
      organization_id: p.organization_id,
      provider: 'gmail',
      status: 'active',
      access_token: tokens.access_token ?? null,
      refresh_token: tokens.refresh_token ?? null,
```

**Why this is dangerous**

- These are bearer credentials, not just IDs.
- The table design treats secrets as normal application data.
- Multiple server actions and routes read and rewrite the tokens directly, so there is no encryption boundary at rest.

**Secure fix**

1. Encrypt third-party tokens before writing them to Postgres.
2. Decrypt only in server-only code paths that need the token.
3. Keep non-secret identifiers like Stripe `customer_id` separate from secret token columns.

**Recommended approach**

- Add encrypted columns such as `access_token_encrypted bytea` and `refresh_token_encrypted bytea`.
- Use envelope encryption:
  - Generate a data key outside the app DB (KMS / Vault / managed secret).
  - Encrypt/decrypt in server-only code.
- If you must stay inside Postgres temporarily, use `pgcrypto` with an app-level key from the environment, while planning a KMS-backed migration.

**Example shape**

```ts
const encryptedAccessToken = encryptSecret(tokens.access_token)
const encryptedRefreshToken = encryptSecret(tokens.refresh_token)

await supabase
  .from('integrations')
  .upsert({
    organization_id: p.organization_id,
    provider: 'gmail',
    status: 'active',
    access_token_encrypted: encryptedAccessToken,
    refresh_token_encrypted: encryptedRefreshToken,
    token_expires_at: ...,
  })
```

### SEC-03 - Medium - Non-admin users can trigger Gmail and Shopify sync side effects

**Impact:** Any authenticated org member can trigger third-party data ingestion, consume API quotas, create tickets/customers, and trigger auto-reply side effects from connected external systems.

**Locations**

- `src/app/dashboard/settings/components/integrations-section.tsx:221-231`
- `src/app/dashboard/settings/components/integrations-section.tsx:349-367`
- `src/lib/actions/gmail.ts:198-243`
- `src/lib/actions/shopify.ts:164-209`
- `src/lib/actions/shopify.ts:301-320`

**Evidence**

```ts
{isGmailConnected && (
  <>
    <button onClick={handleGmailSync}>Synchroniser</button>
```

```ts
export async function syncGmailMessages(): Promise<...> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, count: 0, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
```

**Why this is dangerous**

- These actions are not read-only.
- They create customers, tickets, messages, and can trigger AI replies.
- The current authorization model treats "authenticated org member" as enough privilege for external system synchronization.

**Secure fix**

Require `owner` or `admin` in the server actions before any sync work starts, and hide the sync controls in the UI for non-admins.

**Suggested implementation**

```ts
async function requireOrgAdminContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  const p = profile as { organization_id: string; role: string } | null
  if (!p || !['owner', 'admin'].includes(p.role)) throw new Error('Forbidden')
  return { supabase, orgId: p.organization_id }
}
```

Then use it in `syncGmailMessages`, `syncShopifyCustomers`, and `syncShopifyOrders`, and gate the buttons with `canManageIntegrations`.

### SEC-04 - Medium - The global CSP is too permissive to be an effective XSS mitigation

**Impact:** If an XSS sink appears anywhere else in the app, the current policy makes exploitation substantially easier because inline script execution and `eval`-style execution remain allowed.

**Location**

- `next.config.ts:21-33`

**Evidence**

```ts
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
```

**Why this is dangerous**

- `'unsafe-inline'` defeats a core CSP protection.
- `'unsafe-eval'` is unnecessary in most production Next.js deployments.
- The policy is shipped globally, so the weakest route sets the site-wide baseline.

**Secure fix**

1. Remove `'unsafe-eval'` in production.
2. Move to nonces or hashes for inline scripts.
3. Keep Stripe explicitly allowed, but only for the exact origins you need.
4. Consider adding `frame-ancestors 'none'` or a product-specific value, even if `X-Frame-Options` is present.

**Safer production direction**

```ts
"script-src 'self' 'nonce-<dynamic-nonce>' https://js.stripe.com",
"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
"frame-ancestors 'none'",
```

For Next.js App Router, generate a nonce per request in middleware/proxy and attach it to the CSP and any required inline scripts.

## Code Quality and Performance Findings

### QUAL-01 - High - Inbox and overview load full ticket graphs instead of summary data

**Impact:** Render time and payload size scale with total message history, not with the number of visible tickets. This will degrade FCP/LCP quickly on real tenants.

**Locations**

- `src/lib/actions/tickets.ts:60-71`
- `src/lib/actions/tickets.ts:95-114`
- `src/lib/actions/tickets.ts:169-180`
- `src/app/dashboard/inbox/page.tsx:12`
- `src/app/dashboard/page.tsx:8`

**Evidence**

```ts
const { data: rawTickets, error } = await supabase
  .from('tickets')
  .select(
    `
      *,
      customer:customers(*),
      messages(*),
      tags:ticket_tags(tag:tags(*))
    `
  )
  .order('created_at', { ascending: false })
```

**Why this is under-optimal**

- The inbox list needs ticket summaries, not complete message histories for every ticket.
- The code sorts and maps all nested messages in JavaScript for every render.
- The same heavy helper is reused by both the main dashboard and inbox page.

**Technical fix**

Split the model into:

1. `getTicketSummaries()` for list views:
   - `id`, `subject`, `status`, `priority`, `channel`, `assigned_to`, `customer`, last message preview, unread flag.
2. `getTicketDetail(ticketId)` for the selected conversation:
   - full message history and tags only for one ticket.

If you want a single-query approach, add denormalized columns like `last_message_at`, `last_message_sender_type`, and `last_message_preview` on `tickets`, maintained by a trigger.

### QUAL-02 - Medium - The dashboard layout recomputes unread counts by loading all open tickets with nested messages on every page render

**Impact:** Every dashboard route pays the cost of scanning open tickets and sorting their message arrays, even when the page itself does not need ticket content.

**Location**

- `src/app/dashboard/layout.tsx:42-55`

**Evidence**

```ts
const { data: openTickets } = await supabase
  .from('tickets')
  .select('id, status, messages(sender_type, created_at)')
  .eq('status', 'open')

const unreadCount = (openTickets as unknown[] | null)?.filter((raw) => {
  const t = raw as { messages: { sender_type: string; created_at: string }[] }
  if (!t.messages || t.messages.length === 0) return true
  const sorted = [...t.messages].sort(
```

**Technical fix**

- Best option: persist `last_message_sender_type` on `tickets` and compute unread count with a simple filtered count query.
- Alternative: add a Postgres view/RPC that returns only the unread count for the current org.

Example target query:

```sql
select count(*)
from tickets
where organization_id = $1
  and status = 'open'
  and last_message_sender_type = 'customer';
```

### QUAL-03 - Medium - Analytics recomputes full-table aggregates on each render and refreshes the whole route on every ticket event

**Impact:** Analytics cost grows with total ticket and message volume, and realtime traffic forces full server rerenders instead of cheap incremental updates.

**Locations**

- `src/lib/actions/analytics.ts:55-73`
- `src/lib/actions/analytics.ts:151-263`
- `src/app/dashboard/analytics/analytics-client.tsx:319-332`

**Evidence**

```ts
const { data: tickets, error } = await supabase
  .from('tickets')
  .select('id, status, priority, channel, csat_rating, created_at, updated_at')
  .order('created_at', { ascending: true })

const { data: allMessages } = await supabase
  .from('messages')
  .select('ticket_id, sender_type, created_at')
  .order('created_at', { ascending: true })
```

```ts
useEffect(() => {
  const channel = supabase
    .channel('analytics-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tickets' },
      () => router.refresh()
    )
```

**Technical fix**

1. Move heavy aggregations to SQL or a scheduled rollup table.
2. Scope realtime invalidation narrowly and debounce refreshes.
3. For metrics like `ticketsByChannel`, `statusCounts`, and `customerCount`, let Postgres aggregate directly.

For example:

```sql
select channel, count(*)
from tickets
where organization_id = $1
group by channel;
```

### QUAL-04 - Medium - The analytics page creates a Supabase browser client during render and re-subscribes unnecessarily

**Impact:** The effect dependency is unstable, which can create needless subscribe/unsubscribe churn and extra work on rerenders.

**Location**

- `src/app/dashboard/analytics/analytics-client.tsx:319-332`

**Evidence**

```ts
const supabase = createClient()

useEffect(() => {
  const channel = supabase
    .channel('analytics-realtime')
```

**Technical fix**

Create the client once per component lifecycle.

```ts
const [supabase] = useState(() => createClient())
```

Or move the client to a module-level singleton if that matches the project's conventions.

### QUAL-05 - Low - Type safety is weakened by manually maintained database types and repeated escape-hatch casts

**Impact:** Schema drift and hidden runtime mismatches become more likely, especially as migrations evolve beyond the initial schema.

**Locations**

- `src/types/database.types.ts:1-2`
- `src/lib/actions/settings.ts:26`
- `src/lib/actions/settings.ts:80`
- `src/app/dashboard/analytics/analytics-client.tsx:51`

**Evidence**

```ts
// Types générés manuellement à partir de supabase/migrations/00001_initial_schema.sql
// Sera remplacé par supabase gen types quand le projet Supabase sera connecté
```

```ts
return data as unknown as Profile
```

```ts
function CustomTooltip({ active, payload, label, formatter }: any) {
```

**Technical fix**

1. Generate `Database` types from Supabase in CI or as a local script.
2. Replace `as unknown as ...` with typed query helpers and typed select payloads.
3. Remove the `any` tooltip signature and model the Recharts payload explicitly.

## RLS Conclusion

The RLS policies themselves are mostly aligned with the intended `organization_id` tenant boundary:

- `organizations`: scoped to the caller's `organization_id`
- `customers`, `tickets`, `messages`, `tags`, `ticket_tags`: scoped by org or ticket-org relation
- `notifications`, `invitations`: later migrations tighten access for admin/owner flows

The weak point is not the SQL policy layer; it is the number of application paths that intentionally bypass RLS with `supabaseAdmin`. Those paths need strict server-side role checks every time.

## Validation Notes

- I attempted to run `npm run lint`, but the local install is currently broken because `prelude-ls/lib` is missing from `node_modules`, so I could not use ESLint output to extend the audit.
- I did not verify runtime headers, CDN/WAF config, or Supabase Storage bucket policies from infrastructure, because those are not visible in the repository.
