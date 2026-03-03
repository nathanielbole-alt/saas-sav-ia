'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Types ───────────────────────────────────────────────────────────────────

export type CustomerWithStats = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  created_at: string
  ticket_count: number
  last_contact: string | null
  // Intelligence 360°
  health_score: number
  segment: string
  total_spent: number
  notes: string | null
  tags: string[]
  last_satisfaction_score: number | null
  first_contact_at: string | null
  lifetime_tickets: number
  open_tickets: number
}

export type CustomerDetail = CustomerWithStats & {
  recent_tickets: {
    id: string
    subject: string
    status: string
    priority: string
    channel: string
    created_at: string
  }[]
}

export type TimelineEvent = {
  id: string
  type: 'ticket' | 'message'
  title: string
  description: string | null
  date: string
  metadata?: Record<string, unknown>
}

type SupabaseErrorLike = {
  code?: string
  message?: string
}

function getCustomerSchemaError(error: SupabaseErrorLike | null | undefined): string | null {
  const message = error?.message ?? ''

  if (
    error?.code === 'PGRST204' ||
    error?.code === '42703' ||
    message.includes("Could not find the 'notes' column") ||
    message.includes("Could not find the 'tags' column") ||
    message.includes("Could not find the 'segment' column") ||
    message.includes("Could not find the 'health_score' column")
  ) {
    return 'Les colonnes Client 360° ne sont pas encore présentes dans Supabase. Appliquez la migration SQL 20260302_customer_intelligence.sql puis rechargez le schema cache.'
  }

  return null
}

// ── getCustomers ────────────────────────────────────────────────────────────

export async function getCustomers(
  search?: string,
  sortBy: 'name' | 'email' | 'ticket_count' | 'last_contact' | 'health_score' = 'last_contact'
): Promise<CustomerWithStats[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('customers')
    .select('*, tickets(id, status, created_at)')

  if (error || !data) {
    console.error('Error fetching customers:', error)
    return []
  }

  let customers = (data as unknown[]).map((raw): CustomerWithStats => {
    const c = raw as Record<string, unknown>
    const tickets = (c.tickets as { id: string; status: string; created_at: string }[]) ?? []

    const sorted = [...tickets].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    const openCount = tickets.filter(t => t.status === 'open' || t.status === 'pending').length

    return {
      id: c.id as string,
      email: c.email as string,
      full_name: c.full_name as string | null,
      phone: c.phone as string | null,
      created_at: c.created_at as string,
      ticket_count: tickets.length,
      last_contact: sorted[0]?.created_at ?? null,
      health_score: (c.health_score as number) ?? 50,
      segment: (c.segment as string) ?? 'standard',
      total_spent: Number(c.total_spent ?? 0),
      notes: (c.notes as string) ?? null,
      tags: (c.tags as string[]) ?? [],
      last_satisfaction_score: c.last_satisfaction_score != null ? Number(c.last_satisfaction_score) : null,
      first_contact_at: (c.first_contact_at as string) ?? null,
      lifetime_tickets: (c.lifetime_tickets as number) ?? tickets.length,
      open_tickets: openCount,
    }
  })

  if (search?.trim()) {
    const q = search.toLowerCase()
    customers = customers.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.tags.some(tag => tag.toLowerCase().includes(q))
    )
  }

  customers.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email)
      case 'email':
        return a.email.localeCompare(b.email)
      case 'ticket_count':
        return b.ticket_count - a.ticket_count
      case 'health_score':
        return b.health_score - a.health_score
      case 'last_contact':
      default:
        if (!a.last_contact) return 1
        if (!b.last_contact) return -1
        return new Date(b.last_contact).getTime() - new Date(a.last_contact).getTime()
    }
  })

  return customers
}

// ── getCustomerDetail ───────────────────────────────────────────────────────

export async function getCustomerDetail(customerId: string): Promise<CustomerDetail | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*, tickets(id, subject, status, priority, channel, created_at)')
    .eq('id', customerId)
    .maybeSingle()

  if (error || !customer) return null

  const c = customer as Record<string, unknown>
  const tickets = (c.tickets as { id: string; subject: string; status: string; priority: string; channel: string; created_at: string }[]) ?? []
  const sorted = [...tickets].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'pending').length

  return {
    id: c.id as string,
    email: c.email as string,
    full_name: c.full_name as string | null,
    phone: c.phone as string | null,
    created_at: c.created_at as string,
    ticket_count: tickets.length,
    last_contact: sorted[0]?.created_at ?? null,
    health_score: (c.health_score as number) ?? 50,
    segment: (c.segment as string) ?? 'standard',
    total_spent: Number(c.total_spent ?? 0),
    notes: (c.notes as string) ?? null,
    tags: (c.tags as string[]) ?? [],
    last_satisfaction_score: c.last_satisfaction_score != null ? Number(c.last_satisfaction_score) : null,
    first_contact_at: (c.first_contact_at as string) ?? null,
    lifetime_tickets: (c.lifetime_tickets as number) ?? tickets.length,
    open_tickets: openCount,
    recent_tickets: sorted.slice(0, 10),
  }
}

// ── getCustomerTimeline ─────────────────────────────────────────────────────

export async function getCustomerTimeline(customerId: string): Promise<TimelineEvent[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // Get tickets for this customer
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, subject, status, priority, channel, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(20)

  const ticketIds = ((tickets ?? []) as { id: string }[]).map(t => t.id)

  // Get messages for those tickets
  let messages: { id: string; ticket_id: string; sender_type: string; body: string; created_at: string }[] = []
  if (ticketIds.length > 0) {
    const { data: msgData } = await supabase
      .from('messages')
      .select('id, ticket_id, sender_type, body, created_at')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: false })
      .limit(50)

    messages = (msgData ?? []) as typeof messages
  }

  const events: TimelineEvent[] = []

  // Add ticket creation events
  for (const raw of (tickets ?? []) as { id: string; subject: string; status: string; priority: string; channel: string; created_at: string }[]) {
    events.push({
      id: `ticket-${raw.id}`,
      type: 'ticket',
      title: raw.subject,
      description: `Ticket ${raw.status} — ${raw.priority} — ${raw.channel}`,
      date: raw.created_at,
      metadata: { status: raw.status, priority: raw.priority, channel: raw.channel },
    })
  }

  // Add message events
  for (const msg of messages) {
    const senderLabel = msg.sender_type === 'customer' ? 'Client' : msg.sender_type === 'ai' ? 'IA' : 'Agent'
    events.push({
      id: `msg-${msg.id}`,
      type: 'message',
      title: `${senderLabel} a envoyé un message`,
      description: msg.body.length > 100 ? msg.body.slice(0, 100) + '...' : msg.body,
      date: msg.created_at,
      metadata: { sender_type: msg.sender_type },
    })
  }

  // Sort by date descending
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return events.slice(0, 50)
}

// ── updateCustomerNotes ─────────────────────────────────────────────────────

export async function updateCustomerNotes(
  customerId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { error } = await supabase
    .from('customers')
    .update({ notes: notes.trim() || null })
    .eq('id', customerId)

  if (error) {
    console.error('Error updating customer notes:', error)
    return {
      success: false,
      error: getCustomerSchemaError(error) ?? 'Erreur lors de la mise à jour',
    }
  }

  revalidatePath('/dashboard/customers')
  return { success: true }
}

// ── addCustomerTag ──────────────────────────────────────────────────────────

export async function addCustomerTag(
  customerId: string,
  tag: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const cleanTag = tag.trim().toLowerCase()
  if (!cleanTag) return { success: false, error: 'Tag vide' }

  // Get current tags
  const { data: customer } = await supabase
    .from('customers')
    .select('tags')
    .eq('id', customerId)
    .maybeSingle()

  const currentTags = ((customer as Record<string, unknown> | null)?.tags as string[]) ?? []
  if (currentTags.includes(cleanTag)) {
    return { success: true } // Already has this tag
  }

  const { error } = await supabase
    .from('customers')
    .update({ tags: [...currentTags, cleanTag] })
    .eq('id', customerId)

  if (error) {
    console.error('Error adding customer tag:', error)
    return {
      success: false,
      error: getCustomerSchemaError(error) ?? 'Erreur lors de l\'ajout du tag',
    }
  }

  revalidatePath('/dashboard/customers')
  return { success: true }
}

// ── removeCustomerTag ───────────────────────────────────────────────────────

export async function removeCustomerTag(
  customerId: string,
  tag: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: customer } = await supabase
    .from('customers')
    .select('tags')
    .eq('id', customerId)
    .maybeSingle()

  const currentTags = ((customer as Record<string, unknown> | null)?.tags as string[]) ?? []

  const { error } = await supabase
    .from('customers')
    .update({ tags: currentTags.filter(t => t !== tag) })
    .eq('id', customerId)

  if (error) {
    console.error('Error removing customer tag:', error)
    return {
      success: false,
      error: getCustomerSchemaError(error) ?? 'Erreur lors de la suppression du tag',
    }
  }

  revalidatePath('/dashboard/customers')
  return { success: true }
}

// ── updateCustomerSegment ───────────────────────────────────────────────────

export async function updateCustomerSegment(
  customerId: string,
  segment: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const validSegments = ['vip', 'at_risk', 'new', 'standard', 'churned']
  if (!validSegments.includes(segment)) {
    return { success: false, error: 'Segment invalide' }
  }

  const { error } = await supabase
    .from('customers')
    .update({ segment })
    .eq('id', customerId)

  if (error) {
    console.error('Error updating customer segment:', error)
    return {
      success: false,
      error: getCustomerSchemaError(error) ?? 'Erreur lors de la mise à jour du segment',
    }
  }

  revalidatePath('/dashboard/customers')
  return { success: true }
}

// ── recalculateCustomerHealth ───────────────────────────────────────────────

export async function recalculateCustomerHealth(
  customerId: string
): Promise<{ success: boolean; health_score?: number; segment?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  // Get customer with tickets
  const { data: customer } = await supabase
    .from('customers')
    .select('*, tickets(id, status, priority, csat_rating, created_at)')
    .eq('id', customerId)
    .maybeSingle()

  if (!customer) return { success: false, error: 'Client introuvable' }

  const c = customer as Record<string, unknown>
  const tickets = (c.tickets as { id: string; status: string; priority: string; csat_rating: number | null; created_at: string }[]) ?? []

  // Calculate health score (0-100)
  let score = 50 // Base score

  // Factor 1: Resolution rate (+20)
  const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length
  if (tickets.length > 0) {
    score += Math.round((resolved / tickets.length) * 20)
  }

  // Factor 2: CSAT (+20)
  const csatRatings = tickets.filter(t => t.csat_rating != null).map(t => t.csat_rating as number)
  if (csatRatings.length > 0) {
    const avgCsat = csatRatings.reduce((a, b) => a + b, 0) / csatRatings.length
    score += Math.round((avgCsat / 5) * 20)
  }

  // Factor 3: No urgent tickets (+10)
  const urgentOpen = tickets.filter(t => t.priority === 'urgent' && (t.status === 'open' || t.status === 'pending')).length
  if (urgentOpen === 0) score += 10
  else score -= urgentOpen * 5

  // Factor 4: Recency penalty (-10 if no ticket in 90 days)
  const lastTicketDate = tickets.length > 0
    ? Math.max(...tickets.map(t => new Date(t.created_at).getTime()))
    : 0
  const daysSinceLastTicket = lastTicketDate > 0
    ? (Date.now() - lastTicketDate) / (1000 * 60 * 60 * 24)
    : 999

  if (daysSinceLastTicket > 90 && tickets.length > 0) {
    score -= 10
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score))

  // Auto-determine segment
  let segment: string
  if (score >= 80) segment = 'vip'
  else if (score >= 60) segment = 'standard'
  else if (score >= 40) segment = 'at_risk'
  else if (tickets.length === 0) segment = 'new'
  else segment = 'churned'

  // Update customer
  const { error } = await supabase
    .from('customers')
    .update({
      health_score: score,
      segment,
      lifetime_tickets: tickets.length,
      last_satisfaction_score: csatRatings.length > 0
        ? Math.round((csatRatings.reduce((a, b) => a + b, 0) / csatRatings.length) * 10) / 10
        : null,
    })
    .eq('id', customerId)

  if (error) {
    console.error('Error updating customer health:', error)
    return {
      success: false,
      error: getCustomerSchemaError(error) ?? 'Erreur lors du recalcul',
    }
  }

  revalidatePath('/dashboard/customers')
  return { success: true, health_score: score, segment }
}
