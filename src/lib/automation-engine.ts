import { supabaseAdmin } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import type { Database, Json } from '@/types/database.types'

export type AutomationRecord = Database['public']['Tables']['automations']['Row']
type AutomationLogInsert = Database['public']['Tables']['automation_logs']['Insert']
type TicketRecord = Database['public']['Tables']['tickets']['Row']
type MessageRecord = Database['public']['Tables']['messages']['Row']

type Condition = {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'not_equals'
  value: string
}

export type TicketCandidate = Pick<
  TicketRecord,
  | 'id'
  | 'organization_id'
  | 'customer_id'
  | 'subject'
  | 'status'
  | 'priority'
  | 'channel'
  | 'assigned_to'
  | 'created_at'
  | 'updated_at'
  | 'metadata'
>

const TICKET_PRIORITIES: TicketRecord['priority'][] = ['low', 'medium', 'high', 'urgent']
const TICKET_STATUSES: TicketRecord['status'][] = ['open', 'pending', 'resolved', 'closed']
const AUTOMATION_TICKET_SELECT =
  'id, organization_id, customer_id, subject, status, priority, channel, assigned_to, created_at, updated_at, metadata'

export type CronSummary = {
  organizations: number
  automationsEvaluated: number
  ticketsMatched: number
  actionsExecuted: number
  duplicateSkips: number
  errors: Array<{ automationId: string; message: string }>
}

export function createCronSummary(organizations = 1): CronSummary {
  return {
    organizations,
    automationsEvaluated: 0,
    ticketsMatched: 0,
    actionsExecuted: 0,
    duplicateSkips: 0,
    errors: [],
  }
}

export function toObject(value: Json | null | undefined): Record<string, Json> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, Json>
  }
  return {}
}

export function toConditions(value: Json): Condition[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return []

    const raw = entry as Record<string, unknown>
    const field = typeof raw.field === 'string' ? raw.field : ''
    const operator =
      raw.operator === 'equals' ||
      raw.operator === 'contains' ||
      raw.operator === 'greater_than' ||
      raw.operator === 'less_than' ||
      raw.operator === 'not_equals'
        ? raw.operator
        : null
    const conditionValue =
      typeof raw.value === 'string'
        ? raw.value
        : raw.value == null
          ? ''
          : String(raw.value)

    if (!field || !operator) return []

    return [{ field, operator, value: conditionValue }]
  })
}

export function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string')
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return []
}

function parseTicketPriority(
  value: unknown,
  fallback: TicketRecord['priority']
): TicketRecord['priority'] {
  return TICKET_PRIORITIES.includes(value as TicketRecord['priority'])
    ? (value as TicketRecord['priority'])
    : fallback
}

function parseTicketStatus(
  value: unknown,
  fallback: TicketRecord['status']
): TicketRecord['status'] {
  return TICKET_STATUSES.includes(value as TicketRecord['status'])
    ? (value as TicketRecord['status'])
    : fallback
}

function parseTicketPriorities(value: unknown): TicketRecord['priority'][] {
  return toStringArray(value).filter((priority): priority is TicketRecord['priority'] =>
    TICKET_PRIORITIES.includes(priority as TicketRecord['priority'])
  )
}

function getSinceTimestamp(automation: AutomationRecord): string {
  return automation.last_executed_at ?? automation.created_at
}

function compareValues(left: unknown, right: string, operator: Condition['operator']): boolean {
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

function uniqueTickets(tickets: TicketCandidate[]): TicketCandidate[] {
  const seen = new Set<string>()
  const result: TicketCandidate[] = []

  for (const ticket of tickets) {
    if (seen.has(ticket.id)) continue
    seen.add(ticket.id)
    result.push(ticket)
  }

  return result
}

async function getRecentMessages(
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

export async function executeAction(
  ticket: TicketCandidate,
  automation: AutomationRecord
): Promise<boolean> {
  const actionConfig = toObject(automation.action_config)
  const nowIso = new Date().toISOString()

  switch (automation.action_type) {
    case 'change_priority': {
      const priority = parseTicketPriority(actionConfig.priority, ticket.priority)
      if (ticket.priority === priority) return false

      const { error } = await supabaseAdmin
        .from('tickets')
        .update({ priority, updated_at: nowIso })
        .eq('id', ticket.id)

      return !error
    }
    case 'change_status': {
      const status = parseTicketStatus(actionConfig.status, ticket.status)
      if (ticket.status === status) return false

      const { error } = await supabaseAdmin
        .from('tickets')
        .update({ status, updated_at: nowIso })
        .eq('id', ticket.id)

      return !error
    }
    case 'assign_agent': {
      const agentId = toString(actionConfig.agent_id)
      if (!agentId || ticket.assigned_to === agentId) return false

      const { error } = await supabaseAdmin
        .from('tickets')
        .update({ assigned_to: agentId, updated_at: nowIso })
        .eq('id', ticket.id)

      return !error
    }
    case 'send_reply': {
      const message = toString(actionConfig.message).trim()
      if (!message) return false

      const insertPayload: Database['public']['Tables']['messages']['Insert'] = {
        ticket_id: ticket.id,
        sender_type: 'system',
        sender_id: null,
        body: message,
        metadata: {
          automation: true,
          automation_id: automation.id,
          action_type: automation.action_type,
        },
      }

      const insertResult = await supabaseAdmin.from('messages').insert(insertPayload)
      if (insertResult.error) return false

      const ticketResult = await supabaseAdmin
        .from('tickets')
        .update({ updated_at: nowIso })
        .eq('id', ticket.id)

      return !ticketResult.error
    }
    case 'add_tag': {
      const tagName = toString(actionConfig.tag_name).trim()
      if (!tagName) return false

      const metadata = toObject(ticket.metadata)
      const existingTags = toStringArray(metadata.tags)
      if (existingTags.includes(tagName)) return false

      const nextMetadata: Json = {
        ...metadata,
        tags: [...existingTags, tagName],
      }

      const { error } = await supabaseAdmin
        .from('tickets')
        .update({ metadata: nextMetadata, updated_at: nowIso })
        .eq('id', ticket.id)

      return !error
    }
    case 'notify_slack':
      logger.info('Automation notify_slack placeholder', {
        organizationId: automation.organization_id,
        automationId: automation.id,
        ticketId: ticket.id,
      })
      return true
    default:
      return false
  }
}

async function getExistingLogTicketIds(
  automationId: string,
  ticketIds: string[]
): Promise<Set<string>> {
  if (ticketIds.length === 0) return new Set()

  const { data, error } = await supabaseAdmin
    .from('automation_logs')
    .select('ticket_id')
    .eq('automation_id', automationId)
    .in('ticket_id', ticketIds)

  if (error || !data) {
    console.error(`Failed to fetch automation logs for ${automationId}:`, error)
    return new Set()
  }

  return new Set(
    (data as Array<{ ticket_id: string | null }>)
      .map((row) => row.ticket_id)
      .filter((ticketId): ticketId is string => typeof ticketId === 'string')
  )
}

export async function processAutomation(
  automation: AutomationRecord,
  summary: CronSummary
): Promise<void> {
  const startedAt = new Date().toISOString()
  const eligibleTickets = await findEligibleTickets(automation)

  summary.automationsEvaluated += 1
  summary.ticketsMatched += eligibleTickets.length

  const loggedTicketIds = await getExistingLogTicketIds(
    automation.id,
    eligibleTickets.map((ticket) => ticket.id)
  )

  let executedCount = 0

  for (const ticket of eligibleTickets) {
    if (loggedTicketIds.has(ticket.id)) {
      summary.duplicateSkips += 1
      continue
    }

    try {
      const executed = await executeAction(ticket, automation)
      if (!executed) continue

      const logPayload: AutomationLogInsert = {
        automation_id: automation.id,
        ticket_id: ticket.id,
      }

      const logResult = await supabaseAdmin
        .from('automation_logs')
        .upsert(logPayload, {
          onConflict: 'automation_id,ticket_id',
          ignoreDuplicates: true,
        })

      if (logResult.error) {
        console.error(
          `Failed to persist automation log for ${automation.id}/${ticket.id}:`,
          logResult.error
        )
      }

      executedCount += 1
      summary.actionsExecuted += 1
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown automation execution error'
      console.error(`Automation ${automation.id} failed on ticket ${ticket.id}:`, message)
      summary.errors.push({ automationId: automation.id, message })
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from('automations')
    .update({
      execution_count: automation.execution_count + executedCount,
      last_executed_at: startedAt,
      updated_at: startedAt,
    })
    .eq('id', automation.id)

  if (updateError) {
    console.error(`Failed to update automation counters for ${automation.id}:`, updateError)
    summary.errors.push({
      automationId: automation.id,
      message: 'Failed to update execution counters',
    })
  }
}
