'use client'

import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { createClient } from '@/lib/supabase/client'
// DEMO_MODE: realtime ticket state still targets demo ticket/message data until the UI fully uses DB-native models.
import type { Database } from '@/types/database.types'
import type { TicketMessage, TicketWithRelations } from '@/types/view-models'

type UseRealtimeTicketsResult = {
  tickets: TicketWithRelations[]
  setTickets: Dispatch<SetStateAction<TicketWithRelations[]>>
}

type TicketRow = Database['public']['Tables']['tickets']['Row']
type CustomerRow = Database['public']['Tables']['customers']['Row']
type MessageRow = Database['public']['Tables']['messages']['Row']
type TagRow = Database['public']['Tables']['tags']['Row']

type TicketRowWithRelations = TicketRow & {
  customer: CustomerRow | null
  messages: MessageRow[] | null
  tags: Array<{ tag: TagRow | null }> | null
}

function toTimestamp(value: string): number {
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function mapMessageRow(message: MessageRow): TicketMessage {
  return {
    id: message.id,
    body: message.body,
    sender_type: message.sender_type,
    sender_id: message.sender_id,
    created_at: message.created_at,
    metadata: message.metadata,
  }
}

function mapTicketRow(raw: TicketRowWithRelations): TicketWithRelations {
  const messages = (raw.messages ?? [])
    .slice()
    .sort((left, right) => toTimestamp(left.created_at) - toTimestamp(right.created_at))
    .map((message) => mapMessageRow(message))

  const lastMessage = messages[messages.length - 1] ?? null

  return {
    ...raw,
    customer: {
      id: raw.customer?.id ?? raw.customer_id,
      email: raw.customer?.email ?? '',
      full_name: raw.customer?.full_name ?? null,
      metadata: raw.customer?.metadata ?? null,
    },
    messages,
    unread: raw.status === 'open' && lastMessage?.sender_type === 'customer',
    tags: (raw.tags ?? [])
      .map((relation) => relation.tag?.name)
      .filter((name): name is string => Boolean(name)),
    last_message_preview: lastMessage?.body.slice(0, 120) ?? null,
    last_message_at: lastMessage?.created_at ?? null,
    last_message_sender_type: lastMessage?.sender_type ?? null,
  }
}

export function useRealtimeTickets(
  initialTickets: TicketWithRelations[],
  organizationId: string | null
): UseRealtimeTicketsResult {
  const [tickets, setTickets] = useState<TicketWithRelations[]>(initialTickets)

  useEffect(() => {
    if (!organizationId) return

    const supabase = createClient()

    const upsertMessage = (messageRow: MessageRow) => {
      setTickets((previousTickets) => {
        const ticketIndex = previousTickets.findIndex(
          (ticket) => ticket.id === messageRow.ticket_id
        )
        if (ticketIndex < 0) return previousTickets

        const targetTicket = previousTickets[ticketIndex]
        if (!targetTicket) return previousTickets

        if (targetTicket.messages.some((message) => message.id === messageRow.id)) {
          return previousTickets
        }

        const incomingMessage = mapMessageRow(messageRow)

        const messagesWithoutTempDuplicate = targetTicket.messages.filter((message) => {
          if (!message.id.startsWith('m-temp-')) return true
          if (message.sender_type !== incomingMessage.sender_type) return true
          if (message.body.trim() !== incomingMessage.body.trim()) return true

          const messageTime = toTimestamp(message.created_at)
          const incomingTime = toTimestamp(incomingMessage.created_at)
          return Math.abs(messageTime - incomingTime) > 2 * 60 * 1000
        })

        const updatedTicket: TicketWithRelations = {
          ...targetTicket,
          unread:
            incomingMessage.sender_type === 'agent'
              ? targetTicket.unread
              : incomingMessage.sender_type === 'customer',
          last_message_preview: incomingMessage.body.slice(0, 120),
          last_message_at: incomingMessage.created_at,
          last_message_sender_type: incomingMessage.sender_type,
          messages: [...messagesWithoutTempDuplicate, incomingMessage].sort(
            (left, right) =>
              toTimestamp(left.created_at) - toTimestamp(right.created_at)
          ),
        }

        const remainingTickets = previousTickets.filter(
          (_, index) => index !== ticketIndex
        )

        return [updatedTicket, ...remainingTickets]
      })
    }

    const upsertTicketFromDatabase = async (ticketId: string) => {
      const { data, error } = await supabase
        .from('tickets')
        .select(
          `
          *,
          customer:customers(*),
          messages(*),
          tags:ticket_tags(tag:tags(*))
        `
        )
        .eq('id', ticketId)
        .maybeSingle()

      if (error || !data) return

      const mappedTicket = mapTicketRow(data as unknown as TicketRowWithRelations)
      setTickets((previousTickets) => {
        const withoutCurrent = previousTickets.filter(
          (ticket) => ticket.id !== mappedTicket.id
        )
        return [mappedTicket, ...withoutCurrent]
      })
    }

    const updateTicket = (updatedRow: TicketRow) => {
      setTickets((previousTickets) =>
        previousTickets.map((ticket) =>
          ticket.id === updatedRow.id
            ? {
                ...ticket,
                subject: updatedRow.subject,
                status: updatedRow.status,
                priority: updatedRow.priority,
                channel: updatedRow.channel,
                assigned_to: updatedRow.assigned_to,
                metadata: updatedRow.metadata,
                ai_summary: updatedRow.ai_summary,
                csat_rating: updatedRow.csat_rating,
                csat_comment: updatedRow.csat_comment,
                csat_at: updatedRow.csat_at,
                created_at: updatedRow.created_at,
                updated_at: updatedRow.updated_at,
              }
            : ticket
        )
      )
    }

    const messagesChannel = supabase
      .channel(`messages-realtime-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const messageRow = payload.new as MessageRow
          upsertMessage(messageRow)
        }
      )
      .subscribe()

    const ticketsChannel = supabase
      .channel(`tickets-realtime-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const insertedRow = payload.new as TicketRow
            void upsertTicketFromDatabase(insertedRow.id)
            return
          }

          if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new as TicketRow
            updateTicket(updatedRow)
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(messagesChannel)
      void supabase.removeChannel(ticketsChannel)
    }
  }, [organizationId])

  return { tickets, setTickets }
}
