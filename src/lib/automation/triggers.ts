import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Json } from '@/types/database.types'
import { getRecentMessages, getSinceTimestamp, matchesConditions, uniqueTickets } from './matchers'
import {
  parseTicketPriorities,
  parseTicketPriority,
  toConditions,
  toNumber,
  toObject,
  toString,
  toStringArray,
} from './parsers'
import type { AutomationRecord, Condition, TicketCandidate } from './types'

const AUTOMATION_TICKET_SELECT =
  'id, organization_id, customer_id, subject, status, priority, channel, assigned_to, created_at, updated_at, metadata'

async function findNoReplyTimeoutTickets(
  automation: AutomationRecord,
  triggerConfig: Record<string, Json>,
  conditions: Condition[]
): Promise<TicketCandidate[]> {
  const timeoutHours = Math.max(1, Math.floor(toNumber(triggerConfig.timeout_hours, 4)))
  const mode = toString(triggerConfig.mode)
  const cutoffIso = new Date(Date.now() - timeoutHours * 60 * 60 * 1000).toISOString()

  if (mode === 'auto_close') {
    const { data, error } = await supabaseAdmin
      .from('tickets')
      .select(AUTOMATION_TICKET_SELECT)
      .eq('organization_id', automation.organization_id)
      .eq('status', 'resolved')
      .lt('updated_at', cutoffIso)
      .order('updated_at', { ascending: true })
      .limit(250)

    if (error || !data) {
      console.error(`Failed to fetch auto-close candidates for automation ${automation.id}:`, error)
      return []
    }

    const candidates = data as TicketCandidate[]
    const activeTickets = await getRecentMessages(
      candidates.map((ticket) => ticket.id),
      null,
      cutoffIso
    )

    return uniqueTickets(
      candidates.filter(
        (ticket) =>
          !activeTickets.has(ticket.id) && matchesConditions(ticket, conditions)
      )
    ).slice(0, 100)
  }

  if (mode === 'follow_up') {
    const { data, error } = await supabaseAdmin
      .from('tickets')
      .select(AUTOMATION_TICKET_SELECT)
      .eq('organization_id', automation.organization_id)
      .eq('status', 'pending')
      .lte('created_at', cutoffIso)
      .order('updated_at', { ascending: true })
      .limit(250)

    if (error || !data) {
      console.error(`Failed to fetch follow-up candidates for automation ${automation.id}:`, error)
      return []
    }

    const candidates = data as TicketCandidate[]
    const recentCustomerReplies = await getRecentMessages(
      candidates.map((ticket) => ticket.id),
      'customer',
      cutoffIso
    )

    return uniqueTickets(
      candidates.filter(
        (ticket) =>
          !recentCustomerReplies.has(ticket.id) &&
          matchesConditions(ticket, conditions)
      )
    ).slice(0, 100)
  }

  const targetPriority = parseTicketPriority(
    toObject(automation.action_config).priority,
    'urgent'
  )
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select(AUTOMATION_TICKET_SELECT)
    .eq('organization_id', automation.organization_id)
    .in('status', ['open', 'pending'])
    .neq('priority', targetPriority)
    .lte('created_at', cutoffIso)
    .order('updated_at', { ascending: true })
    .limit(250)

  if (error || !data) {
    console.error(`Failed to fetch escalation candidates for automation ${automation.id}:`, error)
    return []
  }

  const candidates = data as TicketCandidate[]
  const recentAgentReplies = await getRecentMessages(
    candidates.map((ticket) => ticket.id),
    'agent',
    cutoffIso
  )

  return uniqueTickets(
    candidates.filter(
      (ticket) =>
        !recentAgentReplies.has(ticket.id) && matchesConditions(ticket, conditions)
    )
  ).slice(0, 100)
}

async function findTicketCreatedTickets(
  automation: AutomationRecord,
  conditions: Condition[]
): Promise<TicketCandidate[]> {
  const since = getSinceTimestamp(automation)

  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select(AUTOMATION_TICKET_SELECT)
    .eq('organization_id', automation.organization_id)
    .gt('created_at', since)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error || !data) {
    console.error(`Failed to fetch ticket_created candidates for automation ${automation.id}:`, error)
    return []
  }

  return (data as TicketCandidate[]).filter((ticket) => matchesConditions(ticket, conditions))
}

async function findKeywordTickets(
  automation: AutomationRecord,
  triggerConfig: Record<string, Json>,
  conditions: Condition[]
): Promise<TicketCandidate[]> {
  const keywords = toStringArray(triggerConfig.keywords).map((keyword) =>
    keyword.toLowerCase()
  )
  if (keywords.length === 0) return []

  const since = getSinceTimestamp(automation)

  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select(AUTOMATION_TICKET_SELECT)
    .eq('organization_id', automation.organization_id)
    .gt('created_at', since)
    .order('created_at', { ascending: true })
    .limit(250)

  if (error || !data) {
    console.error(`Failed to fetch keyword candidates for automation ${automation.id}:`, error)
    return []
  }

  return (data as TicketCandidate[])
    .filter((ticket) =>
      keywords.some((keyword) => ticket.subject.toLowerCase().includes(keyword))
    )
    .filter((ticket) => matchesConditions(ticket, conditions))
    .slice(0, 100)
}

async function findPriorityChangedTickets(
  automation: AutomationRecord,
  triggerConfig: Record<string, Json>,
  conditions: Condition[]
): Promise<TicketCandidate[]> {
  const priorities = parseTicketPriorities(triggerConfig.to_priorities)
  const since = getSinceTimestamp(automation)

  if (priorities.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select(AUTOMATION_TICKET_SELECT)
    .eq('organization_id', automation.organization_id)
    .in('priority', priorities)
    .gt('updated_at', since)
    .order('updated_at', { ascending: true })
    .limit(100)

  if (error || !data) {
    console.error(`Failed to fetch priority_changed candidates for automation ${automation.id}:`, error)
    return []
  }

  return (data as TicketCandidate[]).filter((ticket) => matchesConditions(ticket, conditions))
}

export async function findEligibleTickets(
  automation: AutomationRecord
): Promise<TicketCandidate[]> {
  const triggerConfig = toObject(automation.trigger_config)
  const conditions = toConditions(automation.conditions)

  switch (automation.trigger_type) {
    case 'no_reply_timeout':
      return findNoReplyTimeoutTickets(automation, triggerConfig, conditions)
    case 'ticket_created':
      return findTicketCreatedTickets(automation, conditions)
    case 'keyword_detected':
      return findKeywordTickets(automation, triggerConfig, conditions)
    case 'priority_changed':
      return findPriorityChangedTickets(automation, triggerConfig, conditions)
    default:
      return []
  }
}
