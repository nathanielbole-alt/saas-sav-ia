import { supabaseAdmin } from '@/lib/supabase/admin'
import { PLANS, type PlanKey } from '@/lib/stripe'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FeatureKey =
  | 'tickets'
  | 'integrations'
  | 'users'
  | 'custom_branding'
  | 'account_manager'
  | 'sla'
  | 'sso'

export type FeatureCheck = {
  allowed: boolean
  current: number
  limit: number
  plan: PlanKey
}

export type OrgUsage = {
  ticketsThisMonth: number
  activeIntegrations: number
  users: number
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/** Fetch the current plan for an organization. Falls back to 'pro'. */
export async function getOrgPlan(orgId: string): Promise<PlanKey> {
  const { data } = await supabaseAdmin
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single()

  const plan = (data as { plan: string } | null)?.plan
  if (plan && plan in PLANS) return plan as PlanKey
  return 'pro'
}

/** Count current resource usage for an organization. */
export async function getOrgUsage(orgId: string): Promise<OrgUsage> {
  // Start of current month (UTC)
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

  const [ticketsResult, integrationsResult, usersResult] = await Promise.all([
    // Tickets created this month
    supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', monthStart),

    // Active integrations (exclude stripe — it's not a user-facing integration)
    supabaseAdmin
      .from('integrations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .neq('provider', 'stripe'),

    // User profiles in the org
    supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),
  ])

  return {
    ticketsThisMonth: ticketsResult.count ?? 0,
    activeIntegrations: integrationsResult.count ?? 0,
    users: usersResult.count ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Feature access checks
// ---------------------------------------------------------------------------

/**
 * Check if a feature is within plan limits.
 * Returns { allowed, current, limit, plan }.
 */
export async function checkFeatureAccess(
  orgId: string,
  feature: FeatureKey
): Promise<FeatureCheck> {
  const plan = await getOrgPlan(orgId)

  // Plan-gated features (no usage counters required)
  if (feature === 'custom_branding' || feature === 'account_manager') {
    return {
      allowed: plan !== 'pro',
      current: plan !== 'pro' ? 0 : 1,
      limit: 1,
      plan,
    }
  }

  if (feature === 'sla' || feature === 'sso') {
    return {
      allowed: plan === 'enterprise',
      current: plan === 'enterprise' ? 0 : 1,
      limit: 1,
      plan,
    }
  }

  const usage = await getOrgUsage(orgId)
  const limits = PLANS[plan].limits

  switch (feature) {
    case 'tickets': {
      const limit = limits.tickets
      const current = usage.ticketsThisMonth
      return { allowed: current < limit, current, limit, plan }
    }
    case 'integrations': {
      const limit = limits.integrations
      const current = usage.activeIntegrations
      return { allowed: current < limit, current, limit, plan }
    }
    case 'users': {
      const limit = limits.users
      const current = usage.users
      return { allowed: current < limit, current, limit, plan }
    }
    default:
      // Exhaustive guard for future feature keys.
      return { allowed: false, current: 0, limit: 0, plan }
  }
}

/**
 * Throws if the feature limit is exceeded.
 * Use in server actions / tRPC mutations to block creation.
 */
export async function enforceFeatureAccess(
  orgId: string,
  feature: FeatureKey
): Promise<void> {
  const check = await checkFeatureAccess(orgId, feature)
  if (!check.allowed) {
    const featureLabels: Record<FeatureKey, string> = {
      tickets: 'tickets',
      integrations: 'intégrations',
      users: 'utilisateurs',
      custom_branding: 'branding personnalisé',
      account_manager: 'account manager dédié',
      sla: 'SLA garanti',
      sso: 'SSO / SAML',
    }
    const label = featureLabels[feature]
    const limitDisplay = check.limit === Infinity ? 'illimité' : String(check.limit)
    throw new Error(
      `Limite ${label} atteinte : ${check.current}/${limitDisplay} (plan ${check.plan}). Passez à un plan supérieur.`
    )
  }
}
