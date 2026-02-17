'use server'

import { createClient } from '@/lib/supabase/server'

export type AnalyticsData = {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  ticketsByChannel: {
    email: number
    form: number
    google_review: number
    manual: number
    instagram: number
    messenger: number
  }
  ticketsByPriority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  ticketsByStatus: {
    open: number
    pending: number
    resolved: number
    closed: number
  }
  recentTrend: {
    thisMonth: number
    lastMonth: number
  }
  customerCount: number
  ticketsOverTime: { date: string; count: number }[]
  // Advanced KPIs
  avgFirstResponseMinutes: number
  aiResolutionRate: number
  aiResponseCount: number
  avgCsatRating: number | null
  csatCount: number
  csatDistribution: { rating: number; count: number }[]
  ticketsByHour: { hour: number; count: number }[]
  avgResolutionHours: number
  reopenRate: number
}

export async function getAnalytics(): Promise<AnalyticsData | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch tickets with CSAT fields + updated_at for resolution time
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('id, status, priority, channel, csat_rating, created_at, updated_at')
    .order('created_at', { ascending: true })

  if (error || !tickets) {
    console.error('Error fetching analytics:', error)
    return null
  }

  // Fetch ALL messages for first-response, AI metrics, and reopen detection
  const { data: allMessages } = await supabase
    .from('messages')
    .select('ticket_id, sender_type, created_at')
    .order('created_at', { ascending: true })

  const { count: customerCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  // Initialize aggregators
  const statusCounts = { open: 0, pending: 0, resolved: 0, closed: 0 }
  const channelCounts = { email: 0, form: 0, google_review: 0, manual: 0, instagram: 0, messenger: 0 }
  const priorityCounts = { low: 0, medium: 0, high: 0, urgent: 0 }

  // Last 30 days trend
  const daysMap = new Map<string, number>()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(now.getDate() - 30)

  // Initialize last 30 days with 0
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]!
    daysMap.set(key, 0)
  }

  // CSAT aggregation
  let csatSum = 0
  let csatCount = 0

  for (const raw of tickets) {
    const t = raw as { status: string; priority: string; channel: string; csat_rating: number | null; created_at: string }
    if (!t.created_at) continue

    // Status
    if (t.status in statusCounts) statusCounts[t.status as keyof typeof statusCounts]++

    // Channel
    if (t.channel in channelCounts) channelCounts[t.channel as keyof typeof channelCounts]++

    // Priority
    if (t.priority in priorityCounts) priorityCounts[t.priority as keyof typeof priorityCounts]++

    // CSAT
    if (t.csat_rating != null) {
      csatSum += t.csat_rating
      csatCount++
    }

    // Trend
    const createdDate = new Date(t.created_at as string)
    if (createdDate >= thirtyDaysAgo) {
      const key = createdDate.toISOString().split('T')[0]!
      if (daysMap.has(key)) {
        daysMap.set(key, (daysMap.get(key) ?? 0) + 1)
      }
    }
  }

  const thisMonth = tickets.filter(
    (t) => {
      const created = (t as { created_at?: string }).created_at
      if (!created) return false
      return new Date(created as string) >= thisMonthStart
    }
  ).length

  const lastMonth = tickets.filter((t) => {
    const created = (t as { created_at?: string }).created_at
    if (!created) return false
    const date = new Date(created as string)
    return date >= lastMonthStart && date <= lastMonthEnd
  }).length

  // Convert map to sorted array for chart
  const ticketsOverTime = Array.from(daysMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // ── KPI A: Average First Response Time ──────────────────────────────
  // Build map of ticket_id → first agent/AI message timestamp
  const allMsgList = (allMessages ?? []) as { ticket_id: string; sender_type: string; created_at: string }[]
  const msgList = allMsgList.filter((m) => m.sender_type === 'agent' || m.sender_type === 'ai')
  const firstResponseByTicket = new Map<string, string>()
  for (const m of msgList) {
    if (!firstResponseByTicket.has(m.ticket_id)) {
      firstResponseByTicket.set(m.ticket_id, m.created_at)
    }
  }

  let totalResponseMinutes = 0
  let responseCount = 0
  for (const raw of tickets) {
    const t = raw as { id: string; created_at: string }
    const firstMsg = firstResponseByTicket.get(t.id)
    if (firstMsg) {
      const diff = new Date(firstMsg).getTime() - new Date(t.created_at).getTime()
      if (diff >= 0) {
        totalResponseMinutes += diff / 60_000
        responseCount++
      }
    }
  }
  const avgFirstResponseMinutes = responseCount > 0 ? Math.round(totalResponseMinutes / responseCount) : 0

  // ── KPI B: AI Resolution Rate ───────────────────────────────────────
  // Count tickets that have at least one AI message
  const ticketsWithAi = new Set<string>()
  let aiResponseCount = 0
  for (const m of msgList) {
    if (m.sender_type === 'ai') {
      ticketsWithAi.add(m.ticket_id)
      aiResponseCount++
    }
  }

  const resolvedOrClosed = tickets.filter((t) => {
    const s = (t as { status: string }).status
    return s === 'resolved' || s === 'closed'
  })
  const resolvedWithAi = resolvedOrClosed.filter((t) => ticketsWithAi.has((t as { id: string }).id))
  const aiResolutionRate = resolvedOrClosed.length > 0
    ? Math.round((resolvedWithAi.length / resolvedOrClosed.length) * 100)
    : 0

  // ── KPI C: CSAT ─────────────────────────────────────────────────────
  const avgCsatRating = csatCount > 0 ? Math.round((csatSum / csatCount) * 10) / 10 : null

  // CSAT distribution (1-5)
  const csatDist = [0, 0, 0, 0, 0]
  for (const raw of tickets) {
    const rating = (raw as { csat_rating: number | null }).csat_rating
    if (rating != null && rating >= 1 && rating <= 5) {
      csatDist[rating - 1]!++
    }
  }
  const csatDistribution = csatDist.map((count, i) => ({ rating: i + 1, count }))

  // ── KPI D: Tickets by Hour ────────────────────────────────────────
  const hourCounts = new Array<number>(24).fill(0)
  for (const raw of tickets) {
    const created = (raw as { created_at: string }).created_at
    if (created) {
      const hour = new Date(created).getHours()
      hourCounts[hour]!++
    }
  }
  const ticketsByHour = hourCounts.map((count, hour) => ({ hour, count }))

  // ── KPI E: Average Resolution Time (hours) ────────────────────────
  let totalResolutionHours = 0
  let resolutionCount = 0
  for (const raw of resolvedOrClosed) {
    const t = raw as { created_at: string; updated_at: string }
    if (t.created_at && t.updated_at) {
      const diff = new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()
      if (diff >= 0) {
        totalResolutionHours += diff / 3_600_000
        resolutionCount++
      }
    }
  }
  const avgResolutionHours = resolutionCount > 0
    ? Math.round((totalResolutionHours / resolutionCount) * 10) / 10
    : 0

  // ── KPI F: Reopen Rate ────────────────────────────────────────────
  // Tickets resolved/closed that have a customer message after updated_at
  const customerMsgsByTicket = new Map<string, string[]>()
  for (const m of allMsgList) {
    if (m.sender_type === 'customer') {
      const list = customerMsgsByTicket.get(m.ticket_id) ?? []
      list.push(m.created_at)
      customerMsgsByTicket.set(m.ticket_id, list)
    }
  }

  let reopenedCount = 0
  for (const raw of resolvedOrClosed) {
    const t = raw as { id: string; updated_at: string }
    const customerMsgs = customerMsgsByTicket.get(t.id)
    if (customerMsgs && t.updated_at) {
      const resolvedAt = new Date(t.updated_at).getTime()
      const hasPostResolutionMsg = customerMsgs.some(
        (msgTime) => new Date(msgTime).getTime() > resolvedAt
      )
      if (hasPostResolutionMsg) reopenedCount++
    }
  }
  const reopenRate = resolvedOrClosed.length > 0
    ? Math.round((reopenedCount / resolvedOrClosed.length) * 100)
    : 0

  return {
    totalTickets: tickets.length,
    openTickets: statusCounts.open,
    resolvedTickets: statusCounts.resolved,
    ticketsByChannel: channelCounts,
    ticketsByPriority: priorityCounts,
    ticketsByStatus: statusCounts,
    recentTrend: { thisMonth, lastMonth },
    customerCount: customerCount ?? 0,
    ticketsOverTime,
    avgFirstResponseMinutes,
    aiResolutionRate,
    aiResponseCount,
    avgCsatRating,
    csatCount,
    csatDistribution,
    ticketsByHour,
    avgResolutionHours,
    reopenRate,
  }
}
