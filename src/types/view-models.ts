import type { Customer, Message, Ticket } from '@/types/database.types'

/**
 * A customer embedded in a ticket query result.
 * Matches the shape of a Supabase join: tickets!inner(*, customers(*))
 */
export type TicketCustomer = Pick<Customer, 'id' | 'email' | 'full_name' | 'metadata'>

/**
 * A message embedded in a ticket query result.
 */
export type TicketMessage = Pick<
  Message,
  'id' | 'body' | 'sender_type' | 'sender_id' | 'created_at' | 'metadata'
>

/**
 * The canonical view-model for a ticket with its relations.
 * This is what components receive — whether from mock data or real Supabase.
 *
 * Design rule: this type MUST be satisfiable by a real Supabase query result
 * with no transformation needed. Do NOT add fields that don't exist in the DB.
 */
export type TicketWithRelations = Ticket & {
  customer: TicketCustomer
  messages: TicketMessage[]
  /** Synthetic field: true if the latest message sender_type is 'customer' and
   *  the ticket has no agent reply since. Computed at query time or client-side. */
  unread: boolean
  /** Preview text from the most recent message body (trimmed to 120 chars) */
  last_message_preview: string | null
  /** created_at of the most recent message */
  last_message_at: string | null
  /** sender_type of the most recent message */
  last_message_sender_type: TicketMessage['sender_type'] | null
  /** Synthetic field: flattened tag names from the ticket_tags relation. */
  tags: string[]
}
