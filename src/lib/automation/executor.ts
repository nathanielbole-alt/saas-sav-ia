import { supabaseAdmin } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import type { Database, Json } from '@/types/database.types'
import {
  parseTicketPriority,
  parseTicketStatus,
  toObject,
  toString,
  toStringArray,
} from './parsers'
import type { AutomationRecord, TicketCandidate } from './types'

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

export async function getExistingLogTicketIds(
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
