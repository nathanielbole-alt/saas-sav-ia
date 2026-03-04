import type { Database } from '@/types/database.types'

export type AutomationRecord = Database['public']['Tables']['automations']['Row']
export type AutomationLogInsert =
  Database['public']['Tables']['automation_logs']['Insert']
export type TicketRecord = Database['public']['Tables']['tickets']['Row']
export type MessageRecord = Database['public']['Tables']['messages']['Row']

export type Condition = {
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
