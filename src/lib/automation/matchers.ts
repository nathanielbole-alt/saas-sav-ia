import { supabaseAdmin } from '@/lib/supabase/admin'
import { toObject } from './parsers'
import type {
  AutomationRecord,
  Condition,
  MessageRecord,
  TicketCandidate,
} from './types'

export function getSinceTimestamp(automation: AutomationRecord): string {
  return automation.last_executed_at ?? automation.created_at
}

export function compareValues(
  left: unknown,
  right: string,
  operator: Condition['operator']
): boolean {
  const leftString = left == null ? '' : String(left)
  const normalizedLeft = leftString.toLowerCase()
  const normalizedRight = right.toLowerCase()

  if (operator === 'equals') return normalizedLeft === normalizedRight
  if (operator === 'not_equals') return normalizedLeft !== normalizedRight
  if (operator === 'contains') return normalizedLeft.includes(normalizedRight)

  const leftNumber = Number(leftString)
  const rightNumber = Number(right)
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return operator === 'greater_than'
      ? leftNumber > rightNumber
      : leftNumber < rightNumber
  }

  const leftDate = new Date(leftString).getTime()
  const rightDate = new Date(right).getTime()
  if (Number.isFinite(leftDate) && Number.isFinite(rightDate)) {
    return operator === 'greater_than' ? leftDate > rightDate : leftDate < rightDate
  }

  return operator === 'greater_than'
    ? normalizedLeft > normalizedRight
    : normalizedLeft < normalizedRight
}

export function matchesConditions(
  ticket: TicketCandidate,
  conditions: Condition[]
): boolean {
  if (conditions.length === 0) return true

  return conditions.every((condition) => {
    const source =
      condition.field in ticket
        ? (ticket as unknown as Record<string, unknown>)[condition.field]
        : toObject(ticket.metadata)[condition.field]

    return compareValues(source, condition.value, condition.operator)
  })
}

export function uniqueTickets(tickets: TicketCandidate[]): TicketCandidate[] {
  const seen = new Set<string>()
  const result: TicketCandidate[] = []

  for (const ticket of tickets) {
    if (seen.has(ticket.id)) continue
    seen.add(ticket.id)
    result.push(ticket)
  }

  return result
}

export async function getRecentMessages(
  ticketIds: string[],
  senderType: MessageRecord['sender_type'] | null,
  sinceIso: string
): Promise<Set<string>> {
  if (ticketIds.length === 0) return new Set()

  let query = supabaseAdmin
    .from('messages')
    .select('ticket_id')
    .in('ticket_id', ticketIds)
    .gte('created_at', sinceIso)

  if (senderType) {
    query = query.eq('sender_type', senderType)
  }

  const { data, error } = await query

  if (error || !data) {
    console.error('Failed to fetch recent messages for automation engine:', error)
    return new Set()
  }

  return new Set(
    (data as Array<{ ticket_id: string | null }>)
      .map((row) => row.ticket_id)
      .filter((ticketId): ticketId is string => typeof ticketId === 'string')
  )
}
