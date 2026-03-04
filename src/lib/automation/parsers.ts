import type { Json } from '@/types/database.types'
import type { Condition, TicketRecord } from './types'

const TICKET_PRIORITIES: TicketRecord['priority'][] = [
  'low',
  'medium',
  'high',
  'urgent',
]
const TICKET_STATUSES: TicketRecord['status'][] = [
  'open',
  'pending',
  'resolved',
  'closed',
]

export function toObject(
  value: Json | null | undefined
): Record<string, Json> {
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

export function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }

  return fallback
}

export function toStringArray(value: unknown): string[] {
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

export function parseTicketPriority(
  value: unknown,
  fallback: TicketRecord['priority']
): TicketRecord['priority'] {
  return TICKET_PRIORITIES.includes(value as TicketRecord['priority'])
    ? (value as TicketRecord['priority'])
    : fallback
}

export function parseTicketStatus(
  value: unknown,
  fallback: TicketRecord['status']
): TicketRecord['status'] {
  return TICKET_STATUSES.includes(value as TicketRecord['status'])
    ? (value as TicketRecord['status'])
    : fallback
}

export function parseTicketPriorities(
  value: unknown
): TicketRecord['priority'][] {
  return toStringArray(value).filter((priority): priority is TicketRecord['priority'] =>
    TICKET_PRIORITIES.includes(priority as TicketRecord['priority'])
  )
}
