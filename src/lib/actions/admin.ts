'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { PlanKey } from '@/lib/plans'
import { PLANS } from '@/lib/plans'

// ---------------------------------------------------------------------------
// Types — Dashboard
// ---------------------------------------------------------------------------

export type AdminKPIs = {
  mrr: number
  totalOrgs: number
  totalUsers: number
  tickets24h: number
  tickets7d: number
  tickets30d: number
  aiRequests24h: number
  estimatedAiCost: number
  activeIntegrations: number
  openTickets: number
  resolvedTickets30d: number
}

export type OrgRow = {
  id: string
  name: string
  slug: string
  plan: PlanKey
  subscriptionStatus: string
  createdAt: string
  ownerEmail: string | null
  ownerId: string | null
  userCount: number
  ticketCount: number
}

export type SignupDataPoint = { date: string; count: number }
export type TicketVolumePoint = { date: string; count: number }
export type PlanDistribution = { plan: string; count: number }
export type ChannelBreakdown = { channel: string; count: number }

// ---------------------------------------------------------------------------
// Types — Finance
// ---------------------------------------------------------------------------

export type PaymentRow = {
  orgId: string
  orgName: string
  plan: string
  amount: number
  status: string
  date: string
}

export type ChurnRow = {
  orgId: string
  orgName: string
  plan: string
  canceledAt: string
  ownerEmail: string | null
}

export type FinanceData = {
  recentPayments: PaymentRow[]
  recentChurns: ChurnRow[]
  totalRevenue30d: number
  churnCount30d: number
}

// ---------------------------------------------------------------------------
// Types — System Health
// ---------------------------------------------------------------------------

export type ErrorIntegration = {
  id: string
  orgId: string
  orgName: string
  provider: string
  updatedAt: string
}

export type SystemHealthData = {
  errorIntegrations: ErrorIntegration[]
  lastEmailTicketAt: string | null
  aiUsage7d: number
  aiUsage30d: number
  totalMessages: number
  totalCustomers: number
}

// ---------------------------------------------------------------------------
// Types — Org Detail
// ---------------------------------------------------------------------------

export type OrgDetailUser = {
  id: string
  email: string
  fullName: string | null
  role: string
  createdAt: string
}

export type OrgDetailTicket = {
  id: string
  subject: string
  status: string
  priority: string
  channel: string
  customerEmail: string
  createdAt: string
  messageCount: number
}

export type OrgDetailIntegration = {
  id: string
  provider: string
  status: string
  email: string | null
  updatedAt: string
}

export type OrgDetailData = {
  org: {
    id: string
    name: string
    slug: string
    plan: PlanKey
    subscriptionStatus: string
    refundPolicy: string | null
    savPolicy: string | null
    createdAt: string
  }
  users: OrgDetailUser[]
  recentTickets: OrgDetailTicket[]
  integrations: OrgDetailIntegration[]
  stats: {
    totalTickets: number
    openTickets: number
    resolvedTickets: number
    aiMessages: number
    totalMessages: number
    totalCustomers: number
  }
}

// ---------------------------------------------------------------------------
// Types — Aggregate
// ---------------------------------------------------------------------------

export type AdminDashboardData = {
  kpis: AdminKPIs
  orgs: OrgRow[]
  signupTimeline: SignupDataPoint[]
  ticketVolume: TicketVolumePoint[]
  planDistribution: PlanDistribution[]
  channelBreakdown: ChannelBreakdown[]
  finance: FinanceData
  systemHealth: SystemHealthData
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function formatDateKey(dateStr: string): string {
  return dateStr.slice(0, 10)
}

function generateDateRange(days: number): string[] {
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(formatDateKey(d.toISOString()))
  }
  return dates
}

// ---------------------------------------------------------------------------
// Security: require owner role
// ---------------------------------------------------------------------------

async function requireOwnerRole(): Promise<{ userId: string; orgId: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const p = profile as { role: string; organization_id: string } | null
  if (!p || p.role !== 'owner') throw new Error('Forbidden')

  return { userId: user.id, orgId: p.organization_id }
}

// ---------------------------------------------------------------------------
// Main dashboard fetcher
// ---------------------------------------------------------------------------

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await requireOwnerRole()

  const ago24h = daysAgo(1)
  const ago7d = daysAgo(7)
  const ago30d = daysAgo(30)

  const [
    orgsResult,
    profilesResult,
    tickets24hResult,
    tickets7dResult,
    tickets30dResult,
    allTicketsResult,
    openTicketsResult,
    resolvedTicketsResult,
    aiMessages24hResult,
    integrationsResult,
    allOrgsWithProfilesResult,
    allTicketsForVolumeResult,
    // Finance & health
    aiMessages7dResult,
    aiMessages30dResult,
    errorIntegrationsResult,
    lastEmailTicketResult,
    totalMessagesResult,
    totalCustomersResult,
    canceledOrgsResult,
  ] = await Promise.all([
    supabaseAdmin.from('organizations').select('*'),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', ago24h),
    supabaseAdmin.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', ago7d),
    supabaseAdmin.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', ago30d),
    supabaseAdmin.from('tickets').select('channel, created_at'),
    supabaseAdmin.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabaseAdmin.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolved').gte('updated_at', ago30d),
    supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }).eq('sender_type', 'ai').gte('created_at', ago24h),
    supabaseAdmin.from('integrations').select('*', { count: 'exact', head: true }).eq('status', 'active').neq('provider', 'stripe'),
    supabaseAdmin.from('organizations').select('id, name, slug, plan, subscription_status, created_at, profiles(id, email, role)').order('created_at', { ascending: false }),
    supabaseAdmin.from('tickets').select('created_at').gte('created_at', ago30d),
    // Extra queries for new sections
    supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }).eq('sender_type', 'ai').gte('created_at', ago7d),
    supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }).eq('sender_type', 'ai').gte('created_at', ago30d),
    supabaseAdmin.from('integrations').select('id, organization_id, provider, status, updated_at').eq('status', 'error').neq('provider', 'stripe').order('updated_at', { ascending: false }).limit(10),
    supabaseAdmin.from('tickets').select('created_at').eq('channel', 'email').order('created_at', { ascending: false }).limit(1),
    supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('customers').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('organizations').select('id, name, plan, subscription_status, updated_at, profiles(email, role)').eq('subscription_status', 'canceled').order('updated_at', { ascending: false }).limit(10),
  ])

  // ── KPIs ──────────────────────────────────────────────────────────

  const orgs = (orgsResult.data ?? []) as {
    id: string
    plan: PlanKey
    subscription_status: string
    created_at: string
  }[]

  const planPrices: Record<PlanKey, number> = { pro: 29, business: 79, enterprise: 149 }

  const activeOrgs = orgs.filter(
    (o) => o.subscription_status === 'active' || o.subscription_status === 'trialing'
  )
  const mrr = activeOrgs.reduce((sum, o) => sum + (planPrices[o.plan] ?? 0), 0)

  const aiCount24h = aiMessages24hResult.count ?? 0
  const estimatedAiCost = aiCount24h * 0.0004

  const kpis: AdminKPIs = {
    mrr,
    totalOrgs: orgs.length,
    totalUsers: profilesResult.count ?? 0,
    tickets24h: tickets24hResult.count ?? 0,
    tickets7d: tickets7dResult.count ?? 0,
    tickets30d: tickets30dResult.count ?? 0,
    aiRequests24h: aiCount24h,
    estimatedAiCost,
    activeIntegrations: integrationsResult.count ?? 0,
    openTickets: openTicketsResult.count ?? 0,
    resolvedTickets30d: resolvedTicketsResult.count ?? 0,
  }

  // ── Orgs table ────────────────────────────────────────────────────

  type OrgWithProfiles = {
    id: string
    name: string
    slug: string
    plan: PlanKey
    subscription_status: string
    created_at: string
    profiles: { id: string; email: string; role: string }[]
  }

  const orgsTableData: OrgRow[] = (
    (allOrgsWithProfilesResult.data ?? []) as OrgWithProfiles[]
  ).map((org) => {
    const owner = org.profiles.find((p) => p.role === 'owner')
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      subscriptionStatus: org.subscription_status,
      createdAt: org.created_at,
      ownerEmail: owner?.email ?? null,
      ownerId: owner?.id ?? null,
      userCount: org.profiles.length,
      ticketCount: 0,
    }
  })

  const { data: ticketsWithOrg } = await supabaseAdmin
    .from('tickets')
    .select('organization_id')

  const orgTicketCounts = new Map<string, number>()
  for (const t of (ticketsWithOrg ?? []) as { organization_id: string }[]) {
    orgTicketCounts.set(t.organization_id, (orgTicketCounts.get(t.organization_id) ?? 0) + 1)
  }
  for (const org of orgsTableData) {
    org.ticketCount = orgTicketCounts.get(org.id) ?? 0
  }

  // ── Timelines ─────────────────────────────────────────────────────

  const dateRange = generateDateRange(30)

  const signupCounts = new Map<string, number>()
  for (const org of orgs) {
    if (org.created_at) {
      const key = formatDateKey(org.created_at)
      signupCounts.set(key, (signupCounts.get(key) ?? 0) + 1)
    }
  }
  const signupTimeline: SignupDataPoint[] = dateRange.map((date) => ({
    date,
    count: signupCounts.get(date) ?? 0,
  }))

  const ticketVolumeCounts = new Map<string, number>()
  for (const t of (allTicketsForVolumeResult.data ?? []) as { created_at: string }[]) {
    const key = formatDateKey(t.created_at)
    ticketVolumeCounts.set(key, (ticketVolumeCounts.get(key) ?? 0) + 1)
  }
  const ticketVolume: TicketVolumePoint[] = dateRange.map((date) => ({
    date,
    count: ticketVolumeCounts.get(date) ?? 0,
  }))

  // ── Distributions ─────────────────────────────────────────────────

  const planCounts = new Map<string, number>()
  for (const org of orgs) planCounts.set(org.plan, (planCounts.get(org.plan) ?? 0) + 1)
  const planDistribution: PlanDistribution[] = Array.from(planCounts.entries()).map(([plan, count]) => ({ plan, count }))

  const allTickets = (allTicketsResult.data ?? []) as { channel: string; created_at: string }[]
  const channelCounts = new Map<string, number>()
  for (const t of allTickets) channelCounts.set(t.channel, (channelCounts.get(t.channel) ?? 0) + 1)
  const channelBreakdown: ChannelBreakdown[] = Array.from(channelCounts.entries())
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count)

  // ── Finance ───────────────────────────────────────────────────────

  const recentPayments: PaymentRow[] = activeOrgs
    .slice(0, 20)
    .map((o) => {
      const orgData = orgsTableData.find((r) => r.id === o.id)
      return {
        orgId: o.id,
        orgName: orgData?.name ?? '—',
        plan: o.plan,
        amount: planPrices[o.plan] ?? 0,
        status: o.subscription_status,
        date: o.created_at,
      }
    })

  type CanceledOrg = {
    id: string
    name: string
    plan: PlanKey
    subscription_status: string
    updated_at: string
    profiles: { email: string; role: string }[]
  }

  const recentChurns: ChurnRow[] = ((canceledOrgsResult.data ?? []) as CanceledOrg[]).map((o) => {
    const owner = o.profiles.find((p) => p.role === 'owner')
    return {
      orgId: o.id,
      orgName: o.name,
      plan: o.plan,
      canceledAt: o.updated_at,
      ownerEmail: owner?.email ?? null,
    }
  })

  const totalRevenue30d = activeOrgs.reduce((sum, o) => sum + (planPrices[o.plan] ?? 0), 0)

  const finance: FinanceData = {
    recentPayments,
    recentChurns,
    totalRevenue30d,
    churnCount30d: recentChurns.length,
  }

  // ── System Health ─────────────────────────────────────────────────

  type ErrorIntRow = {
    id: string
    organization_id: string
    provider: string
    status: string
    updated_at: string
  }

  const orgNameMap = new Map<string, string>()
  for (const o of orgsTableData) orgNameMap.set(o.id, o.name)

  const errorIntegrations: ErrorIntegration[] = (
    (errorIntegrationsResult.data ?? []) as ErrorIntRow[]
  ).map((i) => ({
    id: i.id,
    orgId: i.organization_id,
    orgName: orgNameMap.get(i.organization_id) ?? '—',
    provider: i.provider,
    updatedAt: i.updated_at,
  }))

  const lastEmailTicket = (lastEmailTicketResult.data ?? []) as { created_at: string }[]

  const systemHealth: SystemHealthData = {
    errorIntegrations,
    lastEmailTicketAt: lastEmailTicket[0]?.created_at ?? null,
    aiUsage7d: aiMessages7dResult.count ?? 0,
    aiUsage30d: aiMessages30dResult.count ?? 0,
    totalMessages: totalMessagesResult.count ?? 0,
    totalCustomers: totalCustomersResult.count ?? 0,
  }

  return {
    kpis,
    orgs: orgsTableData,
    signupTimeline,
    ticketVolume,
    planDistribution,
    channelBreakdown,
    finance,
    systemHealth,
  }
}

// ---------------------------------------------------------------------------
// Impersonation — generate magic link for a user
// ---------------------------------------------------------------------------

export async function generateImpersonationLink(
  email: string
): Promise<{ url: string } | { error: string }> {
  await requireOwnerRole()

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${process.env.NEXTAUTH_URL}/dashboard`,
    },
  })

  if (error || !data.properties?.action_link) {
    return { error: error?.message ?? 'Impossible de générer le lien' }
  }

  return { url: data.properties.action_link }
}

// ---------------------------------------------------------------------------
// Org Detail
// ---------------------------------------------------------------------------

export async function getOrgDetail(
  orgId: string
): Promise<OrgDetailData | null> {
  await requireOwnerRole()

  const [orgResult, usersResult, ticketsResult, integrationsResult, customerCountResult, openCountResult, resolvedCountResult] =
    await Promise.all([
      supabaseAdmin
        .from('organizations')
        .select('id, name, slug, plan, subscription_status, refund_policy, sav_policy, created_at')
        .eq('id', orgId)
        .single(),
      supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('tickets')
        .select('id, subject, status, priority, channel, customer_id, created_at, messages(id)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('integrations')
        .select('id, provider, status, email, updated_at')
        .eq('organization_id', orgId)
        .neq('provider', 'stripe'),

      supabaseAdmin
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId),
      supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'open'),
      supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'resolved'),
    ])

  if (orgResult.error || !orgResult.data) return null

  const orgRaw = orgResult.data as {
    id: string
    name: string
    slug: string
    plan: PlanKey
    subscription_status: string
    refund_policy: string | null
    sav_policy: string | null
    created_at: string
  }

  // Get customer emails for tickets
  const customerIds = new Set<string>()
  type TicketWithMessages = {
    id: string
    subject: string
    status: string
    priority: string
    channel: string
    customer_id: string
    created_at: string
    messages: { id: string }[]
  }
  const ticketsRaw = (ticketsResult.data ?? []) as TicketWithMessages[]
  for (const t of ticketsRaw) customerIds.add(t.customer_id)

  const { data: customers } = customerIds.size > 0
    ? await supabaseAdmin
      .from('customers')
      .select('id, email')
      .in('id', Array.from(customerIds))
    : { data: [] }

  const customerEmailMap = new Map<string, string>()
  for (const c of (customers ?? []) as { id: string; email: string }[]) {
    customerEmailMap.set(c.id, c.email)
  }

  // Count AI messages for this org's tickets
  const ticketIds = ticketsRaw.map((t) => t.id)
  let aiMessagesCount = 0
  let totalOrgMessages = 0
  if (ticketIds.length > 0) {
    const [aiRes, totalRes] = await Promise.all([
      supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_type', 'ai')
        .in('ticket_id', ticketIds),
      supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('ticket_id', ticketIds),
    ])
    aiMessagesCount = aiRes.count ?? 0
    totalOrgMessages = totalRes.count ?? 0
  }

  type ProfileRow = {
    id: string
    email: string
    full_name: string | null
    role: string
    created_at: string
  }

  return {
    org: {
      id: orgRaw.id,
      name: orgRaw.name,
      slug: orgRaw.slug,
      plan: orgRaw.plan,
      subscriptionStatus: orgRaw.subscription_status,
      refundPolicy: orgRaw.refund_policy,
      savPolicy: orgRaw.sav_policy,
      createdAt: orgRaw.created_at,
    },
    users: ((usersResult.data ?? []) as ProfileRow[]).map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      role: u.role,
      createdAt: u.created_at,
    })),
    recentTickets: ticketsRaw.map((t) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      channel: t.channel,
      customerEmail: customerEmailMap.get(t.customer_id) ?? '—',
      createdAt: t.created_at,
      messageCount: t.messages.length,
    })),
    integrations: ((integrationsResult.data ?? []) as {
      id: string
      provider: string
      status: string
      email: string | null
      updated_at: string
    }[]).map((i) => ({
      id: i.id,
      provider: i.provider,
      status: i.status,
      email: i.email,
      updatedAt: i.updated_at,
    })),
    stats: {
      totalTickets: ticketsRaw.length,
      openTickets: openCountResult.count ?? 0,
      resolvedTickets: resolvedCountResult.count ?? 0,
      aiMessages: aiMessagesCount,
      totalMessages: totalOrgMessages,
      totalCustomers: customerCountResult.count ?? 0,
    },
  }
}

// ---------------------------------------------------------------------------
// Org Quick Actions
// ---------------------------------------------------------------------------

export async function adminChangePlan(
  orgId: string,
  plan: PlanKey
): Promise<{ success: boolean; error?: string }> {
  await requireOwnerRole()

  if (!(plan in PLANS)) return { success: false, error: 'Plan invalide' }

  const { error } = await supabaseAdmin
    .from('organizations')
    .update({ plan, updated_at: new Date().toISOString() })
    .eq('id', orgId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function adminSetSubscriptionStatus(
  orgId: string,
  status: 'active' | 'trialing' | 'canceled'
): Promise<{ success: boolean; error?: string }> {
  await requireOwnerRole()

  const { error } = await supabaseAdmin
    .from('organizations')
    .update({
      subscription_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
